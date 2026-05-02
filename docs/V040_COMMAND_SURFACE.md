# ADMISSORIUM v0.4.0 Command Surface

ADMISSORIUM v0.4.0 preserves `check:v020` as a compatibility alias because the protected-path boundary contract remains `0.2.0-boundary`.

The canonical v0.4.0 readiness command is:

```bash
npm run check:v040
````

Compatibility command:

```bash
npm run check:v020
```

Control-plane semantic alias:

```bash
npm run check:control-plane
```

These commands execute the same readiness gate and must produce `ready=true` and `failed_count=0`.
