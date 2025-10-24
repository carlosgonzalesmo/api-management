# Copilot Instructions for AI Agents

## Project Overview
- This is a NestJS (Node.js/TypeScript) monorepo for API management, featuring modular architecture for endpoints, executions, scheduling, and authentication.
- Key directories:
  - `src/modules/` — Main business logic, organized by domain (auth, endpoints, executions, scheduler, schedules).
  - `src/config/` — Centralized configuration and validation logic.
  - `src/migrations/` — TypeORM migration scripts for database schema changes.
  - `test/` — End-to-end tests using Jest.

## Architecture & Patterns
- Each domain module (e.g., `endpoints`, `executions`, `schedules`) contains its own controller, service, entity, and DTOs for clear separation of concerns.
- Data access is managed via TypeORM entities (e.g., `endpoint.entity.ts`, `execution.entity.ts`).
- Guards (e.g., `app.guard.ts`, `api-key.guard.ts`) enforce authentication and authorization.
- Configuration is loaded and validated via `src/config/configuration.ts` and `src/config/validation.ts`.
- Cross-module communication is handled via NestJS dependency injection and service imports in module files.

## Developer Workflows
- **Install dependencies:** `npm install`
- **Run in development:** `npm run start:dev`
- **Run in production:** `npm run start:prod`
- **Run migrations:** `npm run typeorm migration:run` (see `typeorm.config.ts` for config)
- **Run tests:**
  - Unit: `npm run test`
  - E2E: `npm run test:e2e` (see `test/app.e2e-spec.ts`)
  - Coverage: `npm run test:cov`
- **Debugging:** Use VS Code launch configs or `npm run start:debug` if defined in `package.json`.
- **Docker:** Use `docker-compose.yml` for multi-service orchestration (if present).

## Project-Specific Conventions
- DTOs are always in a `dto/` subfolder within each module.
- Migration files are timestamp-prefixed for ordering.
- All business logic should reside in services, not controllers.
- Use guards for all authentication/authorization logic.
- Use `config` and `validation` modules for all environment/config checks.

## Integration Points
- Database: Managed via TypeORM, configured in `typeorm.config.ts`.
- Auth: API key guard in `modules/auth/api-key.guard.ts`.
- Scheduling: Scheduler logic in `modules/scheduler/` and `modules/schedules/`.

## Examples
- To add a new endpoint, create a new entity, DTO, service, and controller in `modules/endpoints/`.
- To add a migration, create a new timestamped file in `src/migrations/` and update entities as needed.

## References
- See `README.md` for basic setup and commands.
- See `SISTEMA.md` (if present) for system-level documentation.

---
For any unclear or missing conventions, review the structure of existing modules or ask for clarification.
