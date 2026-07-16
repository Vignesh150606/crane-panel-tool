"""
Two lightweight, deliberately narrow heuristic checks that run BEFORE
Gemini is ever called. These are defense in depth, not the primary
domain-restriction mechanism — that's the system prompt (see
prompt_builder.py), which is far better than any keyword list at
understanding "is this actually about crane panels" with nuance.

What lives here instead is the stuff a keyword list *is* reliable for:
obvious prompt-injection phrasing, and requests to role-play as a
different, unrestricted assistant. A keyword blocklist for "off-topic"
would false-positive on legitimate engineering questions constantly, so
that judgment call is deliberately left to Gemini's system prompt, not
duplicated here.
"""
import re

_INJECTION_PATTERNS = [
    r"ignore (all|the|your|previous|prior) instructions",
    r"disregard (all|the|your|previous|prior) instructions",
    r"you are (now|actually) (chatgpt|a general|an unrestricted|not bound)",
    r"pretend (you are|to be) (chatgpt|an? \w+ (assistant|ai))",
    r"act as (chatgpt|a jailbroken|an unrestricted|dan\b)",
    r"reveal (your|the) system prompt",
    r"what (is|are) your (system prompt|instructions)",
    r"forget (you are|your role|everything)",
    r"new instructions?:",
    r"override your (rules|restrictions|guidelines)",
]
_INJECTION_RE = re.compile("|".join(_INJECTION_PATTERNS), re.IGNORECASE)


def looks_like_injection(question: str) -> bool:
    return bool(_INJECTION_RE.search(question))


# ── Definitional-question detection (for caching eligibility only) ──────
# Deliberately conservative: only questions matching one of these shapes
# are ever cache candidates. Anything else (which is most questions — "why
# is THIS red", "could I use a smaller contactor HERE") is answered fresh
# every time, because the answer legitimately depends on the student's own
# live numbers and would be wrong if served to someone else.
_DEFINITIONAL_PATTERNS = [
    r"^what is\b",
    r"^what('?s| is) (a|an|the)\b",
    r"^define\b",
    r"^why (do we use|use)\b",
    r"^what does .+ (stand for|mean)\b",
    r"^difference between\b",
    # Bare noun-phrase shorthand for "why do we use X" — e.g. "Why overload
    # relay?", "Why star-delta?". Kept short (<=6 words) and gated on the
    # deictic/event-state check below so it can't swallow a specific
    # question like "Why didn't KM2 energize?".
    r"^why [a-z][a-z0-9\-\s]{0,35}\??$",
]
_DEFINITIONAL_RE = re.compile("|".join(_DEFINITIONAL_PATTERNS), re.IGNORECASE)

# Words that signal the question is anchored to the student's own current
# state or a specific live event, not a generic definition — disqualifies
# caching even if the question also matches a definitional pattern above.
_DEICTIC_RE = re.compile(
    r"\b(this|these|that|those|here|my|mine|i (have|got|entered|chose|selected)|"
    r"red|wrong|fail(ed|s)?|fault|trip(ped)?|energi[sz]e|de-?energi[sz]e|"
    r"didn'?t|doesn'?t|isn'?t|wasn'?t|won'?t|can'?t|couldn'?t|shouldn'?t|not\b)\b",
    re.IGNORECASE,
)


def is_definitional(question: str) -> bool:
    q = question.strip()
    if not q or len(q.split()) > 8:
        return False
    if _DEICTIC_RE.search(q):
        return False
    return bool(_DEFINITIONAL_RE.search(q))
