---
name: omukuumi-soar
description: SOAR — Security Orchestration, Automation & Response playbook design, playbook execution, and case management
---

# SOAR — Security Orchestration, Automation & Response

**Purpose:** Help analysts design, execute, and manage automated response playbooks using AI-assisted playbook engineering.

## When to Use

- Designing playbooks for common alerts (phishing, malware, brute force, etc.)
- Writing playbook steps (API calls, enrichment, containment, notification)
- Integrating with EDR/NDR/SIEM/Ticketing APIs
- Building approval gates for high-impact actions
- Case management workflows

## System Prompt

> You are a SOAR engineer assistant. You help by:
> - Designing playbooks as structured workflows (YAML/JSON)
> - Mapping alert types → playbook triggers
> - Writing integration steps: API calls to EDR (isolate), Firewall (block), AD (disable), Ticketing (create)
> - Building approval gates: analyst approval for host isolation, credential reset, block IP
> - Handling errors: retry logic, fallback actions, compensation transactions
> - Documenting playbook: inputs, outputs, MITRE mapping, test cases
> - Managing cases: triage → investigate → contain → remediate → close
> - Always consider: idempotency, rollback, audit trail, rate limits

## Playbook Structure

```yaml
playbook:
  id: "phishing-email-investigation"
  name: "Phishing Email Investigation & Response"
  version: "1.2"
  trigger:
    type: "alert"
    source: "siem"
    condition: "rule_id == 'phishing-email-detected'"
  inputs:
    - email_id
    - sender
    - recipient
    - subject
    - attachments[]
    - urls[]
  steps:
    - id: "enrich_iocs"
      name: "Enrich IOCs"
      action: "api_call"
      target: "threat_intel"
      params:
        iocs: "{{ inputs.urls + inputs.attachments[*].hash }}"
      outputs: [intel_score, malware_families]
      on_error: "continue"

    - id: "analyze_attachments"
      name: "Detonate Attachments"
      action: "sandbox"
      target: "cuckoo"
      params:
        files: "{{ inputs.attachments }}"
      condition: "{{ steps.enrich_iocs.outputs.intel_score > 50 }}"
      outputs: [behavior_report, mitre_techniques]

    - id: "check_user_reports"
      name: "Check User Reports"
      action: "api_call"
      target: "email_security"
      params:
        query: "sender:{{ inputs.sender }} AND recipient:{{ inputs.recipient }}"
      outputs: [similar_emails_count]

    - id: "approval_gate"
      name: "Analyst Approval for Containment"
      action: "approval"
      type: "manual"
      params:
        message: "Phishing confirmed (score: {{ steps.enrich_iocs.outputs.intel_score }}). Contain?"
        options: ["Contain", "Monitor", "Close"]
      required: true

    - id: "contain"
      name: "Contain Threat"
      action: "parallel"
      steps:
        - id: "block_sender"
          action: "api_call"
          target: "email_gateway"
          params: { action: "block", sender: "{{ inputs.sender }}" }
        - id: "block_urls"
          action: "api_call"
          target: "web_proxy"
          params: { action: "block", urls: "{{ inputs.urls }}" }
        - id: "delete_emails"
          action: "api_call"
          target: "o365"
          params: { action: "purge", email_id: "{{ inputs.email_id }}" }
      condition: "{{ steps.approval_gate.outputs.decision == 'Contain' }}"

    - id: "create_ticket"
      name: "Create Jira Ticket"
      action: "api_call"
      target: "jira"
      params:
        project: "SOC"
        summary: "Phishing: {{ inputs.subject }}"
        description: |
          Playbook: phishing-email-investigation
          IOCs enriched: {{ steps.enrich_iocs.outputs.intel_score }}
          Action: {{ steps.approval_gate.outputs.decision }}
        labels: ["phishing", "auto-response"]
      outputs: [ticket_id]

    - id: "notify"
      name: "Notify Stakeholders"
      action: "api_call"
      target: "slack"
      params:
        channel: "#soc-alerts"
        message: "Phishing playbook executed. Ticket: {{ steps.create_ticket.outputs.ticket_id }}"
  outputs:
    - case_id
    - containment_status
    - ticket_id
```

## Common Playbook Templates

### 1. Phishing Email
```
Trigger: SEIM alert "phishing-email-detected"
Steps: Enrich IOCs → Sandbox → Check similar → Approval → Block/Delete → Ticket → Notify
```

### 2. Malware Execution (EDR Alert)
```
Trigger: EDR alert "suspicious-process-execution"
Steps: Enrich hash → Check prevalence → Isolate host (approval) → Kill process → Block hash → Collect artifacts → Ticket
```

### 3. Brute Force (AD/VPN)
```
Trigger: SIEM correlation "multiple-failed-logins"
Steps: Enrich source IP → Check geo → Block IP (auto if >50 fails) → Reset password (approval) → Notify user → Ticket
```

### 4. C2 Beacon (NDR Alert)
```
Trigger: NDR alert "beaconing-detected"
Steps: Enrich C2 IP → Block at firewall/proxy → Isolate host (approval) → Memory dump → Ticket
```

### 5. Data Exfiltration
```
Trigger: DLP/NDR alert "large-data-transfer"
Steps: Identify source host/user → Check data classification → Block egress (approval) → Preserve evidence → Ticket
```

## Integration API Examples

### EDR (CrowdStrike) — Isolate Host
```python
POST /devices/entities/containments/v1
{
  "action_name": "contain",
  "ids": ["host-uuid"]
}
```

### Firewall (Palo Alto) — Block IP
```xml
<entry name="block-c2-{{ c2_ip }}">
  <source><member>any</member></source>
  <destination><member>{{ c2_ip }}</member></destination>
  <service><member>application-default</member></service>
  <action>deny</action>
</entry>
```

### AD (Microsoft Graph) — Disable User
```http
PATCH /users/{{ upn }}
{ "accountEnabled": false }
```

### Ticketing (Jira) — Create Case
```json
{
  "fields": {
    "project": { "key": "SOC" },
    "summary": "Auto-response: {{ alert_name }}",
    "description": "{{ playbook_context }}",
    "issuetype": { "name": "Security Incident" }
  }
}
```

---

**Note:** Uses current models. Define your integrations + approval policy for tailored playbooks.