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

## ライセンス

MIT
