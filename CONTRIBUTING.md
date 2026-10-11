# Contributing to FORENSIC-X

Thank you for your interest in contributing to **FORENSIC-X**! We welcome contributions from digital forensic practitioners, reverse engineers, security researchers, and software engineers.

---

## 🏛 Core Architectural Rules

Before submitting code, ensure you understand our architectural principles:

1. **Evidence Immutability**: Code in the evidence ingestion path must NEVER modify original evidence files. Files are placed into `data/evidence_store/` and marked read-only.
2. **Cryptographic Provenance**: Every state alteration involving an evidence artifact must append a record into `chain_of_custody_records` linking to the prior record's SHA-256 hash.
3. **Epistemic Truth Separation**: Keep raw physical facts separate from analytical inferences and speculative hypotheses.
4. **Time Normalization**: All timestamps stored in the database must be normalized to UTC in ISO 8601 format while preserving the raw source timestamp string.

---

## 🛠 Development Workflow

### 1. Fork and Clone
```bash
git clone https://github.com/Mayank32935M/FORENSIC-X.git
cd FORENSIC-X
```

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -e .
python -m app.scripts.load_scenario
pytest
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Testing Guidelines

- All backend changes must include corresponding tests under `backend/tests/unit/` or `backend/tests/integration/`.
- Ensure `pytest` passes with 100% success before submitting a pull request.
- Ensure `npm run build` in `frontend/` succeeds without TypeScript or Vite compilation errors.

---

## 📝 Commit Conventions

We follow Conventional Commits:
- `feat:` New feature (e.g. `feat: add EVTX parser support`)
- `fix:` Bug fix (e.g. `fix: handle timezone offsets in syslog parser`)
- `docs:` Documentation updates
- `test:` Adding or updating tests
- `refactor:` Code reorganization without behavioral change

---

## ⚖️ License

By contributing to FORENSIC-X, you agree that your contributions will be licensed under the **Apache License 2.0**.
