# dev-workflow

GitHub Issue の実装と PR レビューコメント対応を TDD で進めるワークフロープラグイン。

## Skills

### `implement-issue`

GitHub Issue を受け取り、要件を取得して `feature-dev` の 7-Phase Workflow へ引き渡します。実装フェーズでは受入基準ごとに RED → GREEN → REFACTOR を強制します。

**トリガー例:** `#42 実装して`, `Issue 42 対応して`, `#42 修正`

### `resolve-pr-comments`

PR のレビューコメントを取得・分類（要対応 / 推奨対応 / 対応不要）し、ユーザー確認後に `feature-dev` の 7-Phase Workflow へ引き渡します。実装完了後、各コメントに GitHub 上で個別返信します。

**トリガー例:** `PR #15 のレビュー対応して`, `CHANGES_REQUESTED 直して`, `PR コメント対応`

## Prerequisites

This plugin requires two external plugins. Install both before use:

```
/plugin install feature-dev@claude-plugins-official
/plugin install commit-commands@claude-plugins-official
```

- `feature-dev` — provides the 7-Phase implementation workflow delegated by both skills
- `commit-commands` — provides the `commit` skill used by `resolve-pr-comments` during the post-phase

## Installation

```
/plugin install dev-workflow@xeiculy
```

## How It Works

```
User trigger
  └─ implement-issue / resolve-pr-comments
       ├─ Pre-Phase: gh CLI でリポジトリ・Issue/PR 情報を取得
       ├─ feature-dev:feature-dev へ委譲（7-Phase Workflow）
       │    └─ 実装フェーズは TDD サイクルで上書き
       └─ Post-Phase: 確認・コミット・(PR コメント返信)
```
