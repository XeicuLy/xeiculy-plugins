# TDD Cycle Reference

Complete **one acceptance criterion at a time** using **RED → GREEN → REFACTOR**.

## Test What Behavior, Not Implementation

| Test this (behavior)                            | Not this (implementation detail)         |
| ----------------------------------------------- | ---------------------------------------- |
| HTTP status codes and response bodies           | Internal function arguments / call order |
| Database state changes (insert, update, delete) | Struct field values, type assertions     |
| Error response format and codes                 | Number of mock invocations               |

## RED → GREEN → REFACTOR

**RED**: Write a test describing the behavior of one acceptance criterion → run the test suite and confirm **failure**.
If the test does not fail, it is not correctly capturing the behavior — rewrite it.

**GREEN**: Write the minimum implementation to pass the test → run the test suite and confirm **all tests pass**.

**REFACTOR**: Remove duplication and improve naming → run the test suite and linter to confirm no regressions.

When there are multiple acceptance criteria, fully complete one before moving to the next RED.
