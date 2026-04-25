# Guarded Installation Token Exchange Adapter

ADMISSORIUM does not decide truth.

This adapter is the first runtime-adjacent token exchange boundary. It still does not construct a GitHub client, does not sign JWTs, does not persist tokens, and does not return token material.

## Required gates

The adapter calls the supplied exchange client only when:

- the plan is not dry-run
- `executeExchange` is explicitly true
- emergency stop is not active
- token exchange stop is not active
- the plan decision is `READY_FOR_GUARDED_EXCHANGE`
- the plan contains app id, installation id, and private key references
- the client returns a non-secret token reference, not raw token material

## Forbidden behavior

The adapter must not:

- write repository contents
- create branches
- create pull requests
- create issues
- create check runs
- persist installation tokens
- return raw installation tokens
- accept raw private key material
- mutate accepted truth
- mutate governance registries

## Output boundary

A successful exchange returns only:

```text
decision: EXCHANGED_TOKEN_REFERENCE
token_ref: runtime-owned non-secret reference
token_persisted: false
token_material_returned: false
write_behavior: NONE
````

The actual secret-bearing runtime remains outside this module.
