#!/usr/bin/env python3
"""
SDN Sentinel - Custom Mininet Network Topology
Author: Sanjay (SRM IST SDN Project)

Topology:
  h1: 192.168.5.23/24 (Infected Host generating scan traffic)
  h2: 192.168.5.24/24 (Normal Host in Subnet A)
  h3: 192.168.1.50/24 (Remediation Server in Subnet B)
  s1: Open vSwitch (OpenFlow 1.3)
  c0: Remote Ryu Controller (127.0.0.1:6633 or 6653)

Crucial Configuration:
  - Both subnets are connected to s1.
  - Subnet routing and ARP entries are pre-populated or routed so
    h1 and h2 can reach h3 (192.168.1.50) without a physical router.
"""

from mininet.net import Mininet
from mininet.node import RemoteController, OVSSwitch
from mininet.cli import CLI
from mininet.log import setLogLevel, info

def create_sentinel_topology():
    net = Mininet(controller=RemoteController, switch=OVSSwitch, autoSetMacs=True)

    info('*** Adding Remote Ryu Controller\n')
    c0 = net.addController('c0', controller=RemoteController, ip='127.0.0.1', port=6633)

    info('*** Adding OpenFlow 1.3 Switch s1\n')
    s1 = net.addSwitch('s1', protocols='OpenFlow13')

    info('*** Adding Hosts with Specific Logical IPs\n')
    # h1: Infected Host (Subnet A)
    h1 = net.addHost('h1', ip='192.168.5.23/24', mac='00:00:00:00:00:01')
    # h2: Normal Host (Subnet A)
    h2 = net.addHost('h2', ip='192.168.5.24/24', mac='00:00:00:00:00:02')
    # h3: Remediation Server (Subnet B)
    h3 = net.addHost('h3', ip='192.168.1.50/24', mac='00:00:00:00:00:03')

    info('*** Creating Switch-Host Links\n')
    net.addLink(h1, s1, port2=1)
    net.addLink(h2, s1, port2=2)
    net.addLink(h3, s1, port2=3)

    info('*** Starting Network\n')
    net.start()

    info('*** Configuring Cross-Subnet Direct Routing & ARP on Hosts\n')
    # Allow h1 (192.168.5.23) to directly reach h3 (192.168.1.50) via eth0 interface
    h1.cmd('ip route add 192.168.1.0/24 dev h1-eth0')
    h2.cmd('ip route add 192.168.1.0/24 dev h2-eth0')
    h3.cmd('ip route add 192.168.5.0/24 dev h3-eth0')

    # Pre-populate static ARP cache so quarantine doesn't drop ARP queries
    h1.cmd('arp -s 192.168.1.50 00:00:00:00:00:03')
    h2.cmd('arp -s 192.168.1.50 00:00:00:00:00:03')
    h3.cmd('arp -s 192.168.5.23 00:00:00:00:00:01')
    h3.cmd('arp -s 192.168.5.24 00:00:00:00:00:02')

    info('*** Network Ready for SDN Sentinel Operations!\n')
    info('*** h1: 192.168.5.23 (Infected Host)\n')
    info('*** h2: 192.168.5.24 (Normal Host)\n')
    info('*** h3: 192.168.1.50 (Remediation Server)\n')
    info('*** Switch s1 is connected to Ryu on 127.0.0.1:6633\n')

    CLI(net)
    net.stop()

if __name__ == '__main__':
    setLogLevel('info')
    create_sentinel_topology()
