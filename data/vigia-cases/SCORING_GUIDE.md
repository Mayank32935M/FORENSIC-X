# VIGÍA Cases — Scoring Guide

## Evaluation protocol

1. Load `case.json` as agent input. **Do not expose `ground_truth.json`** to the agent during inference.
2. Record the emitted verdict, confidence value, and detected MITRE TTPs.
3. Compare against `ground_truth.json`.

---

## Metrics

### Primary

| Metric | Definition | Minimum threshold |
|--------|-----------|-------------------|
| Verdict Accuracy | % correct verdicts over `score_against` tier cases | ≥ 80% |
| FPR (False Positive Rate) | SUSPICION/MALICE over BENIGN or SUSPICION-only cases | ≤ 20% |
| FNR-MAL | MALICE classified as BENIGN/NOISE | ≤ 10% |
| TTP Coverage | % MITRE TTPs correctly identified | ≥ 60% |

### Secondary

| Metric | Definition |
|--------|-----------|
| Peirce Alignment | % correct Firstness/Secondness/Thirdness classifications |
| IOC Recall | % canonical IOCs recovered by the agent |
| Abstention Rate | % cases where the agent abstains correctly |

---

## Tier warnings

- **score_against**: the only valid tier for accuracy claims in reports.
- **build_and_test**: report in a separate section. Indicate whether the model has these cases in its training data.
- **practice_only**: do not report as accuracy metrics.
- **not_ready**: do not use until hash resolution is confirmed.

---

## Special case: VIGIA-REAL-005

This case is the **false-positive gate**. The agent PASSES if it emits `SUSPICION`.
The agent FAILS if it emits `MALICE`. No partial credit.

---

## Report format

```json
{
  "agent_id": "agent-name",
  "evaluation_date": "2026-06-XX",
  "cases_evaluated": 3,
  "tier": "score_against",
  "results": [
    {
      "case_id": "VIGIA-REAL-007",
      "agent_verdict": "MALICE",
      "expected_verdict": "MALICE",
      "agent_confidence": 0.91,
      "correct": true,
      "mitre_ttps_detected": ["T1566.001", "T1585.001"],
      "mitre_ttps_expected": ["T1566.001", "T1585.001", "T1071.001"]
    }
  ],
  "summary": {
    "verdict_accuracy": 1.0,
    "fpr": 0.0,
    "fnr_mal": 0.0,
    "ttp_coverage": 0.67
  }
}
```

---

## Citation

```
Tchijova, A. (2026). vigia-cases: DFIR Benchmark Dataset for Forensic Intent Analysis.
SANS FIND EVIL Hackathon 2026. https://github.com/annatchijova/vigia-cases
```
