# ADMISSORIUM Webhook Intake Boundary

## Boundary

ADMISSORIUM does not decide truth. ADMISSORIUM enforces admissibility of materialized surfaces against the accepted VERIFRAX object graph.

## Scope

This intake layer verifies GitHub webhook signatures and parses event envelopes.

It does not perform write behavior.

```text
writeBehavior = NONE
````

## Accepted intake requirements

A webhook envelope is accepted only when:

```text
x-hub-signature-256 is present
signature algorithm is sha256
signature digest is well-formed
signature matches the raw request body
x-github-event is present
x-github-delivery is present
event is in the allowed event list
body is valid JSON
```

## Rejection classes

```text
REJECTED_SIGNATURE
REJECTED_MISSING_EVENT
REJECTED_MISSING_DELIVERY
REJECTED_INVALID_JSON
REJECTED_UNSUPPORTED_EVENT
```

## Non-goals

This layer does not add:

```text
web server
webhook route binding
GitHub App installation token exchange
check-run writing
pull request writing
issue writing
branch creation
file mutation
contents write behavior
main-branch mutation
truth mutation
```

## Security rule

The HMAC must be computed against the exact raw body bytes received from GitHub.

Never verify against a reserialized JSON object.
