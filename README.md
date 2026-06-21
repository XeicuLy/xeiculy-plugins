# xeiculy-plugins

Claude Code plugin marketplace by XeicuLy.

## マーケットプレイスの追加

```bash
/plugin marketplace add XeicuLy/xeiculy-plugins
```

または Claude Code CLI から:

```bash
claude plugin marketplace add XeicuLy/xeiculy-plugins
```

## プラグイン一覧

### [task-planner](./task-planner)

要件の明確化からGitHub Issue作成まで、実装準備を体系的に進めるワークフロープラグイン。

**インストール:**

```bash
/plugin install task-planner@xeiculy-plugins
```

**機能:**

- 要件理解 → コードベース探索 → 設計比較 → タスク分解 → GitHub Issue 自動作成
- 各フェーズにハードゲート（ユーザー承認なしに次フェーズへ進まない）
- `gh` CLI を使った親/子 Issue の作成・Sub Issue 紐付け・依存関係設定

**前提条件:** `gh` CLI インストール済み・GitHub 認証済み・Git リポジトリ内で使用

### [dev-workflow](./dev-workflow)

GitHub Issue の実装と PR レビューコメント対応を TDD で進めるワークフロープラグイン。

**インストール:**

```bash
/plugin install dev-workflow@xeiculy-plugins
```

**機能:**

- Issue 番号からリポジトリ・要件を自動取得し `feature-dev` 7-Phase Workflow へ委譲
- PR レビューコメントを 要対応 / 推奨対応 / 対応不要 に分類し、ユーザー確認後に対応
- 実装フェーズは受入基準ごとに RED → GREEN → REFACTOR を強制
- 実装完了後、各 PR コメントに GitHub 上で個別返信

**前提条件:** `gh` CLI インストール済み・GitHub 認証済み・`feature-dev@claude-plugins-official` と `commit-commands@claude-plugins-official` がインストール済み

## ライセンス

MIT
