# stack-pr

個人開発におけるスタックPR（依存関係のあるIssue/PRの積み重ね）運用を、gh-stack公式のAIエージェント向けskillへ委譲する形で支援するプラグイン。

## 概要

Issue間の依存関係グラフの解決やスタックPRの運用（`gh stack` コマンド操作）は、gh-stackが公式配布するAIエージェント向けskillへ委譲する。これにより、`gh stack` コマンド仕様を本プラグイン側でreference化・保守する必要がなくなる。個別Issueの実装ループ自体は `dev-workflow:implement-issue` に委譲する設計とする。

現時点では本プラグインの骨格（`plugin.json` と本README）のみを提供している。依存グラフ解決やgh-stack委譲対応表を扱う本体skillの実装は今後のリリースで追加される。

## 前提条件

- `gh` CLI がインストール済み・`gh auth login` でGitHub認証済みであること
- gh-stack extension がインストール済みであること:
  ```bash
  gh extension install github/gh-stack
  ```
- gh-stack公式のAIエージェント向けskillがインストール済みであること:
  ```bash
  gh skill install github/gh-stack
  ```

## インストール

> **Note:** 本プラグインは現時点でスケルトンのみを提供しており、`marketplace.json` への登録は別Issueで対応予定。登録が完了すると、以下のコマンドでインストールできるようになる。

```bash
/plugin install stack-pr@xeiculy-plugins
```

## 設計方針

- 依存グラフの解決や `gh stack` コマンドの実行はgh-stack公式skillへ委譲し、本プラグイン側で独自のコマンド仕様をreference化しない
- 個別Issueの実装ループは `dev-workflow:implement-issue` に委譲する
