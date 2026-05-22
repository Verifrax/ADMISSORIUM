# ADMISSORIUM v0.2.0 Webhook Signature Verification

This layer verifies GitHub-style webhook HMAC signatures without opening a network listener, persisting a token, receiving a real webhook, or enabling any writer.

## Boundary

ADMISSORIUM verifies admissibility of an event envelope. It does not decide truth.

This layer may:

- verify `x-hub-signature-256`
- require `x-github-event`
- require `x-github-delivery`
- emit deterministic reports
- reject malformed, missing, or mismatched signatures

This layer may not:

- persist webhook secrets
- require installation tokens
- open a webhook receiver
- write check runs
- write pull requests
- write issues
- write contents
- mutate truth

## Required state

```text
ADMISSORIUM_V020_WEBHOOK_SIGNATURE_VERIFICATION_PASS
````

## Sequence

This comes after test-mode writer simulation and before hostile fixtures. It proves that event authentication exists before any real webhook receiver or writer is authorized.
