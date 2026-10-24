import requests
import logging
import os
import time
from typing import List, Dict, Any, Optional

logger = logging.getLogger("RyuClient")

class RyuClient:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or os.getenv("RYU_API_URL", "http://127.0.0.1:8080")
        self._last_alive_check = 0.0
        self._is_alive_cached = False

    def is_alive(self) -> bool:
        now = time.time()
        if now - self._last_alive_check < 3.0:
            return self._is_alive_cached
        self._last_alive_check = now
        try:
            resp = requests.get(f"{self.base_url}/stats/switches", timeout=0.15)
            self._is_alive_cached = (resp.status_code == 200)
        except Exception:
            self._is_alive_cached = False
        return self._is_alive_cached

    def get_switches(self) -> List[int]:
        if not self.is_alive():
            return []
        try:
            resp = requests.get(f"{self.base_url}/stats/switches", timeout=0.5)
            if resp.status_code == 200:
                return resp.json()
        except Exception as e:
            logger.warning(f"Error querying switches from Ryu: {e}")
        return []

    def get_flows(self, dpid: int = 1) -> List[Dict[str, Any]]:
        if not self.is_alive():
            return []
        try:
            resp = requests.get(f"{self.base_url}/stats/flow/{dpid}", timeout=0.5)
            if resp.status_code == 200:
                data = resp.json()
                return data.get(str(dpid), [])
        except Exception as e:
            logger.warning(f"Error querying flows from Ryu: {e}")
        return []

    def install_quarantine(self, dpid: int, infected_ip: str, remediation_ip: str) -> bool:
        if not self.is_alive():
            return False
        try:
            payload = {
                "dpid": dpid,
                "infected_ip": infected_ip,
                "remediation_ip": remediation_ip
            }
            resp = requests.post(f"{self.base_url}/sentinel/quarantine", json=payload, timeout=0.5)
            return resp.status_code == 200
        except Exception as e:
            logger.warning(f"Error calling /sentinel/quarantine on Ryu: {e}")
            return False

    def remove_quarantine(self, dpid: int) -> bool:
        if not self.is_alive():
            return False
        try:
            payload = {"dpid": dpid}
            resp = requests.post(f"{self.base_url}/sentinel/restore", json=payload, timeout=0.5)
            return resp.status_code == 200
        except Exception as e:
            logger.warning(f"Error calling /sentinel/restore on Ryu: {e}")
            return False

ryu_client = RyuClient()

