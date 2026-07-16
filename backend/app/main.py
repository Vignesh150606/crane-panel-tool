from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.config import ALLOWED_ORIGINS
from app.routers import calculations, cable, bom, tutor

app = FastAPI(
    title="Crane Panel Tool API",
    description="Engineering calculations for EOT crane control panel design — single source of truth for every formula used by the frontend.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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
