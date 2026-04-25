# ADMISSORIUM Actuator Dry-Run Orchestration

## Boundary

ADMISSORIUM does not decide truth. ADMISSORIUM enforces admissibility of materialized surfaces against the accepted VERIFRAX object graph.

## Scope

This layer composes existing dry-run actuator plans:

```text
check-run plan
projection repair pull request plan
quarantine issue plan
````

It does not execute those plans.

## Write behavior

```text
dry_run = true
write_behavior = NONE
```

## Non-goals

This layer does not add:

```text id="7h3fm2"
GitHub App installation token exchange
GitHub API client creation
webhook route binding
check-run writing
pull request creation
issue creation
branch creation
file mutation
contents write behavior
truth mutation
registry mutation
deletion
```

## Emergency stop

`ADMISSORIUM_WRITE_DISABLED=true` is recorded in the orchestration summary and must remain available to downstream guarded writer adapters.
