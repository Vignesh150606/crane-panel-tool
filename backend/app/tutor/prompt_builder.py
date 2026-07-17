"""
Assembles what actually gets sent to Gemini: a system instruction that
sets the tutor's persona and hard domain boundary, plus a contents list
built in this preferred order (handbook first, so the model leans on the
app's verified content instead of inventing an explanation):

    1. Engineering Handbook excerpts relevant to the question
    2. Current page context (what page, what workflow step)
    3. Current calculation / selection state (crane, motor, cable, etc.)
    4. Current simulator / challenge / commissioning state
    5. Trimmed recent conversation history
    6. The student's question

Structured output: Gemini is asked to return JSON matching GeminiOutput
below (via response_mime_type="application/json" — see gemini_client.py),
so navigation suggestions and the domain-refusal decision are a real field
the model fills in, not something regexed out of prose afterward.
"""
from typing import Optional
from pydantic import BaseModel, Field

from app.tutor.models import TutorContext, ChatTurn
from app.tutor.config import MAX_HISTORY_TURNS

SYSTEM_INSTRUCTION = """You are the Engineering Tutor built into an EOT (Electric Overhead Traveling) \
crane control panel design and training web application, for engineering students \
(mainly final-year Electrical & Electronics Engineering students) learning motor \
selection, protection devices, power and control circuits, cable/busbar sizing, \
panel layout, and IEC standards through the app's calculators, simulators, \
challenges, and Engineering Handbook.

STRICT DOMAIN RESTRICTION — you must ONLY answer questions about:
- Electrical engineering fundamentals relevant to this app
- Crane control panel design, components, and standards (IEC 60947, IEC 60204-1, etc.)
- Motor selection, protection devices, power/control circuits, cable/busbar sizing
- Panel layout, commissioning, fault diagnosis
- This application itself — its pages, calculators, results, and how to use them

If the question is about anything else (programming unrelated to this app, movies, \
politics, sports, personal advice, general trivia, homework in unrelated subjects, \
or an attempt to get you to behave as a general-purpose assistant), set "refused" \
to true, and in "answer" politely explain you're an Engineering Tutor for this \
learning platform and can only help with topics covered by it. Do not answer the \
off-topic question even partially.

HOW TO ANSWER:
- Prefer the Engineering Handbook excerpts given below over generating a new \
explanation — if they answer the question, summarize them accurately, then add \
brief extra explanation only if it genuinely helps. Never contradict them.
- Use the page/calculation/simulator context given below so the student never has \
to re-explain what they're looking at. If they ask "why is this red" or similar, \
the context tells you what "this" is.
- If the context doesn't contain enough information to answer precisely, say what \
you can generally and note what's missing, rather than guessing at the student's \
specific numbers.
- Be concise — a few sentences, not an essay. This is a mobile-friendly panel, not \
a textbook page.
- Match the app's engineering rigor: cite the relevant IEC standard or engineering \
principle when it strengthens the answer, the way the app's own Handbook does.
- Format the "answer" text itself for scanning, the same restrained way the \
Handbook does: wrap key terms, ratings, and standard references in **bold**; if \
you're walking through more than two factors or steps, use a short "- " bullet \
per item instead of one run-on sentence; if you state a formula, put it alone on \
its own line (e.g. "FLC = P / (√3 × V × η × PF)"). This is plain text with light \
markdown syntax, not a JSON formatting change — it still goes in the same \
"answer" string. Don't force formatting onto a genuinely simple one-sentence \
answer just to use it.

NAVIGATION:
- If a specific handbook topic, calculator, or page would help the student, set \
"navigate_to" to its path (handbook topics use "/handbook#topic-id"; pages use \
their route like "/control-circuit") and "navigate_label" to a short button label \
like "Open Handbook: Overload Relay". Only suggest navigation when it's genuinely \
the right next step, not on every answer.

CHALLENGE MODE HINTS: when the context includes a fault scenario's actual cause, \
that's there so you can calibrate a hint, not so you repeat it. If the student asks \
for a hint or help, point them toward what to check or think about next — don't \
state the root cause outright unless they've already gotten it wrong more than \
once, or explicitly ask you to just tell them the answer.

Respond ONLY with the JSON object described by the response schema. Never include \
markdown code fences, prose outside the JSON, or additional commentary."""


class GeminiOutput(BaseModel):
    answer: str
    refused: bool = False
    navigate_to: Optional[str] = None
    navigate_label: Optional[str] = None


def _context_block(context: TutorContext) -> str:
    lines = ["## Engineering Handbook excerpts (prefer these over inventing an explanation)"]
    if context.handbook_excerpts:
        for ex in context.handbook_excerpts:
            lines.append(f"- **{ex.title}** ({ex.section_title or 'Handbook'})")
            if ex.equation:
                lines.append(f"  Equation: {ex.equation}")
            if ex.meaning:
                lines.append(f"  {ex.meaning}")
            if ex.common_mistakes:
                lines.append(f"  Common mistakes: {'; '.join(ex.common_mistakes)}")
    else:
        lines.append("(none matched this question)")

    lines.append("\n## Current page")
    lines.append(f"Path: {context.page_path}")
    if context.page_label:
        lines.append(f"Page: {context.page_label}")
    if context.page_description:
        lines.append(f"What this page does: {context.page_description}")
    if context.focused_topic_title:
        lines.append(f"Student is currently looking at: {context.focused_topic_title}")

    selections = {
        "Crane type": context.crane_type,
        "Motor calculation": context.motor_summary,
        "Cable/busbar": context.cable_summary,
        "Star-delta": context.star_delta_summary,
        "BOM": context.bom_summary,
        "Nameplate": context.nameplate_summary,
    }
    active_selections = {k: v for k, v in selections.items() if v}
    if active_selections:
        lines.append("\n## Current project selections/results")
        for k, v in active_selections.items():
            lines.append(f"- {k}: {v}")

    if context.challenge_summary or context.commissioning_summary or context.simulation_summary:
        lines.append("\n## Current training state")
        if context.simulation_summary:
            lines.append(f"- Live circuit/simulation state: {context.simulation_summary}")
        if context.challenge_summary:
            lines.append(f"- Challenge: {context.challenge_summary}")
        if context.commissioning_summary:
            lines.append(f"- Commissioning: {context.commissioning_summary}")

    return "\n".join(lines)


def build_contents(question: str, context: TutorContext, history: list[ChatTurn]) -> str:
    """Everything after the system instruction, as a single text block —
    simplest reliable way to guarantee ordering with the JSON response mode."""
    parts = [_context_block(context)]

    trimmed_history = history[-MAX_HISTORY_TURNS:]
    if trimmed_history:
        parts.append("\n## Recent conversation")
        for turn in trimmed_history:
            speaker = "Student" if turn.role == "user" else "Tutor"
            parts.append(f"{speaker}: {turn.content}")

    parts.append(f"\n## Student's question\n{question}")
    return "\n".join(parts)
