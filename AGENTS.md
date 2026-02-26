# Agent Guidance for Validations Project

## Project Summary

Dynamic SQL-based rule engine for data validation. Google Sheets tabs → DuckDB; MySQL tables → DuckDB views; rules execute SQL to find invalid rows before data load.

## Stack

| Layer | Tech |
|-------|------|
| Backend | ASP.NET Core, FastEndpoints, Dapper, DuckDB, MySQL, Google Sheets API |
| Frontend | Next.js 16, React 19, TanStack Query, Zustand, react-hook-form, Zod, Drizzle |

## Key Paths

- **Backend**: `backend/` — `Program.cs`, `Application/Services/ValidationEngine.cs`, `DuckDbOperations.cs`, `ErrorAttribution.cs`, `EventRules/`, `RewardRules/`, `Events/`, `Validation/`
- **Frontend**: `frontend/` — `app/`, `components/`, `lib/api.ts`, `store/`, `hooks/`
- **Rules**: `.cursor/rules/` — backend, frontend, validation-engine, testing, project-overview
- **Skills**: `.cursor/skills/` — validation-sql-rules, schema-configuration, testing-validation
- **Commands**: `.cursor/commands/` — add-unit-test, add-validation-rule, code-review, run-tests-and-fix, refactor-validation-engine

## Conventions

- **Correctness > cleverness**: Prefer explicit, debuggable code
- **Minimal diffs**: Avoid full rewrites unless requested
- **Highlight risks**: Concurrency, performance, failure modes
- **Senior audience**: Skip tutorial-style explanations

## Before Making Changes

1. Read relevant `.cursor/rules/*.mdc` for the affected area
2. For SQL rules: use `.cursor/skills/validation-sql-rules/SKILL.md`
3. For schema config: use `.cursor/skills/schema-configuration/SKILL.md`
4. For tests: use `.cursor/skills/testing-validation/SKILL.md` and `testing.mdc`

## Known Issues

- Zustand + Immer: Clone objects before passing to react-hook-form to avoid frozen reference errors
