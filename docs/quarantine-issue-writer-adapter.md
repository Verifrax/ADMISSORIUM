# ADMISSORIUM Guarded Quarantine Issue Writer Adapter

## Boundary

ADMISSORIUM does not decide truth. ADMISSORIUM enforces admissibility of materialized surfaces against the accepted VERIFRAX object graph.

## Scope

This adapter converts a deterministic quarantine issue plan into a GitHub issue create request only after explicit write gates pass.

## Guards

A quarantine issue write is skipped unless all of these are true:

```text
executeWrite == true
plan.dry_run == false
ADMISSORIUM_WRITE_DISABLED != true
plan.required == true
````

## Non-goals

This layer does not add:

```text
GitHub App installation token exchange
webhook route binding
pull request writer behavior
branch creation
file mutation
contents write behavior
truth mutation
deletion
```

## Emergency stop

```text
ADMISSORIUM_WRITE_DISABLED=true
```

must prevent the GitHub issue client from being called.
