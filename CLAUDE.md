@AGENTS.md

## Fork policy

This repo is a fork of https://github.com/diwenne/openreply. Prioritise alignment
with upstream:

- Sync by merging `upstream/main` (`git remote add upstream https://github.com/diwenne/openreply`).
- Before building something, check whether upstream already has it; prefer upstream's
  version and fit fork changes into upstream's structure rather than parallel code.
- When an upstream change makes fork code redundant, delete the fork code. Keep the
  diff against `upstream/main` as small as possible (`git diff --stat upstream/main`).
- Every fork-only change is listed in `docs/fork-patches.md`, with the upstream change
  that would replace it. Add an entry when you add fork code. When upstream covers an
  entry, delete the fork code and the entry in the same change.
