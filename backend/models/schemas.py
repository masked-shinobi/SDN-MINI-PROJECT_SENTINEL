from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class HostState(str, Enum):
    NORMAL = "NORMAL"
    DETECTED = "DETECTED"
    QUARANTINED = "QUARANTINED"
    CLEANING = "CLEANING"
    VERIFYING = "VERIFYING"
    RESTORED = "RESTORED"

class NodeType(str, Enum):
    HOST = "HOST"
    SWITCH = "SWITCH"
    CONTROLLER = "CONTROLLER"
    SERVER = "SERVER"

class NetworkNode(BaseModel):
    id: str
    label: str
    type: NodeType
    ip: Optional[str] = None
    mac: Optional[str] = None
    dpid: Optional[int] = None
    port: Optional[int] = None
    status: HostState = HostState.NORMAL
    role: str = "normal"  # infected, normal, remediation, switch, controller
    packet_rate: int = 0
    flow_count: int = 0
    details: Dict[str, Any] = Field(default_factory=dict)

class NetworkEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    status: str = "active"  # active, blocked, remediation, control
    bandwidth: str = "100 Mbps"
    animated: bool = True

class TopologyResponse(BaseModel):
    nodes: List[NetworkNode]
    edges: List[NetworkEdge]
    controller_connected: bool = True
    quarantine_active: bool = False

class FlowRule(BaseModel):
    dpid: int
    cookie: str  # Hex string like "0x9000" or "0x1000"
    priority: int
    match: Dict[str, Any]
    actions: List[Dict[str, Any]]
    packet_count: int = 0
    byte_count: int = 0
    duration_sec: int = 0
    is_quarantine: bool = False
    description: Optional[str] = None

class SecurityIncident(BaseModel):
    id: str
    timestamp: str
    source_ip: str
    source_mac: Optional[str] = "00:00:00:00:00:01"
    event_type: str
    severity: str  # low, medium, high, critical
    new_flows: int
    threshold: int
    window_seconds: int = 5
    status: HostState
    enforcement_time_ms: Optional[float] = None
    details: str

class QuarantineRequest(BaseModel):
    source_ip: str = "192.168.5.23"
    dpid: int = 1
    reason: Optional[str] = "Manual operator or automated IDS enforcement"

class ReleaseRequest(BaseModel):
    source_ip: str = "192.168.5.23"
    dpid: int = 1
    admin_override: bool = False

class ConnectivityTestItem(BaseModel):
    test_id: str
    source_node: str
    source_ip: str
    target_node: str
    target_ip: str
    expected_allowed: bool
    actual_allowed: bool
    passed: bool
    latency_ms: float
    message: str

class VerificationReport(BaseModel):
    timestamp: str
    overall_status: str  # PASS or FAIL
    host_state: HostState
    tests: List[ConnectivityTestItem]
    active_quarantine_rules: int
