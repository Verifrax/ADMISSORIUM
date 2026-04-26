# Webhook Request Handler

ADMISSORIUM does not decide truth.

This handler composes existing read-only webhook intake with route dispatch:

```text
headers + body + secret
  -> signature verification
  -> envelope parsing
  -> route plan
````

It does not bind an HTTP server, does not mount a route, does not exchange installation tokens, and does not write to GitHub.

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

## Status mapping

```text
202 routed plan or acknowledge-only plan
400 malformed intake
401 failed signature verification
403 emergency-stop route denial
422 unsupported or incomplete route payload
```

## Non-goals

This module must not add server binding, route mounting, JWT signing, installation token exchange, GitHub client construction, check-run writing, pull request writing, issue writing, repository content writing, governance registry mutation, or accepted truth mutation.
