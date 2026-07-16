from fastapi import APIRouter, Request, HTTPException

from app.tutor.models import TutorRequest, TutorResponse, UsageResponse
from app.tutor.identity import get_anon_id
from app.tutor import config, service, store

router = APIRouter(prefix="/api/tutor", tags=["tutor"])


@router.post("/ask", response_model=TutorResponse)
def ask(req: TutorRequest, request: Request):
    error, response = service.answer_question(req, request)
    if error:
        raise HTTPException(status_code=error.status_code, detail=error.message)
    return response


@router.get("/usage", response_model=UsageResponse)
def usage(request: Request):
    anon_id = get_anon_id(request)
    remaining = store.remaining_for_anon(f"anon:{anon_id}", config.DAILY_LIMIT_PER_ANON)
    return UsageResponse(
        remaining_today=remaining,
        daily_limit=config.DAILY_LIMIT_PER_ANON,
        cooldown_seconds=config.COOLDOWN_SECONDS,
    )
