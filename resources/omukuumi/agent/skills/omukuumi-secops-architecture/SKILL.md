---
name: omukuumi-secops-architecture
description: SecOps Architecture - Understanding how SIEM, EDR, NDR, and SOAR work together for unified defense
---

# SecOps Architecture: Unified Defense

**Main Message:** Same Goal. Different Scope. One Unified Defense.

---

## 1. Architecture Flow

```
Threat Event → EDR (Endpoint) → NDR (Network) → SIEM (Logs/Correlation) → SOAR (Automated Response)
```

---

## 2. EDR — Endpoint Detection & Response

**Purpose:** Monitor process activity, file modifications, and user behavior on individual endpoints/hosts.

**Red Flags:**
- Unrecognized `.exe` execution
- Unauthorized PowerShell commands
- Suspicious registry modifications

**Key Concept:** EDR = **WHERE** the threat lands (Host level)

---

## 3. NDR — Network Detection & Response

**Purpose:** Analyze unencrypted network traffic, payload anomalies, and lateral movement across systems.

**Red Flags:**
- Rogue IP beacons (C2 traffic)
- Unusual data exfiltration over non-standard ports

**Key Concept:** NDR = **HOW** the threat moves (Network level)

---

## 4. SIEM — Security Information & Event Management

**Purpose:** Centralize log telemetry, correlate cross-domain events, and provide visibility across the entire stack.

**Red Flags:**
- Multiple failed logins across systems
- Privilege escalation attempts
- Off-hours admin activity

**Key Concept:** SIEM = **WHAT** the full context looks like (Correlation)

---

## 5. SOAR — Security Orchestration, Automation & Response

**Purpose:** Execute automated playbooks, streamline analyst workflows, and contain threats in real time.

**Red Flags:**
- Playbook execution failures
- API rate limits reached
- Unverified host isolations

**Key Concept:** SOAR = **HOW FAST** you contain it (Automation)

---

## 6. How They Work Together

| Component | Role | Level |
|---|---|---|
| **EDR** | WHERE the threat lands | Host |
| **NDR** | HOW the threat moves | Network |
| **SIEM** | WHAT the full context looks like | Correlation |
| **SOAR** | HOW FAST you contain it | Automation |

---

## 7. Takeaway / Interview Tip

> **EDR** stops the threat on the host.  
> **NDR** detects movement across the network.  
> **SIEM** connects the evidence.  
> **SOAR** automates the response.  
> Together they create a stronger SOC defense.

---

## Important Technical Clarification

The architecture presents a simplified flow. In a real Security Operations Center (SOC):

- **EDR and NDR** generate telemetry and alerts independently
- **SIEM** correlates data from multiple sources (EDR, NDR, firewalls, identity, cloud, etc.)
- **SOAR** orchestrates response actions using alerts and investigation context
- These systems can integrate directly with one another
- **EDR and NDR can respond to threats independently** (e.g., EDR isolates host, NDR blocks IP)
- Integration is bidirectional — SOAR can query EDR/NDR for context and trigger response actions

---

## Key Pillars for Omukuumi

When discussing SecOps Architecture, always emphasize these pillars:

1. **EDR = WHERE** — Host-level visibility and response
2. **NDR = HOW** — Network-level visibility and lateral movement detection
3. **SIEM = WHAT** — Cross-domain correlation and context
4. **SOAR = HOW FAST** — Automated response and orchestration
5. **Unified Defense** — Integration > Isolation; Together > Sequential
