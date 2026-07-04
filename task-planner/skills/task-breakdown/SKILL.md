---
name: task-breakdown
description: >
  This skill should be used when the user wants to plan a feature implementation from scratch,
  including requirement clarification, codebase exploration, design comparison, task decomposition,
  and automated GitHub Issue creation. It enforces a strict multi-phase workflow where each phase
  requires explicit user approval before proceeding. Assumes the feature or product to build is
  already decided — if the user has not yet decided what to build, use
  `product-planner:requirements-definition` first to document functional and non-functional
  requirements, then return here for task decomposition.
  Trigger phrases: "実装したい", "作りたい", "task-breakdown", "タスク分解", "issue を作りたい",
  "要件を整理したい", "implement this feature", "break this down into tasks",
  "create GitHub issues for this feature", "plan this feature".
version: 0.1.0
---

# Task Breakdown Skill

> Operate entirely in Japanese. Interpret all instructions in Japanese and respond to the user in Japanese.
>
> Tools to use: `TaskCreate` (progress tracking), `AskUserQuestion` (interactive questions), `Agent` (sub-agent launch), `Skill` (skill delegation)

Systematically progress through implementation preparation from requirement clarification to GitHub Issue creation. Obtain user approval at each phase gate before proceeding.

<HARD-GATE>
Do not proceed to Phase 3 (requirement clarification) before completing Phase 2 (codebase exploration).
Do not start Phase 4 (design) until the user confirms in Phase 3 (requirement clarification).
Do not start Phase 5 (task decomposition) until the user selects an approach in Phase 4 (design).
Do not start Phase 6 (issue creation) until the user approves in Phase 5 (task decomposition).
This applies to all task decompositions regardless of scope or complexity.
</HARD-GATE>

## Core Principles

- **Proceed interactively**: Use `AskUserQuestion` with multiple-choice options for ambiguities. Never proceed on assumptions.
- **Understand before acting**: Explore the codebase before proceeding to design and decomposition.
- **Decompose by revert unit**: Each task must be "the smallest meaningful unit of change that can be independently reverted."
- **Track progress with TODOs**: Manage all phase progress with `TaskCreate`.

---

## Phase 1: Requirement Understanding

**Goal**: Correctly understand what the user wants to achieve.

1. Create tasks for all phases using `TaskCreate`.
2. Review the requirements the user entered; if there are clearly ambiguous points, use `AskUserQuestion` to ask multiple-choice questions.
3. Summarize your understanding and confirm alignment with `AskUserQuestion`.
   - Example options: `["はい、その通りです", "修正が必要です"]`

4. **Lightweight path decision**: If **all** of the following apply, proceed as a lightweight path:
   - Expected to modify 5 or fewer files
   - Requirements can be explained in one sentence (no ambiguity or branching technical choices)
   - Similar implementation already exists in the codebase (not an entirely new feature)

   **Lightweight path**: Phase 2 (single explorer agent only) → Phase 3 (confirmation only) → Phase 5 (direct decomposition) → Phase 6
   **Standard path**: Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

---

## Phase 2: Codebase Exploration

**Goal**: Understand the current state of the codebase needed to implement the requirements.

1. Launch 2–3 `feature-dev:code-explorer` sub-agents in parallel using the `Agent` tool. Assign different perspectives to each agent:
   - Investigation of similar features and existing implementation patterns
   - Overall architecture mapping
   - Identification of related files and entry points

   Required instructions for each agent:
   - Keep output to **200 lines or fewer**
   - Return output in the following 4-section format:
     1. **Key files** (max 7): path and one-line description
     2. **Main patterns** (max 5): implementation patterns used in the codebase
     3. **Suggestions for next phase** (max 3): design and implementation considerations
     4. **Learning context candidates** (max 3): educational context for task issues. For each candidate include:
        - **Why**: why this change is needed (1–2 sentences, grounded in the observed codebase state)
        - **Hints**: exactly 2 implementation hints derived from patterns found in the codebase
        - **References**: 1–3 file locations in `file:line` format

2. Summarize discovered patterns and insights and report to the user.

---

## Phase 3: Requirement Clarification

**Goal**: Resolve all ambiguities before design begins.

> ⚠️ **CRITICAL**: This is one of the most important phases. Do not skip.

1. Cross-reference Phase 1 requirements with Phase 2 codebase findings.
2. Identify undefined aspects: edge cases, error handling, scope boundaries, integration points.
3. **Use `AskUserQuestion` to present 1–4 questions**. Use multiple-choice format wherever possible.
4. Organize all answers and confirm finalized requirements with the user using `AskUserQuestion`.
   - Example options: `["はい、この要件で進めてください", "修正が必要です"]`

---

## Phase 4: Design

**Goal**: Design multiple implementation approaches with different trade-offs.

1. Launch 2–3 `feature-dev:code-architect` sub-agents in parallel using the `Agent` tool, each designing a different approach:
   - **Minimal-change approach**: Minimum changes, maximum reuse of existing code
   - **Pragmatic approach**: Balance between development speed and quality
   - **Best-practice approach**: Emphasis on recommended patterns, component design, and testability

   Required instructions for each agent:
   - Keep output to **150 lines or fewer**
   - Return only: changed-files table (path, operation, reason), pros/cons, and estimated task count

2. Review each approach and present to the user using `AskUserQuestion` (max 4 options):
   - Summary, pros, cons, and estimated task count for each approach
   - A recommendation with justification

---

## Phase 5: Task Decomposition

**Goal**: Decompose the finalized design into tasks at the appropriate granularity and evaluate them.

1. Generate a task list for the approach selected in Phase 4.
   - For each task, assemble a `learning_context` object using the Phase 2 agents' **Learning context candidates** output. Map the candidates to the 4 sub-fields defined in `references/issue-schema.md`:
     - `background`: the **Why** from the most relevant candidate
     - `hints`: the **Hints** list (expand or trim to fit the task scope)
     - `references`: the **References** file:line citations
     - `pre_implementation_checklist`: derive 2–4 items from the hints and references (e.g., "Confirm X exists", "Read Y before editing Z")
2. Self-evaluate the task list according to the "5 perspectives for evaluating a task list" section in `references/decomposition-guidelines.md`.
3. Present evaluation results (granularity check, cohesion check, independence check, dependency mapping, improvement proposals) to the user.
4. Obtain approval for the Issue structure using `AskUserQuestion`.
   - Example options: `["はい、このタスク分解でIssueを作成してください", "調整が必要です"]`

---

## Phase 6: Issue Creation

**Goal**: Create the approved task decomposition as GitHub Issues.

> 🚫 **Do not create Issues without user approval.**

1. Call `Skill(skill="task-planner:github-issue-creator")`.
2. Pass the following information to the skill:
   - Summary of finalized requirements
   - Selected architecture approach
   - Task list (title, summary, and dependencies for each task)
   - See `references/issue-schema.md` for the `changed_files` format

3. Organize the Issue URLs returned by the skill and present them to the user.
4. Guide the user on next steps (implementation order, tasks that can be parallelized, recommended PR strategy).

---

## Additional Resources

### Reference Files

- **`references/decomposition-guidelines.md`** — Evaluation criteria for task decomposition, split-decision flowchart, size metrics, cohesion pattern catalog
- **`references/issue-schema.md`** — Schema definition for the payload passed to the `github-issue-creator` skill

### Examples

- **`examples/sample-task-breakdown.md`** — Real examples of the Phase 5 task list and Phase 6 payload
