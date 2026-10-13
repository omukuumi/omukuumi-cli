---
name: omukuumi-siem
description: SIEM — Security Information & Event Management correlation, rule writing, and alert triage
---

# SIEM — Security Information & Event Management

**Purpose:** Help analysts write detection rules, correlate multi-source logs, triage alerts, and build dashboards using AI-assisted analysis.

## When to Use

- Writing Splunk/Elastic/KQL/Sigma detection rules
- Correlating logs across EDR, NDR, Firewall, Identity, Cloud
- Triage high-volume alerts (reduce false positives)
- Building correlation searches / saved searches
- Creating MITRE ATT&CK coverage maps

## System Prompt

> You are a SIEM engineer/analyst assistant. You help by:
> - Writing detection rules (Splunk SPL, Elastic DSL, KQL, Sigma)
> - Correlating events across sources: EDR + NDR + Firewall + AD + CloudTrail
> - Reducing false positives with enrichment (threat intel, asset criticality, user behavior)
> - Building MITRE ATT&CK coverage matrices (what's detected, what's missing)
> - Triage: alert → enrichment → context → disposition
> - Creating dashboards for SOC visibility (MITRE heatmap, alert volume, MTTD/MTTR)
> - Always explain logic, provide test cases, cite data sources

## Correlation Patterns

### Multi-Source Alert Correlation
```
EDR: powershell -enc on host A
NDR: host A → C2 IP on 443
Firewall: host A allowed outbound 443
AD: user jdoe logged on host A 08:00
Correlation: Single attack chain → T1059.001 + T1071.001 + T1078
```

### Impossible Travel / Geo Anomaly
```
AD: user jdoe login from New York 08:00
AD: user jdoe login from London 08:45
VPN: no VPN session
Correlation: T1078 (Valid Accounts) + T1584 (Compromise Infrastructure)
```

### Privilege Escalation Chain
```
EDR: runas /user:admin cmd.exe
AD: user added to Domain Admins
EDR: scheduled task created as SYSTEM
Correlation: T1068 (Exploitation for Privilege Escalation) + T1484
```

## Example Rules

### Splunk (MITRE-mapped)
```splunk
index=edr sourcetype=edr:process
| eval mitre_tactic=case(
    like(command_line,"% -enc %"), "Execution:T1059.001",
    like(target_filename,"%\\Startup\\%"), "Persistence:T1547.001",
    like(command_line,"%sekurlsa%"), "Credential Access:T1003.001"
)
| where isnotnull(mitre_tactic)
| stats count by mitre_tactic, user, Computer
```

### Elastic (KQL) — Credential Access
```kql
sequence by host.id with maxspan=5m
  [ process where process.name : "lsass.exe" and event.action : "access" ]
  [ process where process.name : ("procdump.exe","comsvcs.dll","sqldumper.exe") ]
```

### Sigma (Windows Event Log)
```yaml
title: Suspicious Scheduled Task Creation
id: d4f8e1a2-3b7c-4e9f-8a1b-2c3d4e5f6a7b
status: test
description: Detects scheduled task created via schtasks or COM
logsource: { product: windows, service: security }
detection:
  selection:
    EventID: 4698
    TaskContent|contains:
      - "powershell"
      - "cmd.exe"
      - "wscript"
  condition: selection
```

### KQL (Sentinel) — MITRE Coverage Dashboard
```kql
let mitre_coverage = datatable(technique:string, tactic:string, rule:string, status:string)
[
  "T1059.001", "Execution", "PowerShell_EncodedCommand", "Active",
  "T1059.003", "Execution", "CMD_Suspicious_Args", "Active",
  "T1547.001", "Persistence", "Startup_Folder_Write", "Active",
  "T1003.001", "Credential Access", "LSASS_Access", "Gap"
];
mitre_coverage
| summarize gaps=countif(status=="Gap"), active=countif(status=="Active") by tactic
```

---

**Note:** Uses current models. Provide sample logs + environment context for tailored rules.