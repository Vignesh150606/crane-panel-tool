from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import calculations

app = FastAPI(
    title="Crane Panel Tool API",
    description="Engineering calculations for EOT crane control panel design",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(calculations.router)

@app.get("/")
def root():
    return {"status": "running", "app": "Crane Panel Tool API"}

@app.get("/health")
def health():
    return {"healthy": True}