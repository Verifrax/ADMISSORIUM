# ADMISSORIUM Projection Repair PR Plan Boundary

## Boundary

ADMISSORIUM does not decide truth. ADMISSORIUM enforces admissibility of materialized surfaces against the accepted VERIFRAX object graph.

## Scope

This layer builds a deterministic dry-run pull request plan for projection repair.

It does not call GitHub.

```text
dry_run = true
write_behavior = NONE
````

## Repair eligibility

A finding is eligible only when:

```text
severity == YELLOW
autofix_allowed == true
surface is not protected truth/current state
```

## Protected surfaces

Projection repair planning must not propose automatic writes to:

```text
law/
freeze/
epochs/current/
current/
authorities/current/
receipts/current/
verification/results/current/
recognitions/current/
claims/current/
continuity/current/
transfer/current/
```

## Non-goals

This layer does not add:

```text
GitHub pull request creation
GitHub branch creation
GitHub API client
installation token exchange
webhook route binding
file mutation
contents write behavior
truth mutation
deletion
```

