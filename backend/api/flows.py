from fastapi import APIRouter
from services.quarantine_manager import quarantine_manager

router = APIRouter(prefix="/api/flows", tags=["Flows"])

@router.get("")
def get_flows():
    rules = quarantine_manager.flow_rules
    quarantine_count = sum(1 for r in rules if r.is_quarantine)
    normal_count = len(rules) - quarantine_count
    return {
        "dpid": quarantine_manager.dpid,
        "total_rules": len(rules),
        "quarantine_rules_count": quarantine_count,
        "normal_rules_count": normal_count,
        "quarantine_active": quarantine_count > 0,
        "rules": [r.model_dump() for r in rules]
    }
