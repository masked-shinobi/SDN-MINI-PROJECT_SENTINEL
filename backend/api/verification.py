from fastapi import APIRouter
from services.quarantine_manager import quarantine_manager

router = APIRouter(prefix="/api/verification", tags=["Verification"])

@router.get("/tests")
def run_tests():
    report = quarantine_manager.run_connectivity_tests()
    return report.model_dump()

@router.post("/run")
async def execute_verification():
    report = quarantine_manager.run_connectivity_tests()
    await quarantine_manager.broadcast_event("TESTS_EXECUTED", report.model_dump())
    return report.model_dump()
