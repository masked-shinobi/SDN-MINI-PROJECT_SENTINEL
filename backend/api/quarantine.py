from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.quarantine_manager import quarantine_manager

router = APIRouter(prefix="/api/quarantine", tags=["Quarantine Operations"])

class QuarantineAction(BaseModel):
    source_ip: Optional[str] = "192.168.5.23"
    reason: Optional[str] = "Manual operator or automated detection"

class ReleaseAction(BaseModel):
    source_ip: Optional[str] = "192.168.5.23"
    admin_override: bool = False

class RemediationStepAction(BaseModel):
    step: str  # clean, verify

@router.post("")
async def enforce_quarantine(action: QuarantineAction = QuarantineAction()):
    res = await quarantine_manager.enforce_quarantine()
    return res

@router.post("/remediation-step")
async def step_remediation(action: RemediationStepAction):
    res = await quarantine_manager.step_remediation(action.step)
    return res

@router.post("/release")
async def release_quarantine(action: ReleaseAction = ReleaseAction()):
    res = await quarantine_manager.release_quarantine(action.admin_override)
    return res

@router.post("/reset")
async def reset_demo():
    from models.schemas import HostState
    quarantine_manager.host_state = HostState.NORMAL
    quarantine_manager.cleaning_verified = False
    quarantine_manager.flow_rules = [f for f in quarantine_manager.flow_rules if f.cookie != "0x9000"]
    quarantine_manager.current_flow_rate = 14
    await quarantine_manager.broadcast_event("DEMO_RESET", {"status": "NORMAL"})
    return {"success": True, "message": "Demo state reset to baseline NORMAL"}
