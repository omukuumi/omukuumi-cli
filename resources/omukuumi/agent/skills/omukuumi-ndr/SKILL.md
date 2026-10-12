---
name: omukuumi-ndr
description: NDR — Network Detection & Response traffic analysis, anomaly detection, and threat hunting
---

# NDR — Network Detection & Response

**Purpose:** Help analysts investigate network threats, detect anomalies, and hunt for lateral movement/C2 using AI-assisted analysis.

## When to Use

- Analyzing PCAP / Zeek / Suricata logs
- Detecting C2 beaconing, DNS tunneling, data exfiltration
- Mapping lateral movement (SMB, RDP, SSH, WMI)
- Writing Zeek / Suricata / Sigma / KQL network queries
- Correlating network + endpoint events

## System Prompt

> You are an NDR analyst assistant. You help investigate network threats by:
> - Parsing PCAP, Zeek (conn/dns/http/ssl), Suricata (eve.json), NetFlow
> - Detecting beaconing (regular intervals, jitter, user-agent anomalies)
> - Finding DNS tunneling (high entropy, long subdomains, TXT records)
> - Detecting lateral movement (SMB/PSExec, RDP brute, SSH, WMI, WinRM)
> - Identifying data exfil (large transfers, unusual ports, cloud storage)
> - Mapping to MITRE ATT&CK (T1071, T1048, T1021, T1567, T1041)
> - Writing Zeek/Suricata/Sigma/KQL detection rules
> - Always cite evidence (timestamps, IPs, ports, byte counts)

## Detection Patterns

### C2 Beaconing
```
Input: conn.log — 192.168.1.50 → 203.0.113.10:443 every 60s ± 5s, 1.2KB each
Output: T1071.001 (Web Protocols) + T1573.001 (Symmetric Encryption) → Beacon
```

### DNS Tunneling
```
Input: dns.log — query: a1b2c3d4e5.malicious.com, type: TXT, length: 255 bytes
Output: T1048.003 (DNS) → Exfil/C2 via DNS
```

### Lateral Movement (SMB)
```
Input: conn.log — 192.168.1.10 → 192.168.1.20:445, then auth.log: admin login
Output: T1021.002 (SMB/Windows Admin Shares) + T1550.002 (Pass the Hash)
```

### Data Exfiltration
```
Input: http.log — 192.168.1.100 → storage.googleapis.com, 2.4GB upload, 03:00 AM
Output: T1567.002 (Exfil to Cloud Storage) → Large off-hours upload
```

## Example Queries

### Zeek (conn.log beaconing)
```zeek
@load base/protocols/conn
event conn(c: connection) {
    if (c$duration > 0 && c$orig_bytes < 2000 && c$resp_bytes < 2000) {
        # Potential beacon — small, regular connections
    }
}
```

### Suricata (eve.json C2)
```json
{
  "event_type": "alert",
  "alert": { "signature": "ET TROJAN Suspicious Beaconing", "category": "Trojan Activity" }
}
```

### KQL (Sentinel/Defender network)
```kql
NetworkCommunicationEvents
| where RemotePort in (443, 80, 8080, 8443)
| where RemoteIP != "127.0.0.1"
| summarize beacon_score=count() by RemoteIP, bin(Timestamp, 1m)
| where beacon_score > 10
```

### Sigma (Network beacon)
```yaml
title: Potential Beaconing Activity
logsource: { product: zeek, service: conn }
detection:
  selection:
    orig_bytes|less: 2000
    resp_bytes|less: 2000
  condition: selection
```

---

**Note:** Uses current models. Provide PCAP/Zeek/Suricata logs + context for best results.