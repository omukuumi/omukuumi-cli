---
name: omukuumi-edr
description: EDR — Endpoint Detection & Response analysis, triage, and response guidance using current models
---

# EDR — Endpoint Detection & Response

**Purpose:** Help analysts investigate, triage, and respond to endpoint threats using AI-assisted analysis.

## When to Use

- Analyzing suspicious process execution
- Investigating file/registry modifications
- Triage of EDR alerts (CrowdStrike, SentinelOne, Defender, Elastic)
- Writing osquery/KQL/EDR queries
- Drafting containment/remediation steps

## Quick Commands

```
/edr analyze        — Analyze process tree / event logs
/edr query          — Generate osquery / KQL / Splunk query
/edr triage         — Triage alert with MITRE mapping
/edr contain        — Draft containment steps
/edr timeline       — Build process timeline from logs
```

## System Prompt (add to session)

> You are an EDR analyst assistant. You help investigate endpoint threats by:
> - Parsing process trees, command lines, file events, registry changes
> - Mapping to MITRE ATT&CK techniques (provide T-number + name)
> - Identifying suspicious patterns (living-off-the-land, masquerading, injection)
> - Drafting osquery/KQL/Splunk queries for hunting
> - Recommending containment: isolate host, kill process, block hash, collect artifacts
> - Always cite evidence from provided logs
> - Be concise, action-oriented, assume analyst knows basics

## Analysis Patterns

### Process Tree Analysis
```
Input: Parent: powershell.exe → Child: cmd.exe → Grandchild: whoami.exe
Command: powershell -enc <base64>
Output: T1059.001 (PowerShell) + T1027 (Obfuscated Files) → Likely payload execution
```

### File/Registry Events
```
Input: File write to %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\update.exe
Output: T1547.001 (Registry Run Keys / Startup Folder) → Persistence
```

### Network Connections from Suspicious Process
```
Input: notepad.exe → 192.168.1.100:4444
Output: T1071.001 (Web Protocols) + T1571 (Non-Standard Port) → C2 beacon
```

## Containment Checklist

- [ ] Isolate host (network quarantine)
- [ ] Kill malicious process tree
- [ ] Block file hash (EDR/AV)
- [ ] Block C2 IP/domain (firewall/proxy)
- [ ] Collect memory dump + disk image
- [ ] Reset credentials if credential access suspected
- [ ] Document timeline for reporting

## MITRE Quick Reference

| Tactic | Common Techniques |
|---|---|
| Execution | T1059.001 PowerShell, T1059.003 Windows Command Shell |
| Persistence | T1547.001 Startup Folder, T1505.003 Web Shell |
| Privilege Escalation | T1055 Process Injection, T1484 Group Policy Modification |
| Defense Evasion | T1027 Obfuscation, T1070 Indicator Removal |
| Credential Access | T1003 OS Credential Dumping, T1555 Credentials from Password Stores |
| Discovery | T1082 System Info, T1018 Remote System Discovery |
| Lateral Movement | T1021.004 Pass the Hash, T1570 Lateral Tool Transfer |
| Collection | T1005 Data from Local System, T1560 Archive Collected Data |
| Exfiltration | T1041 Exfiltration Over C2 Channel |
| Command & Control | T1071.001 Web Protocols, T1573 Encrypted Channel |

## Example Queries

### osquery (process tree)
```sql
SELECT p.pid, p.name, p.cmdline, p.parent, pp.name as parent_name
FROM processes p
LEFT JOIN processes pp ON p.parent = pp.pid
WHERE p.cmdline LIKE '%-enc%' OR p.name IN ('powershell.exe','cmd.exe','wscript.exe','cscript.exe');
```

### KQL (Defender/Sentinel)
```kql
DeviceProcessEvents
| where FileName in~ ("powershell.exe","cmd.exe","wscript.exe","cscript.exe")
| where ProcessCommandLine has "-enc"
| project Timestamp, DeviceName, FileName, ProcessCommandLine, InitiatingProcessFileName
```

### Splunk (EDR logs)
```splunk
index=edr sourcetype=edr:process
| search command_line="*-enc*"
| stats count by process_name, parent_process_name, command_line, user
| sort -count
```

---

**Note:** Uses current models (Claude, GPT, Gemini, etc.). No special security model required — just good prompts + context.