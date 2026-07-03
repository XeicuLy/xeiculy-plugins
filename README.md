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

### [product-planner](./product-planner)

ふわっとしたプロダクトのアイデアを、対話を通じて機能要件・非機能要件のドキュメントに落とし込むワークフロープラグイン。`task-planner` よりさらに上流の0→1企画段階を担当する。

**インストール:**

```bash
/plugin install product-planner@xeiculy-plugins
```

**機能:**

- 目的・背景・対象ユーザー確認 → 機能要件の洗い出し → 非機能要件の洗い出し → ドキュメント生成の4フェーズワークフロー
- 各フェーズにハードゲート（ユーザー承認なしに次フェーズへ進まない）
- 生成したドキュメントは `docs/requirements/<slug>.md` に保存し、`task-planner:task-breakdown` への引き継ぎを想定

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

### [create-commit](./create-commit)

Conventional Commits 規約に従ったコミット作成・プッシュ・PR 作成・不要ブランチ整理を行うスキル集。

**インストール:**

```bash
/plugin install create-commit@xeiculy-plugins
```

**機能:**

- `commit`: ステージ済み差分を解析して Conventional Commits 形式のメッセージを自動生成し、確認後にコミット
- `commit-push-pr`: コミット → プッシュ → PR 作成を一気通貫で実行
- `clean-gone`: リモートで削除済みのローカルブランチを一覧表示・選択削除

**前提条件:** `git` インストール済み・`commit-push-pr` 使用時は `gh` CLI インストール済み・GitHub 認証済み

## ライセンス

MIT
