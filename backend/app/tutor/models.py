"""
Request/response shapes for the Engineering Tutor endpoint.

The frontend owns all the application state (Zustand stores, persisted to
localStorage — there is no backend database of user projects). So instead
of the backend reaching into a database to find "what is this student
looking at", the frontend gathers everything relevant from its own stores
and the current route, and sends it up as `context` on every request. The
backend never has to guess — see `frontend/src/tutor/contextBuilder.js`.

Handbook retrieval is the same story: `handbookContent.js` is the single
source of truth for engineering content already, so it stays that way —
the frontend searches it (via `data/workspaceIndex.js`) and sends the
matched excerpts as `context.handbook_excerpts`. The backend does not keep
a second copy of the handbook to search server-side.
"""
from typing import Optional
from pydantic import BaseModel, Field


class HandbookExcerpt(BaseModel):
    """One handbook topic the frontend judged relevant to this question."""
    id: str
    title: str
    section_title: Optional[str] = None
    equation: Optional[str] = None
    meaning: Optional[str] = None
    common_mistakes: list[str] = Field(default_factory=list)


class ChatTurn(BaseModel):
    role: str  # 'user' | 'tutor'
    content: str = Field(max_length=2000)


class TutorContext(BaseModel):
    """Everything visible to the student right now, gathered client-side."""
    page_path: str
    page_label: Optional[str] = None
    page_description: Optional[str] = None

    # Project-level selections (from projectStore) — free-form summaries,
    # not raw calculator payloads, to keep the prompt small and stable
    # even if the store's internal shape changes later.
    crane_type: Optional[str] = None
    motor_summary: Optional[str] = None
    cable_summary: Optional[str] = None
    star_delta_summary: Optional[str] = None
    bom_summary: Optional[str] = None
    nameplate_summary: Optional[str] = None

    # Training-module state (from trainingStore / page-local state)
    simulation_summary: Optional[str] = None
    challenge_summary: Optional[str] = None
    commissioning_summary: Optional[str] = None

    # A specific formula/result block the student is looking at, if any
    # (e.g. they asked a question from inside an open FormulaExplainer).
    focused_topic_id: Optional[str] = None
    focused_topic_title: Optional[str] = None

    handbook_excerpts: list[HandbookExcerpt] = Field(default_factory=list)


class TutorRequest(BaseModel):
    question: str = Field(min_length=1, max_length=300)
    context: TutorContext
    history: list[ChatTurn] = Field(default_factory=list)


class NavigationSuggestion(BaseModel):
    to: str  # e.g. "/handbook#overload-relay" or "/control-circuit"
    label: str  # e.g. "Open Handbook: Overload Relay"


class TutorResponse(BaseModel):
    answer: str
    cached: bool = False
    refused: bool = False
    navigation: Optional[NavigationSuggestion] = None
    remaining_today: int
    daily_limit: int


class UsageResponse(BaseModel):
    remaining_today: int
    daily_limit: int
    cooldown_seconds: int
