# ADMISSORIUM Check-Run Plan Boundary

## Boundary

ADMISSORIUM does not decide truth. ADMISSORIUM enforces admissibility of materialized surfaces against the accepted VERIFRAX object graph.

## Scope

This layer builds a dry-run GitHub check-run plan from an admissibility report and merge verdict.

It does not call GitHub.

```text
dry_run = true
write_behavior = NONE
````

## Outputs

The plan contains:

```text id="sdg3yu"
check name
repository
head SHA
completed status
check conclusion
title
summary
body text
merge verdict
permission decision
optional details URL
```

## Non-goals

This layer does not add:

```text id="9wf6wx"
GitHub API client
check-run creation
status creation
installation token exchange
webhook route binding
branch creation
file mutation
pull request creation
issue creation
contents write behavior
truth mutation
```

## Why this exists before writing

The check-run plan creates a deterministic reviewable object before ADMISSORIUM receives the ability to write checks.

A future writer must consume this plan rather than inventing a separate conclusion mapping.
