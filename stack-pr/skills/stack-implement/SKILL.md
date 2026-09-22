---
name: stack-implement
description: >
  Use when implementing a chain of dependent GitHub Issues under a parent Issue as stacked PRs
  (依存Issue群をスタックで実装, スタックPRで実装して, gh-stackで積む, stack-implement,
  子Issue群をまとめて実装). Resolves the sub-issue dependency graph into a single implementation
  order, gates on user approval, then loops dev-workflow:implement-issue → /create-commit:commit
  → the official gh-stack skill per Issue. Not for a single standalone Issue with no dependents
  (use dev-workflow:implement-issue directly), and not for resolving PR review comments.
allowed-tools: Bash(gh repo view *) Bash(gh issue view *) Bash(git branch --list *) Bash(git branch -D issue-*) AskUserQuestion Skill(dev-workflow:implement-issue *) SlashCommand(/create-commit:commit) Skill(gh-stack:gh-stack *)
---

# Stack Implement Skill

## Pre-Phase: Resolve Dependency Graph and Detect Resume State

**Input**: parent Issue number (required, from the user or caller).

1. Detect the current repository:
   ```bash
   REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
   ```
2. Follow `references/dependency-graph.md` Steps 1–6 in full to fetch the parent's sub-issues,
   their `blockedBy` edges, build the graph, and topologically sort it into a single stack
   implementation order. Halt exactly as that spec directs on any of its error conditions
   (no sub-issues, truncated node/edge lists, an external open dependency, a nested sub-issue
   tree, or a cycle) — do not proceed past those halts.
3. **Resume detection.** First, for every Issue in the order from Step 2, compute its branch name
   using the Branch Naming Rule in `references/stack-workflow.md` (`issue-<Issue番号>-<slug>`) —
   these names are needed below regardless of which exit code the next call returns. Then delegate
   `Skill(skill="gh-stack:gh-stack")` → `gh stack view --json` to list the branches already present
   in the local stack. This call resolves against the **currently checked-out branch**, not a
   specific stack by number, so handle its non-zero exit codes explicitly instead of assuming valid
   JSON:
   - **Exit code 2** (current branch is not in any stack) — this only means the _current_ branch
     has no stack; it says nothing about whether this chain's own branches exist elsewhere locally
     (e.g. the caller is on `main` while a prior run's branches still exist unpushed on another
     line of history). Before treating this as an empty stack, run
     `Bash(command="git branch --list issue-<Issue番号>-<slug>")` for each branch name computed
     above (or a single `git branch --list 'issue-*'` and match the exact names against it).
     - If **none** of the computed branch names exist locally: treat this identically to an empty
       stack — no Issue from Step 2 is already stacked. Continue to the matching logic below (every
       Issue ends up **to implement**).
     - If **any** computed branch name already exists locally: halt before producing the Output
       Format below, exactly as for exit code 6. Report which branch(es) were found and that they
       are not reachable from the current branch's stack, and ask the user to `gh stack checkout`
       onto one of them (or the chain's own top branch) before re-invoking this skill. Do not guess
       which stack is intended, and do not perform any write operation.
   - **Exit code 6** (current branch belongs to multiple stacks — most commonly the repository's
     trunk, which is the base of every stack) — halt before producing the Output Format below.
     Report that resume detection could not disambiguate which stack to inspect, and ask the user
     to `git checkout`/`gh stack checkout` onto a branch that belongs to this chain (e.g., one of
     its own Issue branches from a prior run, if any) before re-invoking this skill. Do not guess
     which stack is intended, and do not perform any write operation.
   - **Any other non-zero exit code** (e.g. GitHub API failure, invalid arguments, a rebase
     conflict, or the stack being locked by another process) — halt immediately, before the
     approval gate and before any `gh stack init`/`add`. Report the exit code and the command's own
     error output; do not guess a fallback interpretation, and do not perform any write operation.
     Resolving the underlying problem and re-invoking this skill re-runs this same check.

   On success (valid JSON, exit code 0), for each Issue in the order from Step 2, check whether a
   branch with its computed name exists in the stack **and** has at least one commit beyond its
   parent branch in the stack (an empty branch — created by `gh stack init`/`add` but abandoned
   before any commit — does not count as done).
   - Every Issue that matches is **already stacked**: its implementation and commit are done, so
     exclude it from the Per-Issue Loop below (do not re-invoke `dev-workflow:implement-issue` or
     `/create-commit:commit` for it) — but keep it visible in the report (see Output Format below)
     for context. Since a local commit existing on the branch does not guarantee it was actually
     pushed (step 5 of a prior run may have failed after step 4 succeeded), the Push Safety Net
     (below the HARD-GATE) re-pushes the whole stack once, covering every already-stacked Issue —
     but only after the user approves the stack order. Resume detection's only `gh-stack` delegation is the read-only
     `gh stack view --json` call above — permitted before approval as the HARD-GATE below states
     explicitly — so nothing changes remotely before approval.
   - Every Issue that does not match (no branch yet, or a branch with no commit beyond its parent)
     is still **to implement** via the full Per-Issue Loop, in the same relative order Step 2
     produced.
   - This is the only resume mechanism this skill uses — there is no separate progress file. A
     fresh invocation with the same parent Issue number always re-derives what remains directly
     from live GitHub state (Step 2) and live stack state (this step), so it naturally continues a
     chain interrupted by a prior failure (see Failure Handling below) without any extra input
     from the caller.

### Output Format

```
📊 依存グラフ解決結果（親Issue #<番号>）

✅ 解決済み（実装スキップ）:
- #<番号> <タイトル> (CLOSED)

📦 既にスタック済み（実装スキップ）:
- #<番号> <タイトル>（ブランチ: issue-<番号>-<slug>）

🧱 スタック実装順序（今回の実行対象）:
1. #<番号> <タイトル>（依存: <依存Issue番号 or なし>）
2. #<番号> <タイトル>（依存: <依存Issue番号>）
```

Omit the "解決済み" and "既にスタック済み" sections when empty (e.g. a first-ever run against a
fully open chain has neither).

---

## HARD-GATE: Approve Stack Order

<HARD-GATE>
Do not invoke Skill(dev-workflow:implement-issue), SlashCommand(/create-commit:commit), or any
write-facing `Skill(gh-stack:gh-stack)` delegation (`gh stack init`, `add`, `push`, `submit`, or any
other operation that changes local or remote state) for any Issue until the user has approved the
"スタック実装順序（今回の実行対象）" list via AskUserQuestion. This applies on every invocation without
exception — a fresh chain, a single remaining Issue after a resume, and a full re-run all gate the
same way, since the order is re-derived from live state each time and could differ from what was
approved previously (e.g. a dependency was added or removed on GitHub since the last run).

The sole exceptions are Pre-Phase Step 3's resume detection: `Skill(skill="gh-stack:gh-stack")` →
`gh stack view --json`, and the local branch existence check that follows its exit code 2 case
(`Bash(command="git branch --list ...")`). Both are read-only and are permitted before approval,
since without them the Output Format above cannot distinguish 既にスタック済み from 今回の実行対象. No
other `gh-stack` operation, and no `git branch -D`, is permitted before approval.
</HARD-GATE>

```text
AskUserQuestion(
  questions=[{
    "question": "以下のスタック実装順序で進めてよいですか?\n\n<Pre-Phase Output Formatの内容>",
    "header": "スタック順承認",
    "options": [
      { "label": "はい、この順序で実装してください", "description": "上記の順序でループを開始する" },
      { "label": "順序の調整が必要です", "description": "GitHub上の依存関係（sub-issue / blocked-by）を修正してから再実行する" }
    ],
    "multiSelect": false
  }]
)
```

The order itself is derived mechanically from GitHub's live sub-issue / `blockedBy` relationships
(`references/dependency-graph.md`), not chosen freely by this skill — so "順序の調整が必要です" does
not mean re-ordering the list in place. Tell the user which relationship to edit on GitHub
(`gh issue edit --add-blocked-by` / `--remove-blocked-by`, or restructuring sub-issues), then ask
them to re-invoke this skill so Pre-Phase re-resolves the graph from the corrected state.

### Resume to Stack Top

Immediately after the user selects "はい、この順序で実装してください" above — and before the Push Safety Net
below — delegate `Skill(skill="gh-stack:gh-stack")` → `gh stack top` exactly once, regardless of
which branch the current invocation started on. Exit code 6 resume guidance (Pre-Phase Step 3) only
tells the user to check out _some_ branch belonging to this chain, which may be a mid-chain Issue's
branch rather than the top — and `gh stack add` in the Per-Issue Loop below requires being on the
stack's topmost branch to attach a new branch correctly. `gh stack top` is idempotent (a no-op when
already at the top), so running it unconditionally here is safe on a fresh chain, a resumed chain,
and a re-run alike, and does not itself require a `gh stack init`/`add` to already exist.

`gh stack top` follows the same official exit code mapping cited in Pre-Phase Step 3: exit code 2
means the current branch is not in any stack. Only when it returns **exit code 2** — a genuinely
fresh chain with no already-stacked Issues, nothing yet to jump to — is this expected: continue to
the Push Safety Net below rather than halting; the first Issue's `gh stack init` in the Per-Issue
Loop creates the stack in that case. Any other non-zero exit code (e.g. a GitHub API failure, the
stack being locked, a rebase conflict, or invalid arguments) is not expected here and must not be
treated as a fresh chain: halt immediately, report the exit code and the command's own error output,
and do not proceed to the Push Safety Net, Per-Issue Loop, or Post-Phase. Resolving the underlying
problem and re-invoking this skill with the same parent Issue number re-runs this same check.

### Push Safety Net for Already-Stacked Issues

Immediately after the "Resume to Stack Top" step above — and before Step 1 of the
Per-Issue Loop below — if Pre-Phase Step 3 classified one or more Issues as **already stacked**,
delegate `Skill(skill="gh-stack:gh-stack")` → `gh stack push` exactly **once**, covering the whole
stack. `gh stack push` takes no branch argument: it always pushes every active branch in the
current local stack non-atomically, so it cannot be scoped to a single Issue's branch, and a single
delegation already re-pushes every already-stacked Issue's branch — do not repeat the call per
Issue. `gh stack push` is also idempotent, so this one call is safe whether or not any of those
branches were already pushed in a prior run. Skip this delegation entirely when there were no
already-stacked Issues.

**On failure**: because this single `gh stack push` call updates every branch in the stack
non-atomically, a reported error does not identify which specific Issue's branch succeeded or
failed — some already-stacked branches may be pushed and others not. Halt immediately — do not
proceed to the Per-Issue Loop or Post-Phase. Report the error and that the already-stacked Issues'
branches may be in a partially-pushed state, following the same halt / no-rollback / report rules
as Failure Handling below. Resolving the underlying problem and re-invoking this skill with the
same parent Issue number resumes correctly: every Issue that was already stacked before still
classifies as already-stacked (their commits are unaffected by a push failure), so the Push Safety
Net retries the same full-stack push on the next run.

If the approved "スタック実装順序（今回の実行対象）" list is empty (every Issue in the chain was already
stacked), skip the Per-Issue Loop entirely and proceed straight to Post-Phase once this push
completes.

---

## Per-Issue Loop

For each Issue in the approved "スタック実装順序（今回の実行対象）" list, in order:

1. Compute the branch name via the Branch Naming Rule (`references/stack-workflow.md`):
   `issue-<Issue番号>-<slug>`.
2. **Delegate the stacking operation before implementation begins** (`references/stack-workflow.md`
   Operation Mapping):
   - If this is the first Issue in the approved list **and** Pre-Phase's resume detection found no
     already-stacked branches at all (a genuinely fresh chain): `Skill(skill="gh-stack:gh-stack")`
     → `gh stack init issue-<Issue番号>-<slug>`.
   - Otherwise (a later Issue in a fresh chain, or the first remaining Issue of a resumed run that
     is continuing on top of an existing stack): `Skill(skill="gh-stack:gh-stack")` →
     `gh stack add issue-<Issue番号>-<slug>`.
3. **Implement**: `Skill(skill="dev-workflow:implement-issue")`, passing this Issue's number. This
   runs that skill's own Pre-Phase (Issue fetch, parent resolution) and the full `feature-dev`
   7-Phase workflow with TDD enforcement, through to its own Post-Phase completion check.
4. **Commit**: `SlashCommand(command="/create-commit:commit")`. This command has
   `disable-model-invocation: true`; if Claude Code blocks the call, ask the user to run
   `/create-commit:commit` themselves and wait for their confirmation that a commit was created
   before continuing.
5. **Push**, every Issue: `Skill(skill="gh-stack:gh-stack")` → `gh stack push`
   (`references/stack-workflow.md`'s "push every Issue, submit once" rule — this keeps the branch
   backed up remotely without creating or updating any PR yet).
6. Report this Issue's completion (implemented, committed, pushed) and continue to the next Issue
   in the list. If this was the last Issue in the list, proceed to Post-Phase.

### Failure Handling (Interrupt / Resume)

If any of steps 2–5 fails for an Issue — `dev-workflow:implement-issue` cannot reach all acceptance
criteria GREEN, `/create-commit:commit` produces no new commit, or a `gh-stack:gh-stack` delegation
reports an error:

- **Halt immediately.** Do not proceed to the next Issue in the list. Every later Issue's branch is
  defined to stack on top of this one (the stack is linear), so skipping ahead would build on an
  Issue that never completed.
- **Do not attempt automatic rollback.** No `git reset`, no branch deletion, no
  `gh stack` removal call. Leave the partial state exactly as it is for the user to inspect —
  matching how `dev-workflow:resolve-pr-comments` halts on a push failure without cleaning up.
- **Report to the user**: which Issue failed, at which step, and the error.
- Every Issue before the failed one already completed step 5, so its work is safely pushed and
  unaffected by the failure.
- **To resume**: once the user has fixed the underlying problem, re-invoke this skill with the same
  parent Issue number. Pre-Phase's resume detection will find the branches for every Issue that
  already completed step 5, exclude them from the order, and the HARD-GATE will re-confirm the
  (now shorter) remaining order before the loop continues.
- If the failed Issue's commit succeeded but the following step 5 `gh stack push` is what actually
  failed, resume detection will find its branch already has a commit and classify it as
  **already stacked** — it is not re-implemented. Instead, the Push Safety Net (re-)delegates
  `gh stack push` for it once the user re-approves the (now shorter) remaining order, retrying
  exactly the step that failed without redoing implementation or committing again.
- If the failure happened before any commit was produced (`dev-workflow:implement-issue` itself
  failing, or `/create-commit:commit` producing no new commit), resume detection finds no commit
  for that Issue and re-invokes `dev-workflow:implement-issue` for it from scratch on the next run;
  that skill's own Discovery phase is responsible for surfacing any pre-existing partial work if
  relevant.
- The Issue's own empty branch (created by the failed run's `gh stack init`/`add` before any
  commit) is left in place per the no-rollback rule above, so the retry on the next run computes
  the same `issue-<Issue番号>-<slug>` name and re-invokes the same `gh stack init`/`add` call
  against a branch that may already exist locally with no commits. Whether that delegation can
  reuse an existing empty branch is up to `gh-stack:gh-stack`, not something this skill assumes —
  if it reports an error for this reason, delegate `Skill(skill="gh-stack:gh-stack")` to check out
  the existing empty branch and continue on it if it supports resuming onto one; only if it does
  not, delete the stale local branch — but only after confirming the name to delete is
  character-for-character identical to the `issue-<Issue番号>-<slug>` name this same iteration
  computed in step 1 for this same Issue (never a different Issue's branch, and never a name derived
  from anywhere else); halt without deleting anything if the names do not match exactly. Once
  confirmed, run `git branch -D issue-<Issue番号>-<slug>` and retry the same `gh stack init`/`add`
  call. Report to the user which path was taken before proceeding to step 3.

---

## Post-Phase: Completion

After the last Issue in the approved list completes step 5, **or immediately after the Push Safety
Net above when the approved list was empty** (every Issue in the chain was already stacked — e.g. a
prior run pushed everything but `gh stack submit --auto` itself failed or was never reached):

1. Delegate the final submit, exactly once for the whole chain:
   `Skill(skill="gh-stack:gh-stack")` → `gh stack submit --auto`.
2. Report the full chain to the user: every Issue implemented in this run (plus any that were
   already stacked coming in), each one's branch name, and the resulting PR(s) (from
   `gh stack submit`'s own output, or `Skill(skill="gh-stack:gh-stack")` → `gh stack view --json`
   if more detail is needed).

---

## Worked Example: 3-Issue Chain with a Mid-Chain Failure

Using the same `#99 → #100 → #104` chain from `references/dependency-graph.md`'s own Worked
Example (shown here as if all three were still `OPEN`, to illustrate the loop and a failure/resume
cycle rather than the finished dependency-graph result).

**Run 1** (fresh chain):

1. Pre-Phase resolves the order `#99 → #100 → #104`. `gh stack view --json` shows no existing
   branches, so nothing is excluded.
2. HARD-GATE: user approves `#99 → #100 → #104`.
3. Resume to Stack Top: `gh stack top` fails (no local stack exists yet) — expected on a fresh
   chain, continue to the Push Safety Net (skipped, no already-stacked Issues) and then the loop.
4. `#99`: `gh stack init issue-99-dependency-graph-resolution` → implement → commit →
   `gh stack push`. Succeeds.
5. `#100`: `gh stack add issue-100-gh-stack-delegation-table` → implement →
   **`dev-workflow:implement-issue` cannot reach GREEN on one acceptance criterion**. Halt.
6. Report:
   ```
   ❌ #100 で失敗しました（実装フェーズ、dev-workflow:implement-issue 内の feature-dev Phase 5）。
   #99 は既に push 済みで安全です。原因を修正のうえ、同じ親Issue番号（#86）で本skillを再実行してください。
   ```

**Run 2** (after the user fixes the underlying issue and re-invokes with parent `#86`):

1. Pre-Phase re-resolves the order from live GitHub state: `#99 → #100 → #104` (unchanged).
2. Resume detection: `gh stack view --json` shows `issue-99-dependency-graph-resolution` already in
   the stack with commits → excluded. Remaining order: `#100 → #104`.
3. Output Format shows:

   ```
   📦 既にスタック済み（実装スキップ）:
   - #99 stack-pr: 依存グラフ解決仕様の作成（ブランチ: issue-99-dependency-graph-resolution）

   🧱 スタック実装順序（今回の実行対象）:
   1. #100 stack-pr: gh-stack委譲対応表の作成（依存: #99）
   2. #104 stack-pr: stack-implement本体skillの実装（依存: #99, #100）
   ```

4. HARD-GATE: user approves the remaining order.
5. Resume to Stack Top: `gh stack top` checks out `issue-99-dependency-graph-resolution` (the only
   branch in the stack so far, hence already its top) — a no-op if the user had re-invoked from
   there already, but this guarantees the correct branch even if they had checked out `main` or some
   other unrelated branch before re-invoking.
6. Push Safety Net: one `gh stack push` covering the whole stack (currently just `#99`'s branch) —
   a no-op here since it was already pushed at the end of Run 1, but run anyway to cover the case
   where push (not the implementation) was what failed in a prior run.
7. `#100`: `gh stack add issue-100-gh-stack-delegation-table` (still stacks on top of `#99`'s
   already-pushed branch) → implement → commit → push. Succeeds this time.
8. `#104`: `gh stack add issue-104-stack-implement-skill` → implement → commit → push. Succeeds —
   last Issue in the list.
9. Post-Phase: `gh stack submit --auto`, once, for the whole `#99 → #100 → #104` chain.

---

## Additional Resources

- **`references/dependency-graph.md`** — full dependency-graph resolution spec (fetch, build,
  topological sort, cycle detection) that Pre-Phase Step 2 delegates to in full
- **`references/stack-workflow.md`** — gh-stack operation mapping and Branch Naming Rule that the
  Per-Issue Loop and resume detection both depend on
