# SDN Sentinel — Automated Host Quarantine System
## Architecture, Technical Specification & Master Build Blueprint

---

### 1. Executive Project Summary
**SDN Sentinel** is an automated Software Defined Networking security & quarantine operations platform designed for SRM IST SDN presentation and faculty defense. It demonstrates the live detection of compromised hosts (suspicious scanning/flow spikes), rapid automated OpenFlow 1.3 quarantine at the switch level (`s1`), restricted remediation-only connectivity (`h3` at `192.168.1.50`), and non-disruptive restoration after remediation verification.

---

### 2. Four-Plane Architecture Model

```
+-------------------------------------------------------------------------+
|                  1. APPLICATION & VISUALIZATION PLANE                   |
|  - Next.js 14 + React Flow Interactive Dashboard                        |
|  - Fast, dark cybersecurity UI with animated SVG edges and status glows  |
|  - Threat detection console, OpenFlow rule diff viewer, live test runner|
+------------------------------------+------------------------------------+
                                     | REST API + WebSocket (/ws/events)
+------------------------------------+------------------------------------+
|                       2. ORCHESTRATION PLANE                            |
|  - FastAPI (Python) Application Server                                  |
|  - Quarantine State Machine (NORMAL -> DETECTED -> QUARANTINED -> ...) |
|  - IDS Flow Rate Monitor (Windowed new flow anomaly detection)          |
|  - Dual Mode: Direct Ryu REST Integration + Built-in Realistic Emulator|
+------------------------------------+------------------------------------+
                                     | Ryu REST API (Port 8080)
+------------------------------------+------------------------------------+
|                         3. CONTROL PLANE                                |
|  - Ryu SDN Controller (OpenFlow 1.3)                                    |
|  - Cookie-tagged flow management (Normal: 0x1000, Quarantine: 0x9000)   |
|  - Fast flow rule injection and barrier verification                     |
+------------------------------------+------------------------------------+
                                     | OpenFlow 1.3 Control Channel (TCP 6633/6653)
+------------------------------------+------------------------------------+
|                          4. DATA PLANE                                  |
|  - Mininet + Open vSwitch (s1, optional s2)                             |
|  - h1: 192.168.5.23 (Infected host / port scan source)                 |
|  - h2: 192.168.5.24 (Normal host in subnet)                             |
|  - h3: 192.168.1.50 (Remediation server in cross-subnet)                |
+-------------------------------------------------------------------------+
```

---

### 3. OpenFlow 1.3 Rule Engineering

The system uses standard **Cookie tagging (`0x9000`)** and strict priority ordering on switch `s1`:

```
+----------+--------+------------------------------------+----------------------+
| Priority | Cookie | Match Condition                    | Action               |
+----------+--------+------------------------------------+----------------------+
| 550      | 0x9000 | eth_type=0x0806 (ARP)              | NORMAL               |
| 500      | 0x9000 | ipv4_src=192.168.5.23, dst=192.168.1.50 | OUTPUT to h3 port    |
| 500      | 0x9000 | ipv4_src=192.168.1.50, dst=192.168.5.23 | OUTPUT to h1 port    |
| 400      | 0x9000 | ipv4_src=192.168.5.23              | DROP                 |
| 400      | 0x9000 | ipv4_dst=192.168.5.23              | DROP                 |
| 100      | 0x1000 | Normal L2/L3 Forwarding (Learned)  | Forward to Dest Port |
| 0        | 0x0000 | Table Miss                         | OFPP_CONTROLLER      |
+----------+--------+------------------------------------+----------------------+
```

**Restoration Process:**
The controller executes `delete_strict` or cookie-filtered delete (`cookie=0x9000`, `cookie_mask=0xFFFF`). All quarantine rules drop simultaneously without affecting active `h2` traffic.

---

### 4. Five Frontend Screens

1. **Security Overview (`/`)**:
   - Status KPI cards: Active Threats, Quarantined Hosts, Switch Throughput, Controller Health.
   - Live Security Event Stream.
   - Quick Action Panel.

2. **Live Network Topology (`/topology`)**:
   - Built with **React Flow**.
   - Custom nodes for `HostNode`, `SwitchNode`, `ServerNode`, `ControllerNode`.
   - Dynamic link states:
     - Cyan pulse: Normal allowed traffic.
     - Blinking Red + Cross symbol: Quarantined & dropped path.
     - Emerald beam: Exclusive remediation path (`h1` to `h3`).
   - Detailed Node Inspection panel on click (IP, MAC, DPID, Flow counts).

3. **Threat Detection & IDS (`/incidents`)**:
   - Flow rate telemetry chart (flows/second over time).
   - Configurable detection threshold slider (e.g. 100 flows / 5 sec).
   - Trigger simulated attack / inspect Nmap scan logs.

4. **Firewall & Flow Rules (`/flows`)**:
   - Real OpenFlow flow table from switch `s1`.
   - Columns: DPID, Cookie, Priority, Match, Actions, Packets, Bytes, Duration.
   - Interactive Diff view highlighting newly installed and removed rules.

5. **Demo Lab & Verification Suite (`/demo`)**:
   - Interactive step-by-step evaluator:
     - Step 1: Baseline Ping (`h1` -> `h2`, `h1` -> `h3`, `h2` -> `h3`).
     - Step 2: Trigger Port Scan (`h1` initiates scanning).
     - Step 3: Automated Quarantine Enforcement (OpenFlow rules installed in `< 50ms`).
     - Step 4: Isolation Verification (`h1` -> `h2` FAIL, `h1` -> `h3` SUCCESS).
     - Step 5: Clean & Verification (`h1` state = CLEANING -> VERIFYING).
     - Step 6: Release & Restoration (Purge `0x9000`, verify `h1` -> `h2` SUCCESS).
   - Audit report generation (exportable JSON / printable summary).

---

### 5. Implementation Roadmap

- **Phase 1: Project Scaffolding & Directory Setup**
  - Setup `frontend` (Next.js 14, Tailwind CSS, Lucide icons, React Flow, Recharts).
  - Setup `backend` (FastAPI, WebSockets, Uvicorn, SQLite event store).
  - Setup `controller` (Ryu OpenFlow 1.3 application & REST flow manager).
  - Setup `network` (Mininet topology script with `192.168.5.23`, `192.168.5.24`, `192.168.1.50`).

- **Phase 2: Backend Core & Dual-Mode Engine**
  - Implement full quarantine state machine (`NORMAL` -> `DETECTED` -> `QUARANTINED` -> `CLEANING` -> `VERIFYING` -> `RESTORED`).
  - Implement real Ryu REST bridge AND a high-fidelity emulator mode so the dashboard runs seamlessly anywhere (Windows host & Linux VM alike).

- **Phase 3: React Flow Interactive Dashboard**
  - Custom nodes, animated custom edges, particle-style pulse for active packets.
  - 5 interactive pages with real-time WebSocket syncing.

- **Phase 4: Evaluation Lab & Faculty Verification Suite**
  - Automated scenario runner with live timer, pass/fail matrix, and flow table verification.
