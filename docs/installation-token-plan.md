# Installation Token Request Boundary

ADMISSORIUM does not decide truth.

This surface defines the request boundary for a future GitHub App installation token exchange. It does not sign a JWT, does not call GitHub, does not construct a GitHub client, does not persist a token, and does not write to any repository surface.

## Operating rule

A token exchange is not admissible merely because request data exists.

The planner may only report that a future guarded exchange is ready when all of these are true:

- emergency stop is not active
- mode is `guarded-exchange`
- GitHub App id is supplied by reference
- installation id is supplied by reference
- private key is supplied by reference
- raw private key material is not present
- the caller will provide any real GitHub client outside this planner

## Forbidden materialization

The planner must not materialize:

- private key bytes
- JWT signing
- installation token exchange
- installation token persistence
- GitHub API client construction
- repository contents mutation
- branch creation
- pull request creation
- issue creation
- check-run creation

## Boundary

The only successful non-denial decision is `READY_FOR_GUARDED_EXCHANGE`.

That decision still has:

```text
dry_run        true
write_behavior NONE
token_exchange NOT_PERFORMED
````

A future runtime adapter may consume this plan, but only behind emergency stop, explicit execution flags, permission policy, protected-path policy, and a non-repository secret boundary.
