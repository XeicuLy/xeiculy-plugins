---
description: Create a git commit following Conventional Commits conventions.
argument-hint: ''
allowed-tools: Bash(git status *) Bash(git diff *) Bash(git add *) Bash(git commit *)
disable-model-invocation: true
---

# Commit

Read `../references/commit-flow.md` before generating any commit message, and follow its step-by-step flow using the context below.

## Context

- Working tree: !`git status --short`
- Staged diff: !`git diff --staged`
- Branch: !`git branch --show-current`
