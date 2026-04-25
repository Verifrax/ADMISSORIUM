# ADMISSORIUM Quarantine Issue Plan Boundary

## Boundary

ADMISSORIUM does not decide truth. ADMISSORIUM enforces admissibility of materialized surfaces against the accepted VERIFRAX object graph.

## Scope

This layer builds a deterministic dry-run GitHub issue plan for quarantine review.

It does not call GitHub.

```text
dry_run = true
write_behavior = NONE
````

## Non-goals

This layer does not add:

```text
GitHub issue creation
GitHub API client
installation token exchange
webhook route binding
branch creation
file mutation
contents write behavior
truth mutation
deletion
```

## Rule

Quarantine issue planning is evidence routing only.

It may describe why a human/governance review is required.

It must not mutate the accepted graph, current truth, receipts, verification results, recognitions, authorities, or public perimeter.
