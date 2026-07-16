"""
Orchestrates one tutor question end to end. This is the only place that
knows the full order of operations — the router (routers/tutor.py) just
calls `answer_question` and turns the result into an HTTP response.

Order of operations:
    1. Reject if the prompt is too long (defense in depth — Pydantic's
       max_length on the request model already enforces this at the HTTP
       layer, but a clear error here is friendlier than a 422).
    2. Reject obvious prompt-injection phrasing before spending a Gemini
       call or a rate-limit slot on it.
    3. Rate limit: anon id first (the primary, user-facing limit), then
       IP (the coarser backstop) — see identity.py for why in that order.
    4. Cache: only for questions judged definitional (domain_guard.py) —
       serving a cached answer to a context-specific question would risk
       giving someone else's calculation numbers to this student.
    5. Build the prompt (handbook → page → selections → training state →
       history → question) and call Gemini.
    6. Cache the result if it was a definitional question and Gemini didn't
       refuse it.
"""
from dataclasses import dataclass
from typing import Optional

from fastapi import Request

from app.tutor import config, domain_guard, prompt_builder, gemini_client, store
from app.tutor.identity import get_anon_id, get_ip
from app.tutor.models import TutorRequest, TutorResponse, NavigationSuggestion


@dataclass
class TutorError:
    status_code: int
    message: str


def _rate_limit_check(anon_id: str, ip: str) -> Optional[TutorError]:
    anon_result = store.try_consume(
        f"anon:{anon_id}", config.DAILY_LIMIT_PER_ANON, config.COOLDOWN_SECONDS
    )
    if not anon_result.allowed:
        if anon_result.reason == "cooldown":
            return TutorError(429, f"Please wait {anon_result.retry_after_seconds}s between questions.")
        return TutorError(429, config.LIMIT_REACHED_MESSAGE)

    ip_result = store.try_consume(f"ip:{ip}", config.DAILY_LIMIT_PER_IP, 0)
    if not ip_result.allowed:
        # Deliberately the same generic message — no need to expose that
        # this was the IP-level backstop rather than the anon-id limit.
        return TutorError(429, config.LIMIT_REACHED_MESSAGE)

    return None


def answer_question(req: TutorRequest, request: Request) -> tuple[Optional[TutorError], Optional[TutorResponse]]:
    question = req.question.strip()
    if not question:
        return TutorError(400, "Question cannot be empty."), None
    if len(question) > config.MAX_PROMPT_CHARS:
        return TutorError(400, f"Questions are limited to {config.MAX_PROMPT_CHARS} characters."), None

    anon_id = get_anon_id(request)
    ip = get_ip(request)

    # Rate limit BEFORE the injection check, deliberately: every call to
    # /ask consumes one of the day's questions, refused or not. Otherwise
    # someone could hammer this endpoint for free forever just by phrasing
    # every request as an obvious jailbreak attempt, since that path never
    # reaches Gemini and would otherwise never cost a quota slot.
    rate_error = _rate_limit_check(anon_id, ip)
    if rate_error:
        return rate_error, None

    if domain_guard.looks_like_injection(question):
        return None, TutorResponse(
            answer=(
                "I'm the Engineering Tutor for this learning platform — I can only help "
                "with crane control panel design, motor selection, protection devices, "
                "circuits, and the other topics covered in this app."
            ),
            refused=True,
            remaining_today=store.remaining_for_anon(f"anon:{anon_id}", config.DAILY_LIMIT_PER_ANON),
            daily_limit=config.DAILY_LIMIT_PER_ANON,
        )

    cacheable = domain_guard.is_definitional(question)
    if cacheable:
        cached = store.get_cached(question)
        if cached:
            return None, TutorResponse(
                answer=cached.answer,
                cached=True,
                navigation=(
                    NavigationSuggestion(to=cached.navigation_to, label=cached.navigation_label)
                    if cached.navigation_to else None
                ),
                remaining_today=store.remaining_for_anon(f"anon:{anon_id}", config.DAILY_LIMIT_PER_ANON),
                daily_limit=config.DAILY_LIMIT_PER_ANON,
            )

    contents = prompt_builder.build_contents(question, req.context, req.history)

    try:
        result = gemini_client.ask_gemini(contents)
    except gemini_client.GeminiNotConfigured:
        return TutorError(503, "The Engineering Tutor isn't configured yet — no Gemini API key is set."), None
    except gemini_client.GeminiRequestFailed:
        return TutorError(502, "The Engineering Tutor couldn't reach Gemini right now. Please try again shortly."), None

    if cacheable and not result.refused:
        store.put_cached(question, req.context.page_path, result.answer, result.navigate_to, result.navigate_label)

    return None, TutorResponse(
        answer=result.answer,
        refused=result.refused,
        navigation=(
            NavigationSuggestion(to=result.navigate_to, label=result.navigate_label)
            if result.navigate_to and result.navigate_label else None
        ),
        remaining_today=store.remaining_for_anon(f"anon:{anon_id}", config.DAILY_LIMIT_PER_ANON),
        daily_limit=config.DAILY_LIMIT_PER_ANON,
    )
