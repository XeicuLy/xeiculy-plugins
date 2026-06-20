# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`xeiculy-plugins` は Claude Code 向けプラグインをまとめたモノレポです。

## Getting Started

```bash
pnpm install
```

`pnpm install` を実行すると、`prepare` スクリプト経由で husky がセットアップされ、commit-msg フックが自動で有効になります。

## Lint / Format

```bash
pnpm lint       # prettier フォーマット + TypeScript 型チェック
pnpm format     # prettier フォーマットのみ
pnpm tsc        # 型チェックのみ
```

## Commit 規約

[Conventional Commits](https://www.conventionalcommits.org/) を採用しています。husky の commit-msg フックで commitlint が自動検証します。

### 形式

```txt
<type>(<scope>): <subject>

<body>
```

### type 一覧

| type       | 用途                       |
| ---------- | -------------------------- |
| `feat`     | 新機能                     |
| `fix`      | バグ修正                   |
| `docs`     | ドキュメントのみの変更     |
| `chore`    | ビルド・ツール・設定の変更 |
| `refactor` | リファクタリング           |
| `ci`       | CI/CD 設定の変更           |

### scope 例

- `feat(task-planner): add new command`
- `fix(task-planner): correct output format`
- `docs(claude-md): update release flow`
- `chore(release): v1.0.0`

## リリース手順

### バージョン管理

`marketplace.json` がバージョンの単一ソースです。リリース時に `scripts/sync-versions.ts` が自動で `task-planner/plugin.json` へ同期します。手動でバージョンを書き換えないでください。

### ローカルからリリース

```bash
pnpm release
```

対話式プロンプトでバージョン（patch / minor / major）を選択すると、以下が自動実行されます：

1. `marketplace.json` と `plugin.json` のバージョンを更新
2. `CHANGELOG.md` を生成・更新
3. git タグ（`v<version>`）を作成してプッシュ
4. GitHub Release を作成

### CI 自動リリース

`main` ブランチへのプッシュ時に GitHub Actions が `pnpm release --ci` を実行します（`.github/workflows/release.yml`）。
