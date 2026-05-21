# ADMISSORIUM v0.2.0 Actuator Verdict + Admission Receipt Layer

This layer compiles classifier/comparator output into signed local actuator verdicts and admission receipts.

Boundary:

- ADMISSORIUM does not decide truth.
- This layer is report-only.
- It emits no webhook side effect.
- It emits no check-run write.
- It emits no PR, issue, branch, package, or contents write.
- It uses deterministic local signing only for repeatable test evidence.
- The local signing harness is not a production secret system.

A clean candidate may receive `ADMISSIBLE_REPORT_ONLY`.

Unsafe candidates receive `INADMISSIBLE_OR_QUARANTINE`.

No verdict or receipt authorizes mutation of law, accepted state, current truth, authority objects, execution receipts, verification results, recognition objects, recourse objects, package publication state, or branch protection policy.
