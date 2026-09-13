---
name: stack-implement
description: >
  Use when implementing a chain of dependent GitHub Issues under a parent Issue as stacked PRs
  (依存Issue群をスタックで実装, スタックPRで実装して, gh-stackで積む, stack-implement,
  子Issue群をまとめて実装). Resolves the sub-issue dependency graph into a single implementation
  order, gates on user approval, then loops dev-workflow:implement-issue → /create-commit:commit
  → the official gh-stack skill per Issue. Not for a single standalone Issue with no dependents
  (use dev-workflow:implement-issue directly), and not for resolving PR review comments.
allowed-tools: Bash(gh repo view *) Bash(gh issue view *) AskUserQuestion Skill(dev-workflow:implement-issue *) SlashCommand(/create-commit:commit) Skill(gh-stack:gh-stack *)
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
3. **Resume detection.** Before presenting the order for approval, delegate
   `Skill(skill="gh-stack:gh-stack")` → `gh stack view --json` to list the branches already
   present in the local stack. For each Issue in the order from Step 2, compute its branch name
   using the Branch Naming Rule in `references/stack-workflow.md` and check whether a branch with
   that exact name exists in the stack **and** has at least one commit beyond its parent branch in
   the stack (an empty branch — created by `gh stack init`/`add` but abandoned before any commit —
   does not count as done).
   - Every Issue that matches is **already stacked**: its implementation and commit are done, so
     exclude it from the Per-Issue Loop below (do not re-invoke `dev-workflow:implement-issue` or
     `/create-commit:commit` for it) — but keep it visible in the report (see Output Format below)
     for context. Since a local commit existing on the branch does not guarantee it was actually
     pushed (step 5 of a prior run may have failed after step 4 succeeded), the Push Safety Net
     (below the HARD-GATE) re-pushes every already-stacked Issue once — but only after the user
     approves the stack order. Resume detection itself performs no `gh-stack` delegation; it only
     classifies branches, so nothing changes remotely before approval.
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
Do not invoke Skill(dev-workflow:implement-issue), SlashCommand(/create-commit:commit), or
Skill(gh-stack:gh-stack) for any Issue until the user has approved the "スタック実装順序（今回の実行対象）"
list via AskUserQuestion. This applies on every invocation without exception — a fresh chain, a
single remaining Issue after a resume, and a full re-run all gate the same way, since the order is
re-derived from live state each time and could differ from what was approved previously (e.g. a
dependency was added or removed on GitHub since the last run).
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

### Push Safety Net for Already-Stacked Issues

Immediately after the user selects "はい、この順序で実装してください" above — and before Step 1 of the
Per-Issue Loop below — for every Issue Pre-Phase Step 3 classified as **already stacked**, delegate
`Skill(skill="gh-stack:gh-stack")` → `gh stack push` once, on that Issue's own branch (the same
`issue-<Issue番号>-<slug>` name computed via the Branch Naming Rule in Pre-Phase Step 3) — one
delegation per already-stacked Issue, not a single call covering all of them. `gh stack push` is
idempotent, so this is safe whether or not it was already pushed in a prior run; skip this
delegation entirely when there were no already-stacked Issues.

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
3. `#99`: `gh stack init issue-99-dependency-graph-resolution` → implement → commit →
   `gh stack push`. Succeeds.
4. `#100`: `gh stack add issue-100-gh-stack-delegation-table` → implement →
   **`dev-workflow:implement-issue` cannot reach GREEN on one acceptance criterion**. Halt.
5. Report:
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
5. Push Safety Net: `gh stack push` for `#99`'s branch (the one already-stacked Issue) — a no-op
   here since it was already pushed at the end of Run 1, but run anyway to cover the case where
   push (not the implementation) was what failed in a prior run.
6. `#100`: `gh stack add issue-100-gh-stack-delegation-table` (still stacks on top of `#99`'s
   already-pushed branch) → implement → commit → push. Succeeds this time.
7. `#104`: `gh stack add issue-104-stack-implement-skill` → implement → commit → push. Succeeds —
   last Issue in the list.
8. Post-Phase: `gh stack submit --auto`, once, for the whole `#99 → #100 → #104` chain.

---

## Additional Resources

- **`references/dependency-graph.md`** — full dependency-graph resolution spec (fetch, build,
  topological sort, cycle detection) that Pre-Phase Step 2 delegates to in full
- **`references/stack-workflow.md`** — gh-stack operation mapping and Branch Naming Rule that the
  Per-Issue Loop and resume detection both depend on
