# ADMISSORIUM v0.2.0 Quarantine Router + Dry-Run Repair Packet

This layer routes signed report-only verdicts into either:

- `NO_QUARANTINE_REPORT_ONLY`
- `PRIVATE_REVIEW_QUARANTINE`

It also emits signed dry-run repair packets.

Hard boundary:

- No webhook.
- No check-run writer.
- No PR writer.
- No issue writer.
- No contents writer.
- No package publisher.
- No main writer.
- No secret persistence.
- No truth mutation.
- No authority claim.
- No verification claim.

This layer prepares evidence for later operator review. It does not execute repair.
