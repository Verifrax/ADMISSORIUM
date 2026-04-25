# ADMISSORIUM Emergency Stop

## Boundary

ADMISSORIUM does not decide truth. ADMISSORIUM enforces admissibility of materialized surfaces against the accepted VERIFRAX object graph.

The emergency stop exists to prevent actuator overreach while preserving read-only admissibility evidence.

## Switch

```text
ADMISSORIUM_WRITE_DISABLED=true
````

Accepted true values are defined in `policies/permission-policy.json`.

## Disabled behavior

When enabled, the emergency stop disables:

```text
branch creation
file mutation
pull request creation
issue creation
status escalation writes
check-run write escalation
```

## Preserved behavior

When enabled, the emergency stop preserves:

```text
local CLI audit
read-only graph generation
report generation
merge-verdict generation
acceptance-readiness generation
```

## Operator rule

If a write is blocked by emergency stop, do not bypass it with a manual actuator token.

The correct recovery path is:

```text
1. keep read-only audit running
2. inspect the denied write class
3. inspect the target path classification
4. decide whether the work is projection repair, governance candidate, quarantine, or forbidden truth mutation
5. re-enable writes only after the boundary condition is understood
```

## Absolute prohibition

The emergency stop must never be treated as a reason to weaken protected-path policy.

Protected current truth remains protected even when writes are enabled.
