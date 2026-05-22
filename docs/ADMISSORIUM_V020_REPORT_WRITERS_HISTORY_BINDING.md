# ADMISSORIUM v0.2.0 report writers and history binding

This layer adds local JSON report writing for the v0.2.0 admissibility chain.

It is report-only.

It does not create webhook listeners, GitHub clients, check runs, pull requests, issues, content writes, package publishes, network calls, token exchanges, or truth mutation paths.

## Emits

- `reports/current/admissorium-v020-report-bundle.json`
- `reports/history/admissorium-v020-report-bundle-<run-id>/admissorium-v020-report-bundle.json`
- `reports/history/admissorium-v020-report-bundle-<run-id>/manifest.json`

## Binding rule

The current report and history snapshot carry SHA-256 binding.

History paths are evidence snapshots. They are not accepted state, not law, not proof finality, and not authority.

## Boundary

ADMISSORIUM may emit reports.

ADMISSORIUM does not decide truth.
