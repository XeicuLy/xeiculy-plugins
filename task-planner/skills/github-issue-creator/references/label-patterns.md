# レイヤーラベル 汎用パターン対応表

変更ファイルパスからレイヤーラベルを推論する際に使用する。パターンに完全一致しなくても、ディレクトリ構造から類推してよい。

## データベース / マイグレーション層

| ファイルパスのパターン                                  | ラベル             |
| ------------------------------------------------------- | ------------------ |
| `migrations/`, `db/migrations/`, `database/migrations/` | `layer: migration` |
| `*.sql`（マイグレーション目的）                         | `layer: migration` |

## データアクセス層

| ファイルパスのパターン               | ラベル              |
| ------------------------------------ | ------------------- |
| `repository/`, `repositories/`       | `layer: repository` |
| `store/`, `stores/`, `dao/`, `daos/` | `layer: repository` |
| `models/`（ORM / DB モデル）         | `layer: repository` |

## ビジネスロジック層

| ファイルパスのパターン                | ラベル           |
| ------------------------------------- | ---------------- |
| `service/`, `services/`               | `layer: service` |
| `usecase/`, `usecases/`, `use_cases/` | `layer: service` |
| `domain/`, `domains/`                 | `layer: service` |
| `interactor/`, `interactors/`         | `layer: service` |

## API / プレゼンテーション層

| ファイルパスのパターン                           | ラベル       |
| ------------------------------------------------ | ------------ |
| `handler/`, `handlers/`                          | `layer: api` |
| `controller/`, `controllers/`                    | `layer: api` |
| `router/`, `routers/`, `routes/`                 | `layer: api` |
| `api/`, `endpoints/`                             | `layer: api` |
| `openapi.yaml`, `swagger.yaml`, `*.openapi.json` | `layer: api` |

## フロントエンド層

| ファイルパスのパターン                        | ラベル            |
| --------------------------------------------- | ----------------- |
| `frontend/`, `client/`, `web/`                | `layer: frontend` |
| `ui/`, `src/components/`, `src/pages/`        | `layer: frontend` |
| `src/views/`, `src/screens/`                  | `layer: frontend` |
| `*.vue`, `*.jsx`, `*.tsx`（UIコンポーネント） | `layer: frontend` |

## インフラ / CI/CD 層

| ファイルパスのパターン                        | ラベル                                              |
| --------------------------------------------- | --------------------------------------------------- |
| `infra/`, `infrastructure/`                   | `infra`（種別ラベルとして付与、レイヤーラベルなし） |
| `.github/workflows/`                          | `infra`                                             |
| `terraform/`, `pulumi/`, `ansible/`           | `infra`                                             |
| `docker/`, `Dockerfile`, `docker-compose.yml` | `infra`                                             |
| `k8s/`, `kubernetes/`                         | `infra`                                             |

## テスト層

| ファイルパスのパターン                   | ラベル                                      |
| ---------------------------------------- | ------------------------------------------- |
| `test/`, `tests/`, `__tests__/`, `spec/` | `layer: test`（他のレイヤーラベルと併用可） |
| `*.test.ts`, `*.spec.ts`, `*_test.go`    | `layer: test`                               |

## 備考

- 複数のパターンに一致するファイルは、より具体的なパターンを優先する
- プロジェクト固有のディレクトリ構造は、全体のアーキテクチャから類推して適切なラベルを付与する
- パターンに一致しない場合はレイヤーラベルを省略し、種別ラベルのみを付与する
