# task-planner

要件の明確化からGitHub Issue作成まで、実装準備を体系的に進めるClaude Codeプラグイン。

## 機能

- **task-breakdown**: 要件理解 → コードベース探索 → 設計 → タスク分解の6フェーズワークフロー
- **github-issue-creator**: タスク分解結果から親/子 GitHub Issue を自動作成・紐付け

## 前提条件

- `gh` CLI がインストール済みであること
- `gh auth login` で GitHub への認証が完了していること
- カレントディレクトリが Git リポジトリであること

## インストール

```bash
cc --plugin-dir /path/to/task-planner
```

または `.claude-plugin/` にコピーしてプロジェクト単位で使用する。

## 使い方

以下のような発言でスキルが自動的にトリガーされる:

**task-breakdown スキル:**

```
「xxを実装したい」
「xxを作りたい」
「この機能をタスク分解したい」
「要件を整理して Issue にしたい」
```

**github-issue-creator スキル:**

```
「Issue を作成して」
「タスクを GitHub Issue にしたい」
「子 Issue を作成して」
```

> `task-breakdown` スキルはフェーズ6で自動的に `github-issue-creator` を呼び出す。通常は `task-breakdown` のみ起動すれば Issue 作成まで一貫して実行される。

## フェーズ概要（task-breakdown）

| フェーズ | 内容                             |
| -------- | -------------------------------- |
| 1        | 要件の理解・軽量パス判定         |
| 2        | コードベースの並列探索           |
| 3        | 要件の明確化（ユーザー確認必須） |
| 4        | 複数アプローチの設計比較         |
| 5        | タスク分解・自己評価             |
| 6        | GitHub Issue 作成                |

各フェーズ間にはハードゲートがあり、ユーザーの承認なしに次フェーズへ進まない。
