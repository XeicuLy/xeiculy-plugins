# tech-adr

個人開発における技術判断（リファクタリング判断・変更容易性・DB選定・パフォーマンス・ランニングコストなど）を対話形式で整理し、MADR形式のADR（Architecture Decision Record）として `docs/adr/` 配下に記録するClaude Codeプラグイン。

## 概要

個人開発では技術判断を相談する相手がおらず、判断の記録も残りにくい。本プラグインは、`product-planner:requirements-definition` と同様にフェーズごとのハードゲート（ユーザー承認なしに次フェーズへ進まない）を用いた対話形式で技術判断を整理し、後から見返せるMADR標準フォーマットのドキュメントとして保存する。

現時点では本プラグインの骨格（`plugin.json` と本README）のみを提供している。対話フローとADR生成を担う本体skill（`adr-writer`）の実装は今後のリリースで追加される。

## 前提条件

- ADRの保存先として `docs/adr/` ディレクトリを使用する（存在しない場合はskill実行時に作成される想定）
- MADR（Markdown Architecture Decision Records）フォーマットの基礎知識があると読みやすい

## インストール

> **Note:** 本プラグインは現時点でスケルトンのみを提供しており、`marketplace.json` への登録は別Issueで対応予定。登録が完了すると、以下のコマンドでインストールできるようになる。

```bash
/plugin install tech-adr@xeiculy-plugins
```

## 設計方針

- `product-planner:requirements-definition` のフェーズゲート構造を踏襲し、ユーザー承認なしに次フェーズへ進まない対話形式で技術判断を整理する
- 生成するドキュメントはMADR標準フォーマットに準拠し、`docs/adr/` 配下に保存する
