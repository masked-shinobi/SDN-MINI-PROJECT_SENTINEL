from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import logging
import asyncio

from api.topology import router as topology_router
from api.flows import router as flows_router
from api.incidents import router as incidents_router
from api.quarantine import router as quarantine_router
from api.verification import router as verification_router
from services.quarantine_manager import quarantine_manager

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("SDNSentinel")

app = FastAPI(
    title="SDN Sentinel - API & Orchestration Engine",
    description="Automated Host Quarantine & Remediation Backend for Ryu / Open vSwitch",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Sub-Routers
app.include_router(topology_router)
app.include_router(flows_router)
app.include_router(incidents_router)
app.include_router(quarantine_router)
app.include_router(verification_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SDN Sentinel Backend",
        "controller": "Ryu OpenFlow 1.3",
        "host_state": quarantine_manager.host_state.value,
        "active_rules": len(quarantine_manager.flow_rules),
        "quarantine_active": any(f.is_quarantine for f in quarantine_manager.flow_rules)
    }

@app.websocket("/ws/events")
async def websocket_events(websocket: WebSocket):
    await quarantine_manager.register_socket(websocket)
    logger.info("New WebSocket client connected to /ws/events")
    try:
        # Send initial full state immediately upon connect
        initial_payload = {
            "type": "INITIAL_STATE",
            "topology": quarantine_manager.get_topology(),
            "rules_count": len(quarantine_manager.flow_rules),
            "host_state": quarantine_manager.host_state.value
        }
        await websocket.send_json(initial_payload)

        while True:
            # Keep socket open and listen for optional ping/commands
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        quarantine_manager.unregister_socket(websocket)
        logger.info("WebSocket client disconnected")
    except Exception as e:
        quarantine_manager.unregister_socket(websocket)
        logger.warning(f"WebSocket error: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
