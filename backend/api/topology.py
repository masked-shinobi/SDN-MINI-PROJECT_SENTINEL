from fastapi import APIRouter
from services.quarantine_manager import quarantine_manager

router = APIRouter(prefix="/api/topology", tags=["Topology"])

@router.get("")
def get_topology():
    return quarantine_manager.get_topology()
