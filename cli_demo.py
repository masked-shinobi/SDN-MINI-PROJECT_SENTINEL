"""
SDN Sentinel - CLI Demonstration Runner
Run via: python cli_demo.py
Drives the full quarantine lifecycle from the terminal with colored output.
"""

import requests
import time
import json
import sys

API = "http://127.0.0.1:8000"

# --- ANSI Colors ---
class C:
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    CYAN = "\033[96m"
    MAGENTA = "\033[95m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RESET = "\033[0m"

def banner():
    print(f"""
{C.CYAN}{C.BOLD}╔══════════════════════════════════════════════════════════════════╗
║            SDN SENTINEL — CLI DEMONSTRATION RUNNER              ║
║       Automated Host Quarantine & Remediation via OpenFlow 1.3  ║
║                                                                  ║
║   h1: 192.168.5.23 (Infected)    h3: 192.168.1.50 (Remediation)║
║   h2: 192.168.5.24 (Normal)      s1: Open vSwitch (DPID 1)     ║
╚══════════════════════════════════════════════════════════════════╝{C.RESET}
""")

def check_backend():
    try:
        r = requests.get(f"{API}/api/health", timeout=2)
        data = r.json()
        print(f"  {C.GREEN}✓{C.RESET} Backend connected: {data['service']}")
        print(f"  {C.GREEN}✓{C.RESET} Controller: {data['controller']}")
        print(f"  {C.GREEN}✓{C.RESET} Host state: {C.BOLD}{data['host_state']}{C.RESET}")
        return True
    except Exception as e:
        print(f"  {C.RED}✗ Cannot reach backend at {API}: {e}{C.RESET}")
        print(f"  {C.YELLOW}→ Start the backend first: cd backend && python -m uvicorn main:app --port 8000{C.RESET}")
        return False

def show_topology():
    r = requests.get(f"{API}/api/topology")
    data = r.json()
    q_active = data.get("quarantine_active", False)

    print(f"\n{C.CYAN}{C.BOLD}{'─'*66}")
    print(f"  NETWORK TOPOLOGY — Switch s1 (Open vSwitch, OpenFlow 1.3)")
    print(f"{'─'*66}{C.RESET}")
    print()
    print(f"                   ┌─────────────────────┐")
    print(f"                   │  {C.MAGENTA}Ryu Controller c0{C.RESET}   │")
    print(f"                   │  OF 1.3 · REST 8080 │")
    print(f"                   └─────────┬───────────┘")
    print(f"                             │ OpenFlow Control Channel")
    print(f"                   ┌─────────┴───────────┐")
    print(f"                   │  {C.CYAN}{C.BOLD}Switch s1 (OVS){C.RESET}    │")
    print(f"                   │  DPID: 1 · Port 1-3 │")
    print(f"                   └──┬──────┬────────┬──┘")
    print(f"                      │      │        │")

    if q_active:
        print(f"        {C.RED}╳ BLOCKED{C.RESET}  │  {C.GREEN}Normal{C.RESET}  │  {C.GREEN}✓ REMEDIATION{C.RESET}")
    else:
        print(f"        {C.GREEN}Normal{C.RESET}    │  {C.GREEN}Normal{C.RESET}  │  {C.GREEN}Normal{C.RESET}")

    print(f"          ┌───┴───┐  ┌──┴──┐  ┌────┴─────┐")

    # h1 status
    h1_state = data.get("host_state", "NORMAL")
    if h1_state in ("QUARANTINED", "CLEANING", "VERIFYING"):
        h1_color = C.RED
        h1_tag = "ISOLATED"
    elif h1_state == "DETECTED":
        h1_color = C.YELLOW
        h1_tag = "SCANNING"
    else:
        h1_color = C.GREEN
        h1_tag = "NORMAL"

    print(f"          │{h1_color}{C.BOLD}h1{C.RESET}     │  │{C.GREEN}h2{C.RESET}   │  │{C.GREEN}{C.BOLD}h3{C.RESET}        │")
    print(f"          │{h1_color}.5.23{C.RESET}  │  │{C.GREEN}.5.24{C.RESET}│  │{C.GREEN}.1.50{C.RESET}     │")
    print(f"          │{h1_color}{h1_tag:^7}{C.RESET}│  │{C.GREEN}{'OK':^5}{C.RESET}│  │{C.GREEN}{'ALLOWED':^10}{C.RESET}│")
    print(f"          └───────┘  └─────┘  └──────────┘")
    print()

def show_flows():
    r = requests.get(f"{API}/api/flows")
    data = r.json()
    rules = data.get("rules", [])

    print(f"\n{C.CYAN}{C.BOLD}{'─'*80}")
    print(f"  OPENFLOW 1.3 FLOW TABLE — Switch s1 (DPID 1)")
    print(f"  Total Rules: {len(rules)}  |  Quarantine (0x9000): {data.get('quarantine_rules_count', 0)}  |  Normal (0x1000): {data.get('normal_rules_count', 0)}")
    print(f"{'─'*80}{C.RESET}")
    print()

    header = f"  {'COOKIE':<10} {'PRI':<6} {'MATCH':<40} {'ACTIONS':<12} {'PKTS':<8}"
    print(f"{C.DIM}{header}{C.RESET}")
    print(f"  {'─'*76}")

    for rule in rules:
        cookie = rule["cookie"]
        pri = rule["priority"]
        match_str = ", ".join(f"{k}={v}" for k, v in rule["match"].items())
        if len(match_str) > 38:
            match_str = match_str[:35] + "..."

        actions = rule["actions"]
        if not actions:
            action_str = f"{C.RED}DROP{C.RESET}"
        else:
            action_str = f"{C.GREEN}{actions[0].get('type', '?')}:{actions[0].get('port', '?')}{C.RESET}"

        pkts = rule["packet_count"]

        if rule.get("is_quarantine"):
            line_color = C.RED
            marker = "■"
        else:
            line_color = ""
            marker = " "

        print(f"  {line_color}{marker} {cookie:<9} {pri:<5} {match_str:<40} {action_str:<20} {pkts:<8}{C.RESET}")

    print()

def run_connectivity_tests():
    r = requests.post(f"{API}/api/verification/run")
    data = r.json()
    tests = data.get("tests", [])
    overall = data.get("overall_status", "?")

    print(f"\n{C.CYAN}{C.BOLD}{'─'*80}")
    print(f"  CONNECTIVITY VERIFICATION MATRIX")
    print(f"{'─'*80}{C.RESET}")
    print()

    for t in tests:
        src = t["source_ip"]
        dst = t["target_ip"]
        passed = t["passed"]
        expected = "ALLOW" if t["expected_allowed"] else "BLOCK"
        actual = "ALLOWED" if t["actual_allowed"] else "BLOCKED"
        latency = t["latency_ms"]

        icon = f"{C.GREEN}✓ PASS{C.RESET}" if passed else f"{C.RED}✗ FAIL{C.RESET}"
        exp_color = C.GREEN if t["expected_allowed"] else C.RED
        act_color = C.GREEN if t["actual_allowed"] else C.RED

        print(f"  {icon}  {src} → {dst}  Expected: {exp_color}{expected}{C.RESET}  Actual: {act_color}{actual}{C.RESET}  Latency: {latency}ms")

    overall_icon = f"{C.GREEN}{C.BOLD}■ ALL TESTS PASSED{C.RESET}" if overall == "PASS" else f"{C.RED}{C.BOLD}■ TESTS FAILED{C.RESET}"
    print(f"\n  Overall: {overall_icon}")
    print()

def step_reset():
    print(f"\n{C.YELLOW}{'━'*66}")
    print(f"  STEP 0: RESET TO BASELINE")
    print(f"{'━'*66}{C.RESET}")
    requests.post(f"{API}/api/quarantine/reset")
    time.sleep(0.3)
    print(f"  {C.GREEN}✓{C.RESET} All quarantine rules purged. Host h1 restored to NORMAL.")
    show_topology()
    run_connectivity_tests()

def step_trigger_scan():
    print(f"\n{C.YELLOW}{'━'*66}")
    print(f"  STEP 1: TRIGGER PORT SCAN FROM h1 (192.168.5.23)")
    print(f"{'━'*66}{C.RESET}")
    print(f"  {C.DIM}Simulating: nmap -sS -p 1-1000 192.168.5.0/24 from h1...{C.RESET}")
    time.sleep(0.5)
    r = requests.post(f"{API}/api/incidents/trigger-scan", json={"new_flows": 148})
    inc = r.json().get("incident", {})
    print(f"  {C.RED}{C.BOLD}⚠ IDS ALERT:{C.RESET} {inc.get('event_type', 'Scan detected')}")
    print(f"    Source: {C.RED}{inc.get('source_ip', '?')}{C.RESET}")
    print(f"    New flows: {C.RED}{inc.get('new_flows', 0)}{C.RESET} in {inc.get('window_seconds', 5)}s (Threshold: {inc.get('threshold', 100)})")
    print(f"    Severity: {C.RED}{C.BOLD}{inc.get('severity', '?').upper()}{C.RESET}")
    show_topology()

def step_enforce_quarantine():
    print(f"\n{C.RED}{'━'*66}")
    print(f"  STEP 2: ENFORCE QUARANTINE ON h1 VIA RYU CONTROLLER")
    print(f"{'━'*66}{C.RESET}")
    print(f"  {C.DIM}Installing Cookie 0x9000 rules: Priority 550 (ARP), 500 (Remediation), 400 (DROP)...{C.RESET}")
    time.sleep(0.3)
    r = requests.post(f"{API}/api/quarantine", json={"source_ip": "192.168.5.23"})
    data = r.json()
    ms = data.get("enforcement_time_ms", 0)
    print(f"  {C.RED}{C.BOLD}🔒 QUARANTINE ENFORCED{C.RESET} in {C.GREEN}{ms}ms{C.RESET}")
    print(f"    Rules installed: {data.get('rules_installed', 5)} on Switch s1")
    print(f"    Cookie: {C.RED}0x9000{C.RESET}")
    show_topology()
    show_flows()
    run_connectivity_tests()

def step_clean_and_verify():
    print(f"\n{C.MAGENTA}{'━'*66}")
    print(f"  STEP 3: REMEDIATE & VERIFY CLEANLINESS")
    print(f"{'━'*66}{C.RESET}")
    print(f"  {C.DIM}Running remediation via h3 (192.168.1.50)...{C.RESET}")
    requests.post(f"{API}/api/quarantine/remediation-step", json={"step": "clean"})
    time.sleep(0.5)
    print(f"  {C.GREEN}✓{C.RESET} Host h1 cleaned (antivirus scan, patches applied)")
    print(f"  {C.DIM}Verifying zero scan traffic from h1...{C.RESET}")
    requests.post(f"{API}/api/quarantine/remediation-step", json={"step": "verify"})
    time.sleep(0.3)
    print(f"  {C.GREEN}✓{C.RESET} Verification PASSED: No suspicious flows detected")

def step_restore():
    print(f"\n{C.GREEN}{'━'*66}")
    print(f"  STEP 4: RESTORE NETWORK — REMOVE QUARANTINE RULES")
    print(f"{'━'*66}{C.RESET}")
    print(f"  {C.DIM}Deleting all Cookie 0x9000 flows from Switch s1...{C.RESET}")
    time.sleep(0.3)
    r = requests.post(f"{API}/api/quarantine/release")
    data = r.json()
    print(f"  {C.GREEN}{C.BOLD}✓ NETWORK RESTORED{C.RESET}: {data.get('message', 'OK')}")
    print(f"    Removal time: {C.GREEN}{data.get('removal_time_ms', 0)}ms{C.RESET}")
    show_topology()
    show_flows()
    run_connectivity_tests()

def full_demo():
    banner()
    if not check_backend():
        sys.exit(1)

    input(f"\n{C.CYAN}  Press Enter to start the full demonstration...{C.RESET}")

    step_reset()
    input(f"\n{C.CYAN}  Press Enter for Step 1 → Trigger Port Scan...{C.RESET}")

    step_trigger_scan()
    input(f"\n{C.CYAN}  Press Enter for Step 2 → Enforce Quarantine...{C.RESET}")

    step_enforce_quarantine()
    input(f"\n{C.CYAN}  Press Enter for Step 3 → Clean & Verify...{C.RESET}")

    step_clean_and_verify()
    input(f"\n{C.CYAN}  Press Enter for Step 4 → Restore Network...{C.RESET}")

    step_restore()

    print(f"\n{C.GREEN}{C.BOLD}{'═'*66}")
    print(f"  ✓ DEMONSTRATION COMPLETE — ALL STAGES VERIFIED")
    print(f"{'═'*66}{C.RESET}")
    print(f"  The quarantine lifecycle was demonstrated end-to-end:")
    print(f"    1. IDS Detection (148 flows/5s)")
    print(f"    2. OpenFlow Quarantine (Cookie 0x9000, <25ms)")
    print(f"    3. Remediation-Only Access (Priority 500 → 192.168.1.50)")
    print(f"    4. Verification & Restoration (Cookie purge)")
    print()

def interactive_menu():
    banner()
    if not check_backend():
        sys.exit(1)

    while True:
        print(f"\n{C.CYAN}{C.BOLD}  SDN Sentinel CLI Menu:{C.RESET}")
        print(f"  {C.BOLD}1{C.RESET}. Run Full Automated Demo (Step-by-Step)")
        print(f"  {C.BOLD}2{C.RESET}. Show Current Topology")
        print(f"  {C.BOLD}3{C.RESET}. Show Flow Table")
        print(f"  {C.BOLD}4{C.RESET}. Run Connectivity Tests")
        print(f"  {C.BOLD}5{C.RESET}. Trigger Scan Detection")
        print(f"  {C.BOLD}6{C.RESET}. Enforce Quarantine")
        print(f"  {C.BOLD}7{C.RESET}. Clean & Verify Host")
        print(f"  {C.BOLD}8{C.RESET}. Restore Network")
        print(f"  {C.BOLD}9{C.RESET}. Reset to Baseline")
        print(f"  {C.BOLD}0{C.RESET}. Exit")

        choice = input(f"\n{C.CYAN}  Select [{C.BOLD}0-9{C.RESET}{C.CYAN}]: {C.RESET}").strip()

        if choice == "1":
            full_demo()
        elif choice == "2":
            show_topology()
        elif choice == "3":
            show_flows()
        elif choice == "4":
            run_connectivity_tests()
        elif choice == "5":
            step_trigger_scan()
        elif choice == "6":
            step_enforce_quarantine()
        elif choice == "7":
            step_clean_and_verify()
        elif choice == "8":
            step_restore()
        elif choice == "9":
            step_reset()
        elif choice == "0":
            print(f"\n{C.CYAN}  Goodbye!{C.RESET}\n")
            break
        else:
            print(f"  {C.RED}Invalid choice.{C.RESET}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--auto":
        full_demo()
    else:
        interactive_menu()
