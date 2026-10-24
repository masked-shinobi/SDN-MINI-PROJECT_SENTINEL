"""
SDN Sentinel - Ryu OpenFlow 1.3 Controller Application
Author: Sanjay (SRM IST SDN Project)

Run with:
  ryu-manager --verbose sdn_controller.py ryu.app.ofctl_rest

Features:
  - OpenFlow 1.3 L2 Learning Switch with MAC table
  - Table-miss Flow Entry with Priority 0
  - REST API for Quarantine & Restoration (/sentinel/quarantine, /sentinel/restore)
  - Cookie-based flow installation (Cookie 0x9000 for quarantine)
  - Live flow statistics reporting
"""

import json
from ryu.base import app_manager
from ryu.controller import ofp_event
from ryu.controller.handler import CONFIG_DISPATCHER, MAIN_DISPATCHER
from ryu.controller.handler import set_ev_cls
from ryu.ofproto import ofproto_v1_3
from ryu.lib.packet import packet, ethernet, ether_types
from ryu.app.wsgi import ControllerBase, WSGIApplication, route
from webob import Response

SENTINEL_INSTANCE_NAME = 'sentinel_controller_api'
URL_PREFIX = '/sentinel'

class SDNSentinelController(app_manager.RyuApp):
    OFP_VERSIONS = [ofproto_v1_3.OFP_VERSION]
    _CONTEXTS = {'wsgi': WSGIApplication}

    def __init__(self, *args, **kwargs):
        super(SDNSentinelController, self).__init__(*args, **kwargs)
        self.mac_to_port = {}
        self.switches = {}
        wsgi = kwargs['wsgi']
        wsgi.register(SentinelRestController, {SENTINEL_INSTANCE_NAME: self})
        self.logger.info("[SDN Sentinel] Controller initialized and ready on OpenFlow 1.3")

    @set_ev_cls(ofp_event.EventOFPSwitchFeatures, CONFIG_DISPATCHER)
    def switch_features_handler(self, ev):
        datapath = ev.msg.datapath
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser
        dpid = datapath.id

        self.switches[dpid] = datapath
        self.logger.info(f"[SDN Sentinel] Switch connected: DPID={dpid}")

        # Install Table-Miss flow entry (Priority 0)
        match = parser.OFPMatch()
        actions = [parser.OFPActionOutput(ofproto.OFPP_CONTROLLER, ofproto.OFPCML_NO_BUFFER)]
        self.add_flow(datapath, priority=0, match=match, actions=actions, cookie=0x0000)
        self.logger.info(f"[SDN Sentinel] Table-Miss entry installed on DPID={dpid}")

    def add_flow(self, datapath, priority, match, actions, buffer_id=None, cookie=0x1000):
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser

        inst = [parser.OFPInstructionActions(ofproto.OFPIT_APPLY_ACTIONS, actions)]
        if buffer_id:
            mod = parser.OFPFlowMod(
                datapath=datapath, buffer_id=buffer_id, priority=priority,
                match=match, instructions=inst, cookie=cookie
            )
        else:
            mod = parser.OFPFlowMod(
                datapath=datapath, priority=priority,
                match=match, instructions=inst, cookie=cookie
            )
        datapath.send_msg(mod)

    @set_ev_cls(ofp_event.EventOFPPacketIn, MAIN_DISPATCHER)
    def packet_in_handler(self, ev):
        msg = ev.msg
        datapath = msg.datapath
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser
        in_port = msg.match['in_port']

        pkt = packet.Packet(msg.data)
        eth = pkt.get_protocols(ethernet.ethernet)[0]

        if eth.ethertype == ether_types.ETH_TYPE_LLDP:
            return

        dst = eth.dst
        src = eth.src
        dpid = datapath.id

        self.mac_to_port.setdefault(dpid, {})
        self.mac_to_port[dpid][src] = in_port

        if dst in self.mac_to_port[dpid]:
            out_port = self.mac_to_port[dpid][dst]
        else:
            out_port = ofproto.OFPP_FLOOD

        actions = [parser.OFPActionOutput(out_port)]

        # If destination known, install normal learning flow (Priority 100, Cookie 0x1000)
        if out_port != ofproto.OFPP_FLOOD:
            match = parser.OFPMatch(in_port=in_port, eth_dst=dst)
            if msg.buffer_id != ofproto.OFP_NO_BUFFER:
                self.add_flow(datapath, 100, match, actions, msg.buffer_id, cookie=0x1000)
                return
            else:
                self.add_flow(datapath, 100, match, actions, cookie=0x1000)

        data = None
        if msg.buffer_id == ofproto.OFP_NO_BUFFER:
            data = msg.data

        out = parser.OFPPacketOut(
            datapath=datapath, buffer_id=msg.buffer_id, in_port=in_port,
            actions=actions, data=data
        )
        datapath.send_msg(out)

    def install_quarantine(self, dpid: int, infected_ip: str, remediation_ip: str):
        """Installs the high-priority quarantine rules (Cookie 0x9000)."""
        if dpid not in self.switches:
            return False, f"Switch DPID {dpid} not found"

        datapath = self.switches[dpid]
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser
        cookie = 0x9000

        # 1. ARP allow rule (Priority 550)
        match_arp = parser.OFPMatch(eth_type=ether_types.ETH_TYPE_ARP)
        actions_arp = [parser.OFPActionOutput(ofproto.OFPP_NORMAL)]
        self.add_flow(datapath, 550, match_arp, actions_arp, cookie=cookie)

        # 2. Forward Remediation: infected -> remediation (Priority 500)
        match_fwd = parser.OFPMatch(eth_type=ether_types.ETH_TYPE_IP, ipv4_src=infected_ip, ipv4_dst=remediation_ip)
        actions_fwd = [parser.OFPActionOutput(ofproto.OFPP_NORMAL)]
        self.add_flow(datapath, 500, match_fwd, actions_fwd, cookie=cookie)

        # 3. Reverse Remediation: remediation -> infected (Priority 500)
        match_rev = parser.OFPMatch(eth_type=ether_types.ETH_TYPE_IP, ipv4_src=remediation_ip, ipv4_dst=infected_ip)
        actions_rev = [parser.OFPActionOutput(ofproto.OFPP_NORMAL)]
        self.add_flow(datapath, 500, match_rev, actions_rev, cookie=cookie)

        # 4. Drop Outbound: infected -> any (Priority 400)
        match_drop_out = parser.OFPMatch(eth_type=ether_types.ETH_TYPE_IP, ipv4_src=infected_ip)
        self.add_flow(datapath, 400, match_drop_out, [], cookie=cookie)

        # 5. Drop Inbound: any -> infected (Priority 400)
        match_drop_in = parser.OFPMatch(eth_type=ether_types.ETH_TYPE_IP, ipv4_dst=infected_ip)
        self.add_flow(datapath, 400, match_drop_in, [], cookie=cookie)

        self.logger.info(f"[SDN Sentinel] Successfully applied quarantine rules on DPID={dpid} for {infected_ip}")
        return True, "Quarantine flow rules active on switch"

    def remove_quarantine(self, dpid: int):
        """Removes all flow rules matching Cookie 0x9000."""
        if dpid not in self.switches:
            return False, f"Switch DPID {dpid} not found"

        datapath = self.switches[dpid]
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser

        # Delete all flow entries matching cookie 0x9000
        mod = parser.OFPFlowMod(
            datapath=datapath,
            command=ofproto.OFPFC_DELETE,
            out_port=ofproto.OFPP_ANY,
            out_group=ofproto.OFPG_ANY,
            cookie=0x9000,
            cookie_mask=0xFFFF,
            match=parser.OFPMatch()
        )
        datapath.send_msg(mod)
        self.logger.info(f"[SDN Sentinel] Purged quarantine rules (Cookie 0x9000) from DPID={dpid}")
        return True, "Quarantine rules removed, normal forwarding restored"


class SentinelRestController(ControllerBase):
    def __init__(self, req, link, data, **config):
        super(SentinelRestController, self).__init__(req, link, data, **config)
        self.sentinel_app = data[SENTINEL_INSTANCE_NAME]

    @route('sentinel', URL_PREFIX + '/quarantine', methods=['POST'])
    def quarantine_host(self, req, **kwargs):
        try:
            body = json.loads(req.body)
            dpid = int(body.get('dpid', 1))
            infected_ip = body.get('infected_ip', '192.168.5.23')
            remediation_ip = body.get('remediation_ip', '192.168.1.50')

            success, msg = self.sentinel_app.install_quarantine(dpid, infected_ip, remediation_ip)
            status_code = 200 if success else 400
            return Response(
                content_type='application/json',
                status=status_code,
                body=json.dumps({"success": success, "message": msg, "dpid": dpid, "cookie": "0x9000"})
            )
        except Exception as e:
            return Response(content_type='application/json', status=500, body=json.dumps({"error": str(e)}))

    @route('sentinel', URL_PREFIX + '/restore', methods=['POST'])
    def restore_host(self, req, **kwargs):
        try:
            body = json.loads(req.body)
            dpid = int(body.get('dpid', 1))

            success, msg = self.sentinel_app.remove_quarantine(dpid)
            status_code = 200 if success else 400
            return Response(
                content_type='application/json',
                status=status_code,
                body=json.dumps({"success": success, "message": msg, "dpid": dpid})
            )
        except Exception as e:
            return Response(content_type='application/json', status=500, body=json.dumps({"error": str(e)}))
