# Actuator Request Pipeline Plan

ADMISSORIUM does not decide truth.

This module composes the actuator request path into a single plan-only object:

```text id="69ik73"
webhook request handler
  -> route dispatcher
  -> installation token request plan
  -> dry-run actuator orchestration
````

It does not bind a server, mount a route, exchange a token, persist a token, construct a GitHub client, or write to any repository surface.

## Boundary

Every pipeline result has:

```text id="4wqteo"
write_behavior    NONE
server_binding    NONE
execution         PLAN_ONLY
token_exchange    NOT_PERFORMED
truth_mutation    false
registry_mutation false
```

## Denial behavior

If intake fails or route dispatch denies the event, the pipeline stops before token planning and before actuator orchestration.

## Non-goals

This module must not add server binding, route mounting, JWT signing, installation token exchange, token persistence, GitHub client construction, check-run writing, pull request writing, issue writing, repository content writing, governance registry mutation, or accepted truth mutation.
