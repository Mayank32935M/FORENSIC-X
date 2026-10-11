# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x (Prototype)   | :white_check_mark: |

---

## 🔒 Forensic Evidence Integrity

FORENSIC-X is a forensic investigation system designed to handle sensitive digital evidence. We treat the following conditions with the highest severity:
- Any vulnerability that allows silent modification of files in the evidence store.
- Any flaw in the chain-of-custody cryptographic algorithm that allows hash collisions or ledger falsification without triggering verification warnings.
- Any arbitrary code execution or path traversal in log and artifact parsers.

---

## 🛡 Reporting a Vulnerability

If you discover a security vulnerability in FORENSIC-X:

1. **Do not disclose it publicly** via GitHub Issues or Discussions.
2. Please open a Private Security Advisory via GitHub's Security Advisories tab or contact the maintainers directly.
3. Include detailed reproduction steps, the affected component, and potential impact.

Maintainers will acknowledge receipt within 48 hours and work with you to test and deploy a fix.
