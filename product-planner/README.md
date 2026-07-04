# product-planner

ふわっとしたプロダクトのアイデアを、対話を通じて機能要件・非機能要件のドキュメントに落とし込むClaude Codeプラグイン。

## 機能

- **requirements-definition**: 目的・背景確認 → 機能要件の洗い出し → 非機能要件の洗い出し → ドキュメント生成の4フェーズワークフロー

## 位置づけ

`task-planner:task-breakdown` は「実装したい機能」が既に決まっている前提の分解ツールだが、`product-planner:requirements-definition` はさらに上流の「まだ何を作るか固まっていない」0→1のプロダクト企画段階を担当する。

```text
product-planner:requirements-definition  →  task-planner:task-breakdown
（何を作るか固める）                        （どう作るかタスク分解する）
```

## インストール

```bash
cc --plugin-dir /path/to/product-planner
```

または `.claude-plugin/` にコピーしてプロジェクト単位で使用する。

## 使い方

以下のような発言でスキルが自動的にトリガーされる:

```text
「プロダクトを企画したい」
「こんなものを作ってみたい」
「要件定義書を作りたい」
「まだ何を作るか固まっていないけどアイデアがある」
```

## フェーズ概要（requirements-definition）

| フェーズ | 内容                                             |
| -------- | ------------------------------------------------ |
| 1        | 目的・背景・対象ユーザーの確認                   |
| 2        | 機能要件の洗い出し（優先度付き）                 |
| 3        | 非機能要件の洗い出し（カテゴリ別チェックリスト） |
| 4        | ドキュメント生成・最終レビュー                   |

各フェーズ間にはハードゲートがあり、ユーザーの承認なしに次フェーズへ進まない。

生成されたドキュメントは `docs/requirements/<slug>.md` に保存され、続けて `task-planner:task-breakdown` に引き継いでタスク分解を進められる。
