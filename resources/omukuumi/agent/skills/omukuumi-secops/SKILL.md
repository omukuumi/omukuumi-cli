---
name: omukuumi-secops
description: SecOps Master — Unified EDR + NDR + SIEM + SOAR workflow for security operations
---

# SecOps Master — Unified Security Operations

**Purpose:** Single entry point for security analysts — combines EDR, NDR, SIEM, SOAR into one workflow.

## Quick Start

```
/secops edr     — Endpoint analysis (process, file, registry, containment)
/secops ndr     — Network analysis (PCAP, Zeek, Suricata, C2, lateral movement)
/secops siem    — Log correlation, rule writing, alert triage, dashboards
/secops soar    — Playbook design, automation, case management
/secops hunt    — Threat hunting across all sources
/secops case    — Case management workflow
```

## Unified Workflow

```
ALERT (EDR/NDR/SIEM) → ENRICH (TI, VT, AbuseIPDB) → CORRELATE (SIEM: multi-source) → RESPOND (SOAR: contain, ticket, notify)
```

## Integrated Use Cases

### 1. Malware Execution → Full Response
```
EDR Alert: powershell -enc on host-A
  ▼
NDR Check: host-A beaconing to 203.0.113.10?
  ▼
SIEM Correlate: host-A + user-jdoe + VPN login 08:00?
  ▼
SOAR Playbook: malware-execution
  • Enrich hash (VT, Hybrid Analysis)
  • Isolate host-A (approval)
  • Kill process tree
  • Block C2 IP (firewall/proxy)
  • Collect memory dump
  • Create Jira ticket
  • Notify #soc-alerts
```

### 2. Phishing → Credential Theft → Lateral Movement
```
Email Alert: phishing with credential harvester
  ▼
SIEM: user-jdoe entered creds on fake O365 page
  ▼
AD: user-jdoe added to Domain Admins 2hr later
  ▼
EDR: psexec from host-A → host-B (admin$)
  ▼
NDR: SMB traffic host-A → host-B:445
  ▼
SOAR: credential-theft-playbook
  • Reset jdoe password (approval)
  • Remove from Domain Admins
  • Isolate host-A, host-B
  • Block attacker IP
  • Full credential access investigation
```

### 3. Data Exfiltration
```
NDR: 50GB upload to storage.googleapis.com at 03:00
  ▼
EDR: winrar.exe on host-C compressing \\fileserver\finance
  ▼
SIEM: user-msmith accessed finance DB 02:45
  ▼
SOAR: data-exfil-playbook
  • Block egress to storage.googleapis.com
  • Isolate host-C
  • Preserve evidence (memory, disk)
  • Legal/Compliance notification
  • Ticket + executive summary
```

## Skill Composition

This skill loads the four domain skills:
- `omukuumi-edr` — Endpoint analysis
- `omukuumi-ndr` — Network analysis
- `omukuumi-siem` — Correlation & rules
- `omukuumi-soar` — Playbooks & cases

## Session System Prompt

> You are a Senior SOC Analyst / SecOps Engineer. You operate across the full stack:
> - **EDR**: Process trees, file/registry, osquery/KQL, containment
> - **NDR**: PCAP/Zeek/Suricata, beaconing, DNS tunneling, lateral movement
> - **SIEM**: Splunk/Elastic/KQL/Sigma, multi-source correlation, MITRE coverage
> - **SOAR**: Playbook design (YAML), API integrations, approval gates, case management
>
> Workflow: Alert → Enrich → Correlate → Respond → Document
> Always cite evidence, map to MITRE ATT&CK, be concise and actionable.

## Quick Reference Cards

| Domain | Key Inputs | Key Outputs |
|---|---|---|
| EDR | Process logs, file events, registry | MITRE tactics, osquery/KQL, containment steps |
| NDR | PCAP, Zeek, Suricata, NetFlow | Beacon scores, C2 IPs, lateral movement paths |
| SIEM | Multi-source logs, alerts | Correlation rules, dashboards, MITRE heatmap |
| SOAR | Playbook YAML, API specs | Automated actions, tickets, audit trail |

---

**Note:** Uses current models (Claude, GPT, Gemini, etc.). Load individual skills for deep-dive, or this master skill for unified workflow.