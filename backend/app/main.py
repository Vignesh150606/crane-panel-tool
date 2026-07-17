from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.config import ALLOWED_ORIGINS, ALLOWED_ORIGIN_REGEX
from app.routers import calculations, cable, bom, tutor

app = FastAPI(
    title="Crane Panel Tool API",
    description="Engineering calculations for EOT crane control panel design — single source of truth for every formula used by the frontend.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ALLOWED_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """Turn Pydantic validation errors into a flat, frontend-friendly shape."""
    errors = [
        {"field": ".".join(str(p) for p in e["loc"][1:]), "message": e["msg"]}
        for e in exc.errors()
    ]
    return JSONResponse(status_code=422, content={"detail": "Validation failed", "errors": errors})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    """
    Without this, an unhandled exception anywhere in the app is caught by
    Starlette's ServerErrorMiddleware, which sits OUTSIDE CORSMiddleware —
    so the resulting 500 response never gets CORS headers added, and the
    browser reports it as a CORS error even though the real problem is the
    exception itself. A handler registered here runs inside the normal
    exception-handling layer (which CORSMiddleware does wrap), so the
    response gets CORS headers like any other. Logs the real exception to
    stdout (visible in Render's logs) without leaking internals to the client.
    """
    print(f"[unhandled] {request.method} {request.url.path}: {exc!r}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.include_router(calculations.router)
app.include_router(cable.router)
app.include_router(bom.router)
app.include_router(tutor.router)


@app.get("/")
def root():
    return {"status": "running", "app": "Crane Panel Tool API", "version": "2.0.0"}


@app.get("/health")
def health():
    return {"healthy": True}
