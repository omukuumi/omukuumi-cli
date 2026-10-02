# Omukuumi CLI — Cybersecurity AI Agent

Omukuumi is an AI-powered cybersecurity operations agent for the terminal. It combines AI chat with live security scanning, AD attack methodology, web security testing, OSINT, cloud security assessment, and incident management — all in a single 3-column TUI.

## Features

| Feature | Description |
|---------|-------------|
| **3-Column TUI** | Left: Findings/Updates/Incidents · Center: Scrollable AI workspace · Right: Time/Packets/WiFi |
| **Mouse + Keyboard Scrolling** | SGR mouse support + PgUp/PgDn/Home/End |
| **8 Cybersecurity Skills** | hexstrike-ai, web-security, AD-attack, binary-malware, OSINT, cloud-security, defensive, incident-management |
| **Live Network Scanning** | nmap, ARP, tcpdump — data populates panels in real time |
| **HexStrike MCP Server** | 150+ security tools via MCP protocol |
| **Fixed Input** | Editor anchored at bottom, never scrolls away |
| **Auto-Scroll** | Follows new output; "↓ New output" indicator when scrolled up |
| **Uganda/EA Localized** | Cost in UGX, timezone Kampala, sponsor Genesis Codeworks Ltd |
| **Session Persistence** | `/continue` to resume interrupted sessions |

## Quick Start

```bash
# Build packages
cd packages/tui && npm install && npm run build && cd ../..
cd packages/ai && npm install && npm run build && cd ../..
cd packages/agent && npm install && npm run build && cd ../..
cd packages/coding-agent && npm install && npm run build

# Run
./packages/coding-agent/dist/cli.js
```

## TUI Layout

```
┌────────────────┬──────────────────────────────────────────┬────────────────┐
│  OMUKUUMI      │   ___  __  __ _  ...                    │  Controls      │
│  1. VULNS      │   Omukuumi ASCII logo                   │  /copy /export │
│  2. UPDATES    │                                          ├────────────────┤
│  3. INCIDENTS  │   Scrollable AI Workspace                │  Time          │
│                │                                          │  15:29:44 EAT  │
│                │   Chat / commands / tool output          ├────────────────┤
│                │                                          │  Packets       │
│                │   Sponsored by Genesis Codeworks Ltd     │  tcpdump sum.. │
│                ├──────────────────────────────────────────┤────────────────┤
│                │ > command/input (fixed at bottom)        │  WiFi Devices  │
└────────────────┴──────────────────────────────────────────┴────────────────┘
```

## Skills

Skills auto-load from `~/.omukuumi/agent/skills/` — 8 available:

| Skill | Description |
|-------|-------------|
| **omukuumi-hexstrike** | MCP pentesting — 150+ tools (nmap, nuclei, metasploit, ghidra, sqlmap) |
| **omukuumi-web-security** | OWASP Top 10, API security, SSRF, IDOR, JWT, GraphQL, cloud PaaS |
| **omukuumi-ad-attack** | 6-phase AD kill chain, BloodHound, Impacket, CrackMapExec |
| **omukuumi-binary-malware** | Binary exploitation, pwntools, Ghidra reverse engineering, malware analysis |
| **omukuumi-osint** | 7-phase OSINT — domain, email, social media, image, dark web investigation |
| **omukuumi-cloud-security** | AWS/Azure/GCP assessment, container/K8s escape, cloud PaaS |
| **omukuumi-defensive** | Blue team, IR, SIEM detection (Splunk/ELK), Sigma/YARA, forensics |
| **omukuumi-incident-management** | IR workflow, digital forensics, Uganda/EA regulatory compliance |

## Architecture

```
packages/
├── coding-agent/     Main TUI application
├── tui/              Terminal UI framework
├── ai/               AI provider integrations
├── agent/            Agent harness
└── orchestrator/     Multi-process orchestration

services/tool-runner/ Background Docker tool runner (nmap, tcpdump, arp)
mcp-servers/          MCP server configs (hexstrike.json)
resources/            Models, skills, language data
```

## Background Tool Runner

```bash
cd services/tool-runner
docker compose up -d
```

Runs nmap + arp + tcpdump periodically, writes JSON to `./output/` for live panel data.

## License

Powered by **Genesis Codeworks Ltd** — Kampala, Uganda