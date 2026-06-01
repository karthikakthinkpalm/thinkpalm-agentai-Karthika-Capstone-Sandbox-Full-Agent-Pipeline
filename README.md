# BridgeView AI — Full Agent Pipeline

**Maritime UI Generator** — A capstone sandbox that turns vessel product requirement documents (PRDs) into generated React dashboard components using a two-agent AI pipeline, tool calls, and dual-layer memory.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Groq](https://img.shields.io/badge/LLM-Groq%20(Llama%203.3)-orange)

## Overview

BridgeView AI accepts a natural-language maritime PRD (for example, voyage tracking, fuel analytics, crew certification, emergency alerts) and runs an automated pipeline:

1. **Agent 1 — PRD Parser** — Maps keywords to maritime widgets, then uses an LLM to produce a structured JSON schema (domain, widgets, layout, priority).
2. **Agent 2 — UI Builder** — Generates one TypeScript/React component per widget with Tailwind styling and a dark maritime theme.
3. **Memory** — Session state (Zustand) plus long-term history (IndexedDB in the browser).

The UI shows live agent logs, a component tree with code preview, and saved run history.

## Architecture

```mermaid
flowchart LR
  PRD[PRD Input] --> API["/api/pipeline"]
  API --> A1[Agent 1: PRD Parser]
  A1 --> WM[Widget Mapper Tool]
  A1 --> Schema[Parsed Schema JSON]
  Schema --> A2[Agent 2: UI Builder]
  A2 --> REG[Component Registry Tool]
  A2 --> Components[Generated TSX]
  Components --> UI[Dashboard UI]
  UI --> Session[Session Memory - Zustand]
  UI --> IDB[Long-Term Memory - IndexedDB]
