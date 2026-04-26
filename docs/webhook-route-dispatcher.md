# Webhook Route Dispatcher

ADMISSORIUM does not decide truth.

This dispatcher maps already-verified webhook envelopes into execution plans. It does not bind an HTTP server, does not listen on a port, does not exchange installation tokens, and does not write to GitHub.

## Supported route plans

```text
pull_request -> admissibility execution plan
push         -> admissibility execution plan
ping         -> acknowledge only
````

Unsupported events are denied without side effects.

## Boundary

Every result has:

```text
write_behavior    NONE
server_binding    NONE
execution         PLAN_ONLY
token_exchange    NOT_PERFORMED
truth_mutation    false
registry_mutation false
```

## Emergency stop

Route dispatch is denied when either is active:

```text
ADMISSORIUM_WEBHOOK_DISPATCH_DISABLED=true
ADMISSORIUM_WRITE_DISABLED=true
```

## Non-goals

This module must not add server binding, route mounting, JWT signing, installation token exchange, GitHub client construction, check-run writing, pull request writing, issue writing, repository content writing, governance registry mutation, or accepted truth mutation.
