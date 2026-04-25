# ADMISSORIUM Guarded Check-Run Writer Adapter

## Boundary

ADMISSORIUM does not decide truth. ADMISSORIUM enforces admissibility of materialized surfaces against the accepted VERIFRAX object graph.

## Scope

This adapter converts a deterministic check-run plan into a GitHub check-run create request only after explicit write gates pass.

## Guards

A check-run write is skipped unless all of these are true:

```text
executeWrite == true
plan.dry_run == false
ADMISSORIUM_WRITE_DISABLED != true
permission_decision == ALLOW
````

## Non-goals

This layer does not add:

```text
GitHub App installation token exchange
webhook route binding
pull request writer behavior
issue writer behavior
branch creation
file mutation
contents write behavior
truth mutation
```

## Emergency stop

```text
ADMISSORIUM_WRITE_DISABLED=true
```

must prevent the GitHub client from being called.
