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

`marketplace.json` がバージョンの単一ソースです。`scripts/sync-versions.ts` が `marketplace.json` と全 `plugin.json` へバージョンを同期します。`changelogen` は `CHANGELOG.md` の生成のみに使用します。手動でバージョンを書き換えないでください。

- 各プラグインの `plugin.json` の `version` と `marketplace.json` の対応する `source.ref` は、前回リリースタグ以降にそのプラグインディレクトリ配下で変更があった場合のみ更新されます。変更のないプラグインはバージョンが据え置かれます。
- `scripts/`, `CLAUDE.md`, `README.md`, `.github/` など、どのプラグインディレクトリにも属さない共通ファイルのみの変更では、どのプラグインの `version` / `source.ref` も更新されません（`marketplace.json` の `metadata.version` はリリースごとに更新されます）。

### ローカルからリリース

```bash
pnpm release
```

対話式プロンプトでバージョン（patch / minor / major）を選択すると、以下が自動実行されます：

1. `CHANGELOG.md` を生成・更新（`changelogen`）
2. `marketplace.json` と全 `plugin.json` のバージョンを更新（`sync-versions.ts`）
3. git タグ（`v<version>`）を作成してプッシュ
4. GitHub Release を作成

変更せずにリリースフローを確認したい場合はドライランを使います：

```bash
pnpm release --dry-run
```

### CI リリース

GitHub Actions の手動トリガーでリリースを実行します：

1. GitHub リポジトリ → **Actions** → **Release** ワークフローを選択
2. **Run workflow** をクリック
3. `version_type` を選択（`auto` / `patch` / `minor` / `major`）して実行

`auto` を選択すると、コミット履歴からバージョン種別を自動判定します（`feat:` → minor、破壊的変更 → major、それ以外 → patch）。
