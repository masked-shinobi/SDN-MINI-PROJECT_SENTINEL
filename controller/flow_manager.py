"""
SDN Sentinel - Flow Rule Manager
Generates exact OpenFlow 1.3 Flow Entries for Ryu & Open vSwitch
Cookie Convention:
  0x1000: Default L2/L3 Learning & Forwarding Rules
  0x9000: Sentinel Quarantine Rules
"""

QUARANTINE_COOKIE = 0x9000  # 36864 in decimal
COOKIE_MASK = 0xFFFF        # Exact match on quarantine cookie

def get_quarantine_rules(dpid: int, infected_ip: str = "192.168.5.23", remediation_ip: str = "192.168.1.50"):
    """
    Returns the list of OpenFlow 1.3 flow mod dicts to enforce quarantine.
    Notice:
      1. Priority 550 allows ARP so ARP discovery doesn't fail for remediation.
      2. Priority 500 allows bidirectional traffic between infected host and remediation server.
      3. Priority 400 drops all other IPv4 traffic involving the infected host.
    """
    return [
        # 1. ARP Resolution Rule (Priority 550)
        {
            "dpid": dpid,
            "cookie": QUARANTINE_COOKIE,
            "cookie_mask": COOKIE_MASK,
            "table_id": 0,
            "idle_timeout": 0,
            "hard_timeout": 0,
            "priority": 550,
            "flags": 1,
            "match": {
                "eth_type": 2054  # 0x0806 ARP
            },
            "actions": [
                {"type": "OUTPUT", "port": "NORMAL"}
            ],
            "description": "Allow ARP for address resolution during quarantine"
        },
        # 2. Forward Remediation Rule: h1 -> h3 (Priority 500)
        {
            "dpid": dpid,
            "cookie": QUARANTINE_COOKIE,
            "cookie_mask": COOKIE_MASK,
            "table_id": 0,
            "idle_timeout": 0,
            "hard_timeout": 0,
            "priority": 500,
            "flags": 1,
            "match": {
                "eth_type": 2048,  # 0x0800 IPv4
                "ipv4_src": infected_ip,
                "ipv4_dst": remediation_ip
            },
            "actions": [
                {"type": "OUTPUT", "port": "NORMAL"}
            ],
            "description": f"Allow remediation traffic from {infected_ip} to {remediation_ip}"
        },
        # 3. Reverse Remediation Rule: h3 -> h1 (Priority 500)
        {
            "dpid": dpid,
            "cookie": QUARANTINE_COOKIE,
            "cookie_mask": COOKIE_MASK,
            "table_id": 0,
            "idle_timeout": 0,
            "hard_timeout": 0,
            "priority": 500,
            "flags": 1,
            "match": {
                "eth_type": 2048,  # 0x0800 IPv4
                "ipv4_src": remediation_ip,
                "ipv4_dst": infected_ip
            },
            "actions": [
                {"type": "OUTPUT", "port": "NORMAL"}
            ],
            "description": f"Allow return remediation traffic from {remediation_ip} to {infected_ip}"
        },
        # 4. Outbound Drop Rule: h1 -> ANY OTHER DEST (Priority 400)
        {
            "dpid": dpid,
            "cookie": QUARANTINE_COOKIE,
            "cookie_mask": COOKIE_MASK,
            "table_id": 0,
            "idle_timeout": 0,
            "hard_timeout": 0,
            "priority": 400,
            "flags": 1,
            "match": {
                "eth_type": 2048,
                "ipv4_src": infected_ip
            },
            "actions": [],  # Empty actions = DROP
            "description": f"Drop all unauthorized outbound IPv4 traffic from {infected_ip}"
        },
        # 5. Inbound Drop Rule: ANY OTHER SRC -> h1 (Priority 400)
        {
            "dpid": dpid,
            "cookie": QUARANTINE_COOKIE,
            "cookie_mask": COOKIE_MASK,
            "table_id": 0,
            "idle_timeout": 0,
            "hard_timeout": 0,
            "priority": 400,
            "flags": 1,
            "match": {
                "eth_type": 2048,
                "ipv4_dst": infected_ip
            },
            "actions": [],  # Empty actions = DROP
            "description": f"Drop all unauthorized inbound IPv4 traffic targeting {infected_ip}"
        }
    ]

def get_restoration_filter(dpid: int):
    """
    Returns the OpenFlow 1.3 flow deletion directive targeting all quarantine rules.
    Surgically purges all rules matching Cookie 0x9000 without touching normal switch rules.
    """
    return {
        "dpid": dpid,
        "cookie": QUARANTINE_COOKIE,
        "cookie_mask": COOKIE_MASK
    }
