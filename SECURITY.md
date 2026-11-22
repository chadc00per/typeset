# Security policy

## Supported versions

Security fixes go into the latest release of `@chadc00per/typeset` (npm) and `chadc00per-typeset` (PyPI).
Both packages are released together, with the same version number.

## Reporting a vulnerability

Please report vulnerabilities privately, not in a public issue: use
[GitHub's private vulnerability reporting](https://github.com/chadc00per/typeset/security/advisories/new).
Include the version, a minimal reproduction and the impact you see.

You'll get an acknowledgement within a few days. Once a fix is ready it's released to both
registries and the advisory is published, crediting you unless you'd rather not be named.

## Scope

In scope: anything in this repository's code or shipped data that lets untrusted input cause
something other than a clean, documented refusal, such as a crash, excessive CPU or memory use,
an accepted value that should have been refused, or an error message that leaks or forges
content. The README's security notes describe what the packages promise and what stays the
application's job.
