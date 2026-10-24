const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface NetworkNodeData {
  id: string;
  label: string;
  type: "HOST" | "SWITCH" | "CONTROLLER" | "SERVER";
  ip?: string;
  mac?: string;
  dpid?: number;
  port?: number;
  status: "NORMAL" | "DETECTED" | "QUARANTINED" | "CLEANING" | "VERIFYING" | "RESTORED";
  role: string;
  packet_rate: number;
  flow_count: number;
  details?: Record<string, any>;
}

export interface NetworkEdgeData {
  id: string;
  source: string;
  target: string;
  label?: string;
  status: string;
  bandwidth: string;
  animated: boolean;
}

export interface TopologyData {
  nodes: NetworkNodeData[];
  edges: NetworkEdgeData[];
  controller_connected: boolean;
  quarantine_active: boolean;
  host_state: string;
}

export interface FlowRuleItem {
  dpid: number;
  cookie: string;
  priority: number;
  match: Record<string, any>;
  actions: Array<Record<string, any>>;
  packet_count: number;
  byte_count: number;
  duration_sec: number;
  is_quarantine: boolean;
  description?: string;
}

export interface IncidentItem {
  id: string;
  timestamp: string;
  source_ip: string;
  source_mac?: string;
  event_type: string;
  severity: string;
  new_flows: number;
  threshold: number;
  window_seconds: number;
  status: string;
  enforcement_time_ms?: number;
  details: string;
}

export interface ConnectivityTestItem {
  test_id: string;
  source_node: string;
  source_ip: string;
  target_node: string;
  target_ip: string;
  expected_allowed: boolean;
  actual_allowed: boolean;
  passed: boolean;
  latency_ms: number;
  message: string;
}

export interface VerificationReport {
  timestamp: string;
  overall_status: "PASS" | "FAIL";
  host_state: string;
  tests: ConnectivityTestItem[];
  active_quarantine_rules: number;
}

export async function fetchTopology(): Promise<TopologyData> {
  const res = await fetch(`${API_BASE}/api/topology`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch topology");
  return res.json();
}

export async function fetchFlows(): Promise<{
  dpid: number;
  total_rules: number;
  quarantine_rules_count: number;
  normal_rules_count: number;
  quarantine_active: boolean;
  rules: FlowRuleItem[];
}> {
  const res = await fetch(`${API_BASE}/api/flows`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch flows");
  return res.json();
}

export async function fetchIncidents(): Promise<{
  incidents: IncidentItem[];
  current_flow_rate: number;
  threshold: number;
  host_state: string;
}> {
  const res = await fetch(`${API_BASE}/api/incidents`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch incidents");
  return res.json();
}

export async function updateThreshold(threshold: number) {
  const res = await fetch(`${API_BASE}/api/incidents/threshold`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threshold }),
  });
  return res.json();
}

export async function triggerScan(new_flows: number = 145) {
  const res = await fetch(`${API_BASE}/api/incidents/trigger-scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_flows }),
  });
  return res.json();
}

export async function enforceQuarantine(source_ip = "192.168.5.23") {
  const res = await fetch(`${API_BASE}/api/quarantine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source_ip }),
  });
  return res.json();
}

export async function stepRemediation(step: "clean" | "verify") {
  const res = await fetch(`${API_BASE}/api/quarantine/remediation-step`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ step }),
  });
  return res.json();
}

export async function releaseQuarantine(admin_override = false) {
  const res = await fetch(`${API_BASE}/api/quarantine/release`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ admin_override }),
  });
  return res.json();
}

export async function resetDemo() {
  const res = await fetch(`${API_BASE}/api/quarantine/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}

export async function runConnectivityTests(): Promise<VerificationReport> {
  const res = await fetch(`${API_BASE}/api/verification/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}
