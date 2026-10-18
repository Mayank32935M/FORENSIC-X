<div align="center">

# 🔬 FORENSIC-X
### Verifiable Digital Forensics & Incident Reconstruction Framework

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Python: 3.12+](https://img.shields.io/badge/Python-3.12%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/Frontend-React_19-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC.svg)](https://tailwindcss.com/)
[![Integrity: SHA-256](https://img.shields.io/badge/Integrity-SHA--256_Ledger-10B981.svg)](#-cryptographic-chain-of-custody)
[![Tests: 19/19 Passing](https://img.shields.io/badge/Tests-19%2F19_Passing-brightgreen.svg)](#-testing--verification)

**FORENSIC-X** is an end-to-end verifiable digital forensics and incident reconstruction framework engineered to bridge raw digital artifacts and court-admissible forensic reconstructions. Built on strict **epistemic truth separation ([ADR-006](DOCS/adr/006-epistemic-tiers.md))**, an **immutable on-disk evidence store**, a **cryptographic blockchain-style chain-of-custody ledger**, an **entity knowledge graph**, and an **adversarially hardened AI Forensics Copilot**, it eliminates evidence contamination, hallucinated assertions, and retroactively falsified audit trails.

[Quickstart](#-quickstart-guide) • [Visual Showcase](#-visual-showcase) • [Architecture](#-system-architecture) • [Epistemic Tiers](#-epistemic-truth-hierarchy) • [API Catalog](#-api-endpoints-catalog) • [Testing](#-testing--verification) • [Roadmap](#-roadmap--prototype-build-status) • [Documentation](DOCS/)

</div>

---

## 📸 Visual Showcase

Explore the interactive interface and investigative tools built for **FORENSIC-X**.

### 1. Central Pipeline & Visual Telemetry Dashboard
Real-time pipeline telemetry (Backend Core, Database, ZFS Evidence Store, Hash Engine), SVG Epistemic Distribution donut, Custody Integrity radial gauge, Evidence Source coverage, and a 12-week investigator activity heatmap.
![FORENSIC-X Dashboard](DOCS/images/dashboard.png)

---

### 2. AI Forensics Copilot & Explainable Interpretations (`Ctrl+J` / `⌘J`)
Deterministic forensic reasoner with adversarial prompt-injection defense. Synthesizes formal incident briefs with $T_0$ delta chronologies, runs automated anomaly scans, formulates hypotheses with corroboration checklists, and promotes AI deductions into official case findings with 1 click.
![AI Forensics Copilot](DOCS/images/copilot.png)

---

### 3. Entity Relationship Graph
Multi-entity knowledge graph connecting hosts, user accounts, files, USB removable devices, and external IPs into directed attack-chain sequences with blast-radius inspection.
![Entity Relationship Graph](DOCS/images/relationship_graph.png)

---

### 4. Epistemic Findings & Truth Tiers (ADR-006)
Explicit demarcation of facts into **Verified Observations** (disk byte truth), **Analytical Inferences** (correlations requiring explicit leaps), and **Investigative Hypotheses** with clickable observation citations.
![Findings & Hypotheses](DOCS/images/findings.png)

---

### 5. Multi-Format Evidence Log Parsers & Observations Matrix
High-throughput stream parsers for Linux Syslog, SSH Auth logs, and CSV USB registries, extracting granular forensic observations linked back to source file offsets and line numbers.
![Evidence Repository & Custody Matrix](DOCS/images/evidence_matrix.png)

---

### 6. Temporal Event Reconstruction
Harmonized chronological sequence displaying incident deltas ($T_0$), raw timestamp mapping, NTP drift adjustments, and normalized UTC markers.
![Temporal Event Reconstruction](DOCS/images/timeline.png)

---

### 7. Case Overview & Cryptographic Audit Dossier
Comprehensive case tracking displaying seized artifact metrics, timeline clusters, and on-demand chain-of-custody auditing with interim Merkle-style audit hashes.
![Case Overview](DOCS/images/case_overview.png)

---

### 8. Case Directory & Investigative Wizard
Case workspace management with status tracking, investigator assignments, evidence counting, and guided new-case initialization wizard.
![Case Directory](DOCS/images/cases_list.png)
![Create Case Wizard](DOCS/images/create_case.png)

---

## 🏛 System Architecture

FORENSIC-X is designed around an append-only, tamper-evident architecture:

```mermaid
graph TD
    UI[Frontend Client: React 19 + TypeScript + Vite :5173] -->|Reverse Proxy /api| API[FastAPI Core Server :8000]
    
    subgraph Backend Engine
        API --> DB[(SQLite Database: forensic_x.db)]
        API --> STORE[Immutable Evidence Store: data/evidence_store/]
        API --> CUSTODY[Cryptographic Ledger Service]
        API --> PARSERS[Multi-Format Log Parsers: Syslog, Auth, CSV]
        API --> TIMELINE[Temporal Normalization Engine]
        API --> GRAPH[Entity Knowledge Graph Service]
        API --> FINDINGS[Epistemic Findings Service]
        API --> COPILOT[Explainable AI Forensics Copilot]
    end
    
    STORE -->|SHA-256 Hash Verification| VERIFY[Tamper Detection System]
    CUSTODY -->|Prior Record Hash Links| AUDIT[Verifiable Chain of Custody]
    PARSERS -->|Granular Provenance| OBS[Observations Table]
    OBS --> FINDINGS
    OBS --> GRAPH
    OBS --> COPILOT
```

### Core Architecture Principles
1. **Immutable Storage ([ADR 004](DOCS/adr/004-evidence-storage.md))**: Ingested physical artifacts are written to `data/evidence_store/<case_id>/` and marked read-only.
2. **Cryptographic Chain of Custody**: Every custody action (`ACQUIRED`, `VERIFIED`, `ACCESSED`, `ANALYZED`) links to the cryptographic hash of the preceding record (`prior_record_hash`). Any retroactive database modification breaks the chain.
3. **UTC Normalization**: Disparate log formats (syslog, auth.log, Windows EVTX, CSV) are normalized into ISO 8601 UTC with relative offset computation ($T_0$).
4. **Epistemic Truth Separation ([ADR 006](DOCS/adr/006-epistemic-tiers.md))**: Physical data is clearly demarcated from machine deductions or investigator hypotheses. Inferences and hypotheses cannot claim the status of direct observations.
5. **Untrusted Evidence Defense**: Forensic evidence is untrusted; raw log contents are sanitized against prompt-injection overrides before passing into analytical or AI models.

---

## 🧭 Epistemic Truth Hierarchy

FORENSIC-X strictly categorizes all investigative knowledge into three distinct tiers:

| Tier | Name | Epistemic Basis | Requirement | Example |
|---|---|---|---|---|
| **Tier 1** | **Verified Observation** | Cryptographically verified disk bytes, exact log records, file hashes. | Direct artifact provenance & SHA-256 match. | `SHA-256: 59fa4e...` matching physical file on disk |
| **Tier 2** | **Analytical Inference** | Machine correlations or investigative leaps derived from two or more Tier 1 facts. | Mandatory explicit reasoning leap & citations. | USB device plugged in at `08:15` followed by file copy to `E:\` at `08:22` |
| **Tier 3** | **Investigative Hypothesis** | Plausible scenarios or motive theories requiring corroboration. | Corroboration checklist & uncertainty declaration. | "Exiting employee maliciously copied proprietary code to personal USB" |

---

## 📡 API Endpoints Catalog

The FastAPI backend exposes a fully typed REST API with interactive OpenAPI documentation available at `/docs`.

### 1. System & Global
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status, database connectivity, and engine version |
| `GET` | `/api/search?q={query}&case_id={case_id}` | Unified search across cases, evidence, observations, and findings |

```bash
# Verify health
curl -s http://127.0.0.1:8000/api/health
```

### 2. Cases Management
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/cases` | List all investigation cases |
| `POST` | `/api/cases` | Create a new investigation case |
| `GET` | `/api/cases/{case_id}` | Retrieve case details by ID |
| `GET` | `/api/cases/{case_id}/telemetry` | Pipeline telemetry, epistemic distribution, and custody score |
| `GET` | `/api/cases/{case_id}/audit-hash` | Compute interim Merkle audit hash across case custody records |

### 3. Evidence & Cryptographic Custody
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/cases/{case_id}/evidence` | List all seized evidence artifacts for a case |
| `POST` | `/api/cases/{case_id}/evidence` | Upload & ingest evidence file (SHA-256 hashed on ingest) |
| `POST` | `/api/cases/{case_id}/evidence/metadata` | Ingest external evidence metadata without file upload |
| `GET` | `/api/evidence/{evidence_id}` | Retrieve specific evidence item metadata |
| `POST` | `/api/evidence/{evidence_id}/verify` | Re-hash physical file on disk and verify against ledger |
| `GET` | `/api/cases/{case_id}/custody` | Retrieve custody ledger audit trail |
| `GET` | `/api/cases/{case_id}/custody/verify` | Verify entire cryptographic chain of custody continuity |

```bash
# Verify evidence file on-disk integrity
curl -X POST http://127.0.0.1:8000/api/evidence/{evidence_id}/verify

# Verify chain-of-custody hash continuity
curl -s http://127.0.0.1:8000/api/cases/{case_id}/custody/verify
```

### 4. Observations & Log Parsers
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/evidence/{evidence_id}/parse` | Trigger stream parser (syslog, auth, CSV) on evidence file |
| `GET` | `/api/cases/{case_id}/observations` | List extracted observations with line/offset provenance |

### 5. Timeline & Temporal Reconstruction
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/cases/{case_id}/timeline` | Normalized UTC chronological sequence with $T_0$ deltas |
| `GET` | `/api/timeline` | Global timeline across all cases |

### 6. Entity Knowledge Graph
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/cases/{case_id}/graph` | Entity graph nodes, directed edges, and blast-radius clusters |

### 7. Epistemic Findings
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/cases/{case_id}/findings` | List analytical findings (filterable by `tier`) |
| `POST` | `/api/cases/{case_id}/findings` | Assert an analytical finding with epistemic tier & citations |
| `GET` | `/api/cases/{case_id}/findings/summary` | Summary metrics of findings per epistemic tier |
| `GET` | `/api/findings/{finding_id}` | Retrieve single finding by ID |

### 8. AI Forensics Copilot
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/cases/{case_id}/copilot/query` | Query copilot with natural language or targeted mode |
| `POST` | `/api/cases/{case_id}/copilot/narrative` | Synthesize complete incident reconstruction brief ($T_0$ relative) |
| `POST` | `/api/cases/{case_id}/copilot/anomalies` | Automated anomaly scan (bursts, off-hours, volume spikes) |
| `POST` | `/api/cases/{case_id}/copilot/hypotheses` | Formulate investigative hypotheses with corroboration checklists |
| `GET` | `/api/cases/{case_id}/copilot/history` | Audit trail of all copilot prompts, sanitizations, and deductions |

```bash
# Generate formal incident brief via AI Copilot
curl -X POST http://127.0.0.1:8000/api/cases/{case_id}/copilot/narrative \
  -H "Content-Type: application/json"
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Python 3.12+** (tested on Python 3.12, 3.13, 3.14)
- **Node.js 18+** & `npm`
- **Git**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Mayank32935M/FORENSIC-X.git
cd "FORENSIC X"
```

---

### Step 2: Set Up and Run the Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Windows (CMD):
# .venv\Scripts\activate.bat
# Linux / macOS:
# source .venv/bin/activate

# Install dependencies in editable mode
pip install -e .

# Seed database with the synthetic "Phantom Exfiltration" breach scenario
python -m app.scripts.load_scenario

# Launch FastAPI server with auto-reload
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend API will be live at:
- **Root & Redirect**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/) (Redirects browsers to `/docs`, returns JSON to API clients)
- **API Health**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Specification**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

### Step 3: Set Up and Run the Frontend

Open a new terminal window:

```bash
cd frontend

# Install frontend dependencies
npm install

# Start Vite dev server (proxies /api to http://127.0.0.1:8000)
npm run dev
```

The web application will be accessible at:
- **Interactive Forensic Workbench**: [http://localhost:5173/](http://localhost:5173/)

---

## 🧪 Testing & Verification

The test suite validates cryptographic hashing, tamper-evident ledger verification, multi-format stream parsers, entity knowledge graph generation, epistemic findings, and AI copilot prompt injection resistance.

```bash
cd backend

# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

pytest -v
```

Current Test Results (19/19 Passing):
```text
tests/unit/test_ai_copilot.py::test_copilot_narrative_endpoint PASSED             [  5%]
tests/unit/test_ai_copilot.py::test_copilot_anomalies_endpoint PASSED             [ 10%]
tests/unit/test_ai_copilot.py::test_copilot_hypotheses_endpoint PASSED            [ 15%]
tests/unit/test_ai_copilot.py::test_copilot_prompt_injection_sanitization PASSED  [ 21%]
tests/unit/test_ai_copilot.py::test_copilot_history_endpoint PASSED               [ 26%]
tests/unit/test_api_endpoints.py::test_health_endpoint PASSED                     [ 31%]
tests/unit/test_api_endpoints.py::test_observations_endpoint PASSED               [ 36%]
tests/unit/test_api_endpoints.py::test_graph_endpoint PASSED                      [ 42%]
tests/unit/test_api_endpoints.py::test_findings_endpoint PASSED                   [ 47%]
tests/unit/test_api_endpoints.py::test_global_search_endpoint PASSED              [ 52%]
tests/unit/test_custody.py::test_custody_chain_integrity PASSED                   [ 57%]
tests/unit/test_hashing.py::test_compute_file_hash PASSED                         [ 63%]
tests/unit/test_hashing.py::test_verify_hash PASSED                               [ 68%]
tests/unit/test_hashing.py::test_compute_file_hash_unsupported_algorithm PASSED  [ 73%]
tests/unit/test_hashing.py::test_compute_file_hash_file_not_found PASSED          [ 78%]
tests/unit/test_parsers.py::test_detect_parser PASSED                             [ 84%]
tests/unit/test_parsers.py::test_syslog_parser PASSED                             [ 89%]
tests/unit/test_parsers.py::test_auth_parser PASSED                               [ 94%]
tests/unit/test_parsers.py::test_csv_parser PASSED                                [100%]

============================= 19 passed in 1.32s ==============================
```

---

## 📂 Project Structure

```text
FORENSIC-X/
├── backend/
│   ├── app/
│   │   ├── api/                  # FastAPI REST routers
│   │   │   ├── endpoints.py               # Cases CRUD, telemetry, search, health
│   │   │   ├── evidence_endpoints.py      # Ingestion, SHA-256 & custody ledger
│   │   │   ├── timeline_endpoints.py      # UTC timeline & $T_0$ normalization
│   │   │   ├── observation_endpoints.py   # Multi-format observation extraction
│   │   │   ├── graph_endpoints.py         # Knowledge graph query endpoints
│   │   │   ├── findings_endpoints.py      # Epistemic findings & citations
│   │   │   └── ai_endpoints.py            # AI Forensics Copilot endpoints
│   │   ├── core/                 # Config, security, logging
│   │   ├── db/                   # SQLAlchemy async engine & Base
│   │   ├── models/               # Relational entities (Case, Evidence, Finding, etc.)
│   │   ├── parsers/              # Stream parsers: Syslog, Auth, CSV USB
│   │   ├── schemas/              # Pydantic v2 data contracts
│   │   ├── scripts/              # Synthetic incident seeder (load_scenario.py)
│   │   └── services/             # Custody, hashing, graph, findings, and copilot
│   ├── tests/                    # 19 comprehensive unit tests
│   └── pyproject.toml            # Backend packaging & dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/           # UI components (AICopilotDrawer, Layout, Modals)
│   │   ├── context/              # CaseContext with global hotkeys (Ctrl+K, Ctrl+J)
│   │   ├── pages/                # Dashboard, Evidence, Timeline, Graph, Findings
│   │   ├── services/             # Frontend API client (api.ts)
│   │   ├── App.tsx               # Client router & navigation
│   │   └── index.css             # Tailwind darkroom design system
│   ├── public/                   # Custom favicon.svg cyber shield
│   └── package.json              # Frontend dependencies & scripts
│
├── data/
│   ├── evidence_store/           # Immutable evidence vault
│   └── synthetic/                # Breach log corpora (auth.log, syslog, usb.csv)
├── DOCS/
│   ├── adr/                      # Architectural Decision Records (ADRs 001 - 006)
│   └── images/                   # High-resolution prototype UI screenshots
├── LICENSE                       # Apache 2.0 License
├── CONTRIBUTING.md               # Contribution guidelines
├── SECURITY.md                   # Security policy & evidence disclosure
└── README.md                     # Project documentation
```

---

## 🗺 Roadmap & Prototype Build Status

- [x] **Phase 1-4**: Core relational models, async database layer, FastAPI backend.
- [x] **Phase 5**: Evidence ingestion, on-disk SHA-256 verification, and hash-chain custody.
- [x] **Phase 5.5**: Modern high-density darkroom UI, evidence matrix, timeline viewer, and case wizard.
- [x] **Phase 6**: Multi-format log parsers (Linux Syslog, SSH Auth, CSV USB registry) with source line/offset tracking.
- [x] **Phase 7**: Dynamic entity knowledge graph (nodes, relationships, attack chain paths, and blast radius).
- [x] **Phase 8**: Epistemic Truth Tiers & findings assertion engine ([ADR-006](DOCS/adr/006-epistemic-tiers.md): Verified Observations, Inferences, Hypotheses).
- [x] **Phase 9**: AI Forensics Copilot & Explainable Interpretations (Prompt-injection defense, formal briefs, anomaly scanning, one-click promote to finding).
- [ ] **Phase 10**: Legal Court Dossier Generation & Forensic Case Archival / Export (PDF, Markdown, JSON-LD, Merkle tamper-evident seal).
- [ ] **Phase 11**: Multi-Investigator Collaboration & Differential Merging (Concurrent conflict resolution, peer sign-off locks).
Thankyou!!

---

## 📄 License

This project is licensed under the **Apache License 2.0**. See the [LICENSE](LICENSE) file for complete details.
