# ADR 006: Epistemic Tiers for Findings

## Status
Accepted

## Context
In an AI-assisted forensic platform, it is dangerous to present AI-generated hypotheses alongside hard cryptographic facts without distinction. A jury or investigator must know *how* a fact was established.

## Decision
All observations, findings, and interpretations will be tagged with an explicit `EpistemicTier`:
- **VERIFIED_OBSERVATION:** A direct, immutable fact from the evidence (e.g., "File X has hash Y", "Timestamp T exists in Log Z").
- **INFERENCE:** A conclusion drawn by a human or deterministic heuristic, backed by specific verified observations (e.g., "User A accessed File X because Event 1 and Event 2 occurred").
- **HYPOTHESIS:** A probabilistic or AI-generated suggestion that requires further verification (e.g., "This anomalous access pattern suggests a potential insider threat").

## Consequences
- **Positive:** Clear provenance for all claims; mitigates AI hallucination risks.
- **Negative:** Adds complexity to the data model and UI (findings must visibly cite their sources and display their tier).
