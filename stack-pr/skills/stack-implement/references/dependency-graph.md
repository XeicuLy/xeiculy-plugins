# Dependency Graph Resolution

Resolves a GitHub Issue dependency graph (parent → sub-issues → blocked-by) into a single linear stack implementation order. Consumed by `stack-implement/SKILL.md`'s Pre-Phase to decide, for a given parent Issue, which order to loop `dev-workflow:implement-issue` over its sub-issues before stacking each result with `gh-stack`.

This spec assumes Issues were created by `task-planner:github-issue-creator` (`--parent` / `--blocked-by` flags), which produces one parent Issue with a **flat** list of direct sub-issues — no grandchildren. Nested sub-issue trees are out of scope; if a fetched sub-issue itself has sub-issues, treat it as a validation error (see Step 6).

## Prerequisites

- `gh` CLI version 2.94.0 or later (same requirement as `github-issue-creator`)
- Read access to the target repository's Issues

## Input

- **Parent Issue number** (required) — passed from the caller (e.g. the user, or `stack-implement/SKILL.md`'s Pre-Phase)
- **`dependency_table`** (optional) — the `child_issues` dependency pairs from the original `task-planner:github-issue-creator` payload (see `task-planner/skills/task-breakdown/references/issue-schema.md`), if the caller still has it. Used only for the cross-check in Step 4.

---

## Step 1: Fetch the sub-issue list

```bash
gh issue view <親Issue番号> --repo <owner>/<repo> --json number,title,state,subIssues,subIssuesSummary
```

`subIssues.nodes[]` gives each direct sub-issue's `number`, `title`, `state` (`OPEN` / `CLOSED`). This is the full node set of the graph. If `subIssues.totalCount` is 0, stop and report to the user — there is nothing to stack.

## Step 2: Fetch each sub-issue's `blockedBy`

For every sub-issue number from Step 1:

```bash
gh issue view <子Issue番号> --repo <owner>/<repo> --json number,title,state,blockedBy
```

`blockedBy.nodes[]` gives the Issues that must close before this one can start. Collect `(from, to)` edges as `to depends on from` for every `blockedBy` entry whose number is in the Step 1 node set.

If a `blockedBy` entry's number is **not** in the Step 1 node set (a dependency on an Issue outside this parent's sub-issue tree — e.g. a cross-cutting Issue like #95 blocking both #99 and #100 belongs to the _same_ parent tree and is fine, but a dependency on an unrelated Issue elsewhere is not), report it to the user as an external dependency and ask whether to treat it as already satisfied (if `CLOSED`) or block the whole stack (if `OPEN`). Do not silently drop it.

## Step 3: Build the graph

- **Nodes**: every sub-issue from Step 1, each tagged with its `state`.
- **Edges**: every `(from, to)` pair from Step 2, read as "`to` depends on `from`".
- **Already-satisfied nodes**: any node with `state == "CLOSED"`. Keep them in the graph (they still count for edge resolution) but exclude them from the final stack order in Step 5 — there is nothing left to implement for them.

## Step 4: Cross-check against `dependency_table` (optional)

If the caller supplied a `dependency_table`, verify that the edge set built in Step 3 exactly matches the dependency pairs it declares (same check `github-issue-creator` Step -1 already performs before Issue creation — this step re-verifies that GitHub's live state still agrees with it). On mismatch, report the specific differing pairs and halt — do not guess which source is correct.

If no `dependency_table` is supplied, skip this step; the graph from Step 3 (live GitHub state) is authoritative.

---

## Step 5: Topological sort (Kahn's algorithm)

This reuses `github-issue-creator`'s "create tasks with no dependencies first" ordering rule (`task-planner/skills/github-issue-creator/SKILL.md:139`), generalized into a repeatable algorithm and given a deterministic tie-break, since `gh-stack` stacks branches one at a time and needs a single total order even when two Issues are mutually independent:

1. Compute each node's **in-degree** = number of incoming edges (how many still-`OPEN` dependencies it has). A `CLOSED` node's outgoing edges still count toward its dependents' in-degree only if the dependent itself needs to wait — since a `CLOSED` dependency is already satisfied, do **not** count edges _from_ a `CLOSED` node when computing in-degree.
2. Put all `OPEN` nodes with in-degree 0 into a ready set.
3. Repeat until the ready set is empty:
   - Pick the **lowest-numbered** Issue in the ready set (deterministic tie-break — matches the ascending order `github-issue-creator` creates Issues in) and append it to the stack order.
   - Decrement the in-degree of every node it points to (its dependents). Any dependent that reaches in-degree 0 joins the ready set.
4. The resulting list is the stack implementation order, each entry to be looped through `dev-workflow:implement-issue` → commit → `gh-stack add` in that sequence.

## Step 6: Cycle detection and error policy

After Step 5, if any `OPEN` node was never appended to the stack order (its in-degree never reached 0), the graph contains a cycle.

- **Halt immediately** — do not attempt a partial or best-effort order.
- **Report the exact cycle**: the leftover nodes and their remaining unresolved `blockedBy` edges, e.g. `#12 → blocked by #13, #13 → blocked by #12`.
- Ask the user to fix the dependency declaration on GitHub (`gh issue edit --remove-blocked-by` / re-create the Issue) before retrying — this tool does not modify Issue relationships itself.

This also covers the flat-graph assumption from the top of this document: if Step 2 discovers a sub-issue that itself has sub-issues, treat it the same way — halt and report it as an unsupported nested structure, rather than silently ignoring the grandchildren.

---

## Output Format

Report the resolved order to the caller as a table, skipping `CLOSED` nodes (already satisfied) but keeping them visible as context:

```
📊 依存グラフ解決結果（親Issue #86）

✅ 解決済み（実装スキップ）:
- #95 stack-pr: プラグイン骨格の新規作成 (CLOSED)

📦 スタック実装順序:
1. #99 stack-pr: 依存グラフ解決仕様の作成（依存: #95）
2. #100 stack-pr: gh-stack委譲対応表の作成（依存: #95）
3. #104 stack-pr: stack-implement本体skillの実装（依存: #99, #100）
```

---

## Worked Example

Live data from this repository's own `#86` sub-issue tree (fetched via the commands in Steps 1–2):

| Issue | State  | blockedBy |
| ----- | ------ | --------- |
| #95   | CLOSED | —         |
| #99   | OPEN   | #95       |
| #100  | OPEN   | #95       |
| #104  | OPEN   | #99, #100 |
| #106  | OPEN   | #104      |

Applying Step 5:

1. In-degrees: `#95`=0, `#99`=1, `#100`=1, `#104`=2, `#106`=1. `#95` is `CLOSED`, so it is excluded from the output order but still resolves its dependents' in-degree.
2. Ready set starts as `{#95}` (in-degree 0). Since it's `CLOSED`, it is processed (to unblock dependents) but not appended to the output list.
3. Removing `#95`'s edges drops `#99` and `#100` to in-degree 0 → ready set `{#99, #100}`. Lowest-numbered first: append `#99`, then `#100`.
4. Removing both drops `#104` to in-degree 0 → append `#104`.
5. Removing `#104`'s edge drops `#106` to in-degree 0 → append `#106`.

Result: **`#99 → #100 → #104 → #106`**. The Output Format example above shows the same chain truncated at `#104` for brevity — `#106` would be appended as step 4 there too.

---

## Additional Resources

- **`stack-workflow.md`** — gh-stack delegation table consumed alongside this file by `stack-implement/SKILL.md` (added in a later Issue)
- **`task-planner/skills/task-breakdown/references/issue-schema.md`** — `dependency_table` field definition used in Step 4
- **`task-planner/skills/github-issue-creator/SKILL.md`** — the "no dependencies first" ordering rule this algorithm generalizes
