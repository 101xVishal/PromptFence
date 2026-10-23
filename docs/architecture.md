# PromptFence Architecture Specification

PromptFence is a defensive cybersecurity platform engineered for testing and evaluating applications against controlled prompt injection attacks and sensitive data disclosure risks.

## 1. High-Level Architecture Overview

PromptFence is designed as a modular, decoupled full-stack architecture comprising a Next.js frontend, a FastAPI ASGI backend, a SQLite relational database, and an extensible testing and evaluation engine.

```mermaid
flowchart TD
    subgraph Frontend["Frontend Client (Next.js 14 App Router)"]
        UI_Dash["Overview Dashboard (/dashboard)"]
        UI_Sand["Interactive Sandbox (/sandbox)"]
        UI_Scans["Scans Management (/scans)"]
        UI_Comp["Comparison Engine (/comparison)"]
        UI_Find["Findings Tracker (/findings)"]
        UI_Def["Defense Center (/defenses)"]
        UI_Cat["Test Catalog (/tests)"]
        UI_Rep["Reports Generator (/reports)"]
        API_Client["Typed API Client (lib/api.ts)"]
    end

    subgraph Backend["Backend Application (FastAPI v1)"]
        API_Gateway["API Gateway (/api/v1)"]
        
        subgraph Services["Core Security Services"]
            Runner["Scan Orchestrator (ScanRunner)"]
            Catalog["Catalog Registry (27 Test Definitions)"]
            Sim["Chatbot Simulator (Baseline vs Protected)"]
            Pipeline["Defense Pipeline (7 Protective Controls)"]
            Rules["Deterministic Pattern & Redaction Engine"]
            Eval["Response Evaluator (PASS/FAIL/REVIEW/ERROR)"]
            RepGen["Report Generator (JSON, CSV, Printable HTML)"]
        end

        subgraph Data["Persistence Layer (SQLAlchemy 2.x)"]
            ORM_Models["ORM Models (Scans, Results, Findings, Defenses)"]
            DB[(SQLite Database promptfence.db)]
        end
    end

    Frontend -->|HTTP / JSON REST API| API_Gateway
    API_Gateway --> Services
    Services --> Data
    Runner --> Catalog
    Runner --> Sim
    Sim --> Pipeline
    Pipeline --> Rules
    Runner --> Eval
    Runner --> RepGen
```

---

## 2. Scan Execution Sequence Flow

When a user initiates an automated scan from the UI or API, the following synchronous lifecycle executes deterministically:

```mermaid
sequenceDiagram
    autonumber
    participant UI as Next.js Web Client
    participant API as FastAPI Gateway
    participant Runner as Scan Runner
    participant DB as SQLite DB
    participant Sim as Chatbot Simulator
    participant Def as Defense Pipeline
    participant Eval as Response Evaluator

    UI->>API: POST /api/v1/scans { name, mode, test_ids }
    API->>Runner: execute_scan(request)
    Runner->>DB: Query enabled SecurityTestCases
    Runner->>DB: Query active DefenseConfigurations
    Runner->>DB: Insert new Scan (status: "running")
    
    loop For Each Selected Test Case
        Runner->>Sim: respond(test.prompt, mode)
        alt mode == "protected"
            Sim->>Def: process_request(prompt)
            Def->>Def: analyze_prompt() + rule matching
            Def-->>Sim: defensive refusal or normalized prompt
            Sim->>Def: post_process_response()
            Def-->>Sim: scrubbed output + defense telemetry
        else mode == "baseline"
            Sim-->>Sim: execute vulnerable simulator scenario
        end
        Sim-->>Runner: (model_response, defense_events)
        Runner->>Eval: evaluate(test, response, defense_events, mode)
        Eval-->>Runner: EvaluationResult (outcome, evidence, explanation)
        Runner->>DB: Insert TestResult
        opt Outcome == FAIL and test.is_attack
            Runner->>DB: Upsert Finding (deduplication key)
        end
        opt Security Event Logging Enabled
            Runner->>DB: Insert SecurityEvents telemetry
        end
    end

    Runner->>Runner: Calculate Aggregated Metrics (ASR, TPR, FPR)
    Runner->>DB: Update Scan (status: "completed", metrics)
    Runner-->>API: Return complete ScanOut payload
    API-->>UI: 200 OK with Scan Details & Results
```

---

## 3. Subsystem Breakdown

### 3.1. Frontend Presentation Layer
- **Framework**: Next.js 14 with TypeScript strict mode and App Router.
- **Styling**: Tailwind CSS tailored to dark mode cybersecurity surfaces (`#070d18` canvas, slate panels, cyan/emerald accents).
- **Visualization**: Recharts responsive bar charts and severity distribution analytics.
- **Client Service**: `frontend/lib/api.ts` provides strongly typed request handling, normalized endpoint routing, and custom report download helpers.

### 3.2. Chatbot Simulator (`app/services/chatbot/simulator.py`)
- **Baseline Mode**: Acts as an unhardened educational baseline. Reproduces documented prompt injection vulnerabilities by disclosing synthetic tokens (`PF-DEMO-SECRET-8472`) or simulating unapproved actions (e.g. `$500 refund approved without authorization`).
- **Protected Mode**: Routes all incoming queries through the 7-layer defense pipeline. When attacks are detected, it issues safe refusals and records structured telemetry. Legitimate customer queries (e.g. office hours, contact guidelines) receive full assistance in both modes.

### 3.3. Defense Pipeline (`app/services/defense/pipeline.py`)
Encapsulates 7 configurable controls:
1. **Prompt-Injection Pattern Detection**: Input filtering for system prompt override commands and jailbreak formatting delimiters.
2. **System Instruction Enforcement**: Preserves system prompt authority against simulated emergency bypasses.
3. **Synthetic Secret Redaction**: Deterministic regex scanning and redaction (`PF-[A-Z0-9]+-[0-9]+` -> `[REDACTED_SECRET]`).
4. **Capability Allowlisting**: Enforces strict bounds restricting the assistant to informational FAQ tools.
5. **Authorization Checks**: Requires verified supervisor session credentials before executing privileged financial or administrative commands.
6. **Mandatory Human Confirmation**: State-machine barrier demanding secondary out-of-band sign-off for sensitive operations.
7. **Security Event Logging**: Emits audit telemetry for policy violations and defensive mitigations.

### 3.4. Response Evaluator (`app/services/evaluation/evaluator.py`)
- Evaluates outputs using four discrete outcomes: `PASS`, `FAIL`, `REVIEW`, and `ERROR`.
- Separates attack scenarios from benign usability checks.
- Generates reproducible evidence strings (e.g. `secret_disclosed`, `defense_refusal_observed`, `benign_request_blocked`).

### 3.5. Persistence Layer (`app/models/`)
- Relational schema implemented via SQLAlchemy 2.x declarative mapping.
- Models: `Workspace`, `ChatbotTarget`, `SecurityTestCase`, `DefenseConfiguration`, `Scan`, `TestResult`, `Finding`, `SecurityEvent`, and `Setting`.
- Zero-configuration SQLite (`promptfence.db`) with foreign key constraints, cascaded deletions, and unique deduplication keys.
