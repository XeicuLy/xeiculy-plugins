# Layer Label Generic Pattern Mapping Table

Used when inferring layer labels from changed file paths. Even if not an exact match, infer from the directory structure.

## Database / Migration Layer

| File path pattern                                       | Label              |
| ------------------------------------------------------- | ------------------ |
| `migrations/`, `db/migrations/`, `database/migrations/` | `layer: migration` |
| `*.sql` (for migration purposes)                        | `layer: migration` |

## Data Access Layer

| File path pattern                    | Label               |
| ------------------------------------ | ------------------- |
| `repository/`, `repositories/`       | `layer: repository` |
| `store/`, `stores/`, `dao/`, `daos/` | `layer: repository` |
| `models/` (ORM / DB models)          | `layer: repository` |

## Business Logic Layer

| File path pattern                     | Label            |
| ------------------------------------- | ---------------- |
| `service/`, `services/`               | `layer: service` |
| `usecase/`, `usecases/`, `use_cases/` | `layer: service` |
| `domain/`, `domains/`                 | `layer: service` |
| `interactor/`, `interactors/`         | `layer: service` |

## API / Presentation Layer

| File path pattern                                | Label        |
| ------------------------------------------------ | ------------ |
| `handler/`, `handlers/`                          | `layer: api` |
| `controller/`, `controllers/`                    | `layer: api` |
| `router/`, `routers/`, `routes/`                 | `layer: api` |
| `api/`, `endpoints/`                             | `layer: api` |
| `openapi.yaml`, `swagger.yaml`, `*.openapi.json` | `layer: api` |

## Frontend Layer

| File path pattern                         | Label             |
| ----------------------------------------- | ----------------- |
| `frontend/`, `client/`, `web/`            | `layer: frontend` |
| `ui/`, `src/components/`, `src/pages/`    | `layer: frontend` |
| `src/views/`, `src/screens/`              | `layer: frontend` |
| `*.vue`, `*.jsx`, `*.tsx` (UI components) | `layer: frontend` |

## Infrastructure / CI/CD Layer

| File path pattern                             | Label                                           |
| --------------------------------------------- | ----------------------------------------------- |
| `infra/`, `infrastructure/`                   | `infra` (applied as type label, no layer label) |
| `.github/workflows/`                          | `infra`                                         |
| `terraform/`, `pulumi/`, `ansible/`           | `infra`                                         |
| `docker/`, `Dockerfile`, `docker-compose.yml` | `infra`                                         |
| `k8s/`, `kubernetes/`                         | `infra`                                         |

## Test Layer

| File path pattern                        | Label                                             |
| ---------------------------------------- | ------------------------------------------------- |
| `test/`, `tests/`, `__tests__/`, `spec/` | `layer: test` (can be combined with other labels) |
| `*.test.ts`, `*.spec.ts`, `*_test.go`    | `layer: test`                                     |

## Notes

- When a file matches multiple patterns, prioritize the more specific pattern.
- For project-specific directory structures, infer appropriate labels from the overall architecture.
- If no pattern matches, omit the layer label and apply only the type label.
