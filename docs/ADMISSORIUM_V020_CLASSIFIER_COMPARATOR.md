# ADMISSORIUM v0.2.0 Classifier + Comparator Spine

This layer adds the report-only classifier and comparator spine:

1. surface classifier
2. mutation classifier
3. truth-risk classifier
4. accepted-vs-candidate comparator
5. report output
6. history snapshot binding

It intentionally adds no webhook, writer, PR creation, issue creation, check-run writer, contents write, package publish, main write, secret handling, or truth mutation path.

Boundary:

```text
The classifier may name risk.
The comparator may mark admissible/inadmissible against fixture graph.
It does not decide truth.
It does not accept state.
It does not issue authority.
It does not execute.
It does not verify as final source.
It does not recognize terminal truth.
It does not assign recourse.
````

