# ADMISSORIUM Guarded Projection Repair PR Writer Adapter

## Boundary

ADMISSORIUM does not decide truth. ADMISSORIUM enforces admissibility of materialized surfaces against the accepted VERIFRAX object graph.

## Scope

This adapter converts a deterministic projection repair PR plan into a GitHub pull request create request only after explicit write gates pass.

## Guards

A projection repair pull request write is skipped unless all of these are true:

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
branch creation
file mutation
contents write behavior
truth mutation
deletion
registry mutation
```

## Emergency stop

```text
ADMISSORIUM_WRITE_DISABLED=true
```

must prevent the GitHub pull request client from being called.
