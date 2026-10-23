# vigia-cases

**VIGÍA Forensic Intent Analysis — Public DFIR Benchmark Dataset**

Curated by **Anna Tchijova** | Verified by the VIGÍA Collective (Claude, Kimi, Gemini, DeepSeek, ChatGPT, Qwen)
Prepared for the **SANS FIND EVIL Hackathon 2026**


---

## What's in here

10 real forensic cases from verified public sources (NIST CFReDS, DFRWS, Digital Corpora, Ali Hadi, Volatility Foundation), converted to the canonical VIGÍA format for benchmarking forensic intent analysis agents.

Each case includes:

- `case.json` — incident descriptor + artifacts (agent input, **no ground truth exposed**)
- `ground_truth.json` — canonical verdict, MITRE TTPs, Peirce classification, IOCs
- `manifest.json` — per-file SHA-256 hashes

---

## Repository structure

```
vigia-cases/
├── LICENSE                    Apache 2.0
├── README.md                  This file (English)
├── SCORING_GUIDE.md           How to score agents against this dataset
├── index.json                 Global index of all cases + metadata
├── hashes.sha256              SHA-256 hashes of every file in the repo
└── cases/
    ├── VIGIA-REAL-001/        NIST Hacking Case (Greg Schardt / Mr. Evil)
    ├── VIGIA-REAL-002/        NIST Data Leakage (insider threat)
    ├── VIGIA-REAL-003/        Ali Hadi Web Server Compromise
    ├── VIGIA-REAL-004/        Ali Hadi SysInternals Malware
    ├── VIGIA-REAL-005/        Ali Hadi Encrypt Them All (SUSPICION, not MALICE)
    ├── VIGIA-REAL-006/        Digital Corpora M57-Jean Spear-Phishing
    ├── VIGIA-REAL-007/        Digital Corpora Nitroba Harassment
    ├── VIGIA-REAL-008/        Volatility Cridex Banking Trojan
    ├── VIGIA-REAL-009/        DFRWS 2008 Linux Exfiltration
    └── VIGIA-REAL-010/        DFRWS 2011 Android Espionage
```

---

## Usability classification

Classification applied by **Rob T. Lee** (SANS) in the hackathon context.

### ✅ Score against — reliable scoring

| Case | Source | Incident |
|------|--------|----------|
| VIGIA-REAL-007 | Digital Corpora — Nitroba | Network forensics, Gmail cookie attribution |
| VIGIA-REAL-002 | NIST CFReDS — Data Leakage | Insider exfil + anti-forensics |
| VIGIA-REAL-001 | NIST CFReDS — Hacking Case | War driving, credential theft |

Ground truth is verifiable against answer keys or confirmed canonical hashes.

### ⚠️ Build and test — score with care

| Case | Source | Incident | Note |
|------|--------|----------|------|
| VIGIA-REAL-005 | Ali Hadi #9 | Encryption concealment | **Intentional false-positive test: SUSPICION, not MALICE** |
| VIGIA-REAL-003 | Ali Hadi #1 | Web compromise → persistence | Disk + memory, instructor-gated answers |
| VIGIA-REAL-009 | DFRWS 2008 | Linux admin-share exfiltration | Ground truth built by Anna Tchijova |

Solutions exist in academic literature. Report whether the agent reasoned or recalled.

### 🔵 Practice only — no scoring

| Case | Source | Reason |
|------|--------|--------|
| VIGIA-REAL-006 | Digital Corpora M57-Jean | Solutions widely published |
| VIGIA-REAL-004 | Ali Hadi #7 SysInternals | Instructor-gated E01 |

### 🔴 Not ready — do not use

| Case | Reason |
|------|--------|
| VIGIA-REAL-010 | Evidence on personal Dropbox (volatile); README hashes labeled MD5 are actually SHA1 |
| VIGIA-REAL-008 | Canonical download dead; repo archived read-only May 2025 |

---

## Critical note: VIGIA-REAL-005

This case is the **false-positive gate**. The expected verdict is `SUSPICION`, not `MALICE`. An agent that fires `MALICE` here fails the specificity threshold. The use of multiple encryption layers is ambiguous — it can be legitimate personal security practice.

---

## How to use this dataset with VIGÍA

```bash
# Clone the main VIGÍA repo
git clone git@github.com:annatchijova/vigia-intent-analysis.git
cd vigia-intent-analysis

# Run a case through the engine
python3 run_case.py cases/VIGIA-REAL-007/case.json

# Compare against ground truth
python3 run_case.py cases/VIGIA-REAL-007/case.json \
    --ground-truth cases/VIGIA-REAL-007/ground_truth.json
```

---

## Note on evidence

This repository distributes structured forensic abstractions (JSON case descriptors) derived from public datasets. Raw evidence files (disk images, memory dumps, pcap files) are referenced via URL but not redistributed. Users must download raw evidence directly from the canonical sources listed in each case.

---

## Integrity verification

```bash
sha256sum --check hashes.sha256
```

---

## Scoring

See `SCORING_GUIDE.md` for full metrics, thresholds, and reporting protocol.

Primary metrics:

- **Verdict Accuracy** — % correct verdicts over `score_against` tier cases
- **FPR** — false positive rate (VIGIA-REAL-005 is the dedicated specificity test)
- **FNR-MAL** — malicious cases classified as BENIGN/NOISE
- **TTP Coverage** — % MITRE TTPs correctly identified

---

## License

Apache License 2.0 — see `LICENSE`.

Source datasets are from verified public sources with their own licenses:
- NIST CFReDS: public domain
- Digital Corpora: CC BY
- DFRWS Challenges: open access
- Ali Hadi Challenges: educational use

---

## Credits

Cases curated and human-verified by **Anna Tchijova**.
Ground truth verified through multi-model cross-audit (Claude, Kimi, Gemini, DeepSeek, ChatGPT, Qwen) with human oversight.
Hash verification confirmed against canonical sources.

Main project: [github.com/annatchijova/vigia-intent-analysis](https://github.com/annatchijova/vigia-intent-analysis)

---

## Contributors

| Contributor | Contribution |
|-------------|-------------|
| [@rjonhaas](https://github.com/rjonhaas) | PCAP verification of VIGIA-REAL-007 against Digital Corpora source; primary-source audit of VIGIA-REAL-001 against NIST CFReDS. Corrected 6 IOCs, 2 MITRE TTPs, and 1 scoring note across both cases. |

Corrections verified against canonical sources and integrated with updated SHA-256 hashes.
If you find a discrepancy, open an issue — every fix makes the benchmark more solid.
