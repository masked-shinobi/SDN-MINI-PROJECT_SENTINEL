#!/bin/bash
# SDN Sentinel - Network Environment Setup Helper
# Run this inside Ubuntu / WSL2 where Mininet and Open vSwitch are installed.

echo "=========================================================="
echo "      SDN Sentinel: Mininet & Open vSwitch Setup         "
echo "=========================================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "[-] Please run as root (sudo bash setup_network.sh)"
  exit 1
fi

echo "[+] Cleaning previous Mininet state..."
mn -c > /dev/null 2>&1

echo "[+] Ensuring Open vSwitch service is running..."
service openvswitch-switch status > /dev/null 2>&1 || service openvswitch-switch start

echo "[+] Launching SDN Sentinel Mininet Topology..."
echo "[+] Remote controller target: 127.0.0.1:6633"
python3 topology.py
