"""
Calls Gemini via Google's `google-genai` SDK (the current recommended
Python client as of this feature's build — the older `google-generativeai`
package is deprecated; see requirements.txt).

The API key never leaves the backend process: it's read from the
GEMINI_API_KEY environment variable (set in Render's dashboard) and is
never included in any response sent to the frontend, logged, or echoed
back in error messages.
"""
from functools import lru_cache

from app.tutor import config
from app.tutor.prompt_builder import SYSTEM_INSTRUCTION, GeminiOutput


class GeminiNotConfigured(Exception):
    pass


class GeminiRequestFailed(Exception):
    pass


@lru_cache
def _get_client():
    if not config.GEMINI_API_KEY:
        return None
    from google import genai
    return genai.Client(api_key=config.GEMINI_API_KEY)


def ask_gemini(contents: str) -> GeminiOutput:
    client = _get_client()
    if client is None:
        raise GeminiNotConfigured("GEMINI_API_KEY is not set on the backend.")

    from google.genai import types

    try:
        response = client.models.generate_content(
            model=config.GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=GeminiOutput,
                temperature=0.3,
                max_output_tokens=600,
            ),
        )
    except Exception as exc:  # network/quota/auth errors from the SDK
        raise GeminiRequestFailed(str(exc)) from exc

    parsed = getattr(response, "parsed", None)
    if isinstance(parsed, GeminiOutput):
        return parsed

    # Fall back to manually validating response.text if the SDK's own
    # Pydantic parsing didn't populate `.parsed` for some reason.
    if getattr(response, "text", None):
        return GeminiOutput.model_validate_json(response.text)

    raise GeminiRequestFailed("Gemini returned an empty or unparseable response.")
