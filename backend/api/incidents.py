from fastapi import APIRouter
from pydantic import BaseModel
from services.quarantine_manager import quarantine_manager

router = APIRouter(prefix="/api/incidents", tags=["Incidents & Threat Detection"])

class ThresholdUpdate(BaseModel):
    threshold: int

class TriggerScanRequest(BaseModel):
    new_flows: int = 145

@router.get("")
def get_incidents():
    return {
        "incidents": [i.model_dump() for i in quarantine_manager.incidents],
        "current_flow_rate": quarantine_manager.current_flow_rate,
        "threshold": quarantine_manager.threshold,
        "host_state": quarantine_manager.host_state.value
    }

@router.post("/threshold")
async def update_threshold(body: ThresholdUpdate):
    quarantine_manager.threshold = body.threshold
    await quarantine_manager.broadcast_event("THRESHOLD_UPDATED", {"threshold": body.threshold})
    return {"success": True, "threshold": quarantine_manager.threshold}

@router.post("/trigger-scan")
async def trigger_scan(body: TriggerScanRequest):
    incident = await quarantine_manager.trigger_scan_detection(body.new_flows)
    return {"success": True, "incident": incident.model_dump()}
