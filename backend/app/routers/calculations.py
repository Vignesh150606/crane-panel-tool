from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["Calculations"])

@router.get("/ping")
def ping():
    return {"message": "Calculations router working"}