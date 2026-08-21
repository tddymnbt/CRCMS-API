# LWPH SIMS API — Documentation

Documentation for the **LWPH SIMS** backend (`apps/api`, package `lwphsims-api` v2.0): a NestJS REST API for managing users, clients (including consignors), luxury-goods product inventory, and sales (regular, layaway and consigned), with OTP-based authentication and an RBAC foundation.

> Source of truth for these documents is the code itself (`apps/api/src`). If a document and the code disagree, the code wins.

## Documents

| File | Contents |
| --- | --- |
| [README.md](./README.md) | Project overview, setup, configuration, commands |
| [ERD.md](./ERD.md) | Database schema: tables, keys, relationships |
| [API.md](./API.md) | HTTP API reference (all 58 routes) |
| [POSTMAN.md](./POSTMAN.md) | How to use the Postman collection |
| [postman/collection.json](./postman/collection.json) | Importable Postman v2.1 collection |

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** NestJS 10 (Express platform)
- **Database:** PostgreSQL via TypeORM 0.3 (migrations only, `synchronize: false`)
- **Auth:** JWT (`@nestjs/jwt` + Passport) with email OTP delivery over SMTP (Nodemailer)
- **Validation:** `class-validator` / `class-transformer` via a global `ValidationPipe`
- **API docs:** `@nestjs/swagger` (OpenAPI 3.0 UI served by the app)
- **Tests:** Jest (+ ts-jest); linting via ESLint + Prettier (husky + lint-staged pre-commit)

## Architecture

The app lives in `apps/api/src` and follows a modular, DDD-flavoured layout:

```
src/
├── main.ts                  # Bootstrap: CORS whitelist, Swagger (/api), global ValidationPipe, port 3001
├── app.module.ts            # Root module (ConfigModule, TypeORM, feature modules)
├── config/typeorm.ts        # TypeORM DataSource options from env vars
├── database/data-source.ts  # CLI data source for TypeORM migration commands
├── migrations/              # SQL migrations (initial schema: 22 tables)
├── common/
│   ├── swagger/             # Shared response/error DTOs + Swagger decorators
│   ├── seeder/              # Seeds roles/modules/permissions on boot
│   └── email/               # Nodemailer SMTP service (OTP emails)
└── modules/
    ├── authentications/     # Login + OTP verify/resend, logout/token revocation, JWT strategy
    ├── users/               # User CRUD + role assignment
    ├── rbac/                # Roles, permissions, modules entities (no HTTP routes yet)
    ├── clients/             # Client CRUD, consignors, birthday celebrants, stats
    ├── products/            # Products, stocks, movements + brands/categories/authenticators
    ├── sales/               # Sales (regular/layaway/consigned), payments, cancellations, stats
    ├── activity_logs/       # Audit trail of user actions
    └── status/              # Health/version endpoint
```

Each feature module is split into `application` (services, DTOs), `domain` (entities, repository ports) and `infrastructure` (TypeORM repositories/controllers wiring).

## Modules / Features

| Module | Highlights |
| --- | --- |
| **Authentication** | Email → OTP (SMTP) → JWT access token (3600 s expiry). Tokens are persisted and revoked on logout. |
| **Users** | CRUD + soft delete, search/sort/pagination, role assignment (`Admin`/`Staff` seeded). |
| **RBAC** | Roles / modules / permissions tables + seeder. No HTTP endpoints yet. |
| **Clients** | CRUD + soft delete, consignor flag (bank details required for consignors), birthday celebrants lookup, count stats. |
| **Products** | CRUD + soft delete with nested condition & stock creation, stock adjustments (increase/decrease) recorded as movements, per-product transaction history, consignor item listing, count stats. Plus CRUD for brands, categories and authenticators. |
| **Sales** | Create regular (`R`) or layaway (`L`) sales, record payments, cancel (restocks items), extend layaway due dates, multiple filtered listings, transaction statistics and customer purchase frequency metrics. |
| **Activity logs** | Paginated audit trail written by other modules on create/update/delete. |

## Database Overview

- PostgreSQL; connection configured through `DATABASE_*` env vars (`src/config/typeorm.ts`).
- Schema managed exclusively by migrations (`npm run migration:run`); initial migration creates **22 tables**.
- Domain tables reference each other by `*_ext_id` columns (public nanoid-style identifiers). Only auth/RBAC/log tables have real database foreign keys — see [ERD.md](./ERD.md).
- On boot, `SeederService` inserts default RBAC rows when the tables are empty: roles `Admin`/`Staff`, 5 modules, 20 `Module.action` permissions, and role-permission mappings (Admin = all, Staff = read/update).

## API Overview

- Interactive OpenAPI docs: **`http://localhost:3001/api`** (JSON at `/api-json`).
- All responses use a `{ status: { success, message }, data?, meta? }` envelope; validation failures return the standard NestJS `{ statusCode, message[], error }` body with HTTP 400.
- Full endpoint reference: [API.md](./API.md).

### Authentication

1. `POST /auth/login` with `{ email }` → sends an OTP to the user's email and returns a one-time `token`.
2. `POST /auth/login/verify` with `{ email, otp, token }` → returns a JWT access token (valid 3600 s).
3. Call protected operations with `Authorization: Bearer <token>`.
4. `POST /auth/logout` (requires the bearer token) revokes the token.

> **Note:** the `JwtAuthGuard` is currently enabled only on `POST /auth/logout`. Other controllers declare bearer auth in Swagger but do not enforce it at runtime yet.

## Configuration

Create `apps/api/.env` (loaded by `dotenv`; also consumed by Docker Compose from the repo root):

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_HOST` | Yes | PostgreSQL host |
| `DATABASE_PORT` | Yes | PostgreSQL port (defaults to 5432 if unset/invalid) |
| `DATABASE_USERNAME` | Yes | Database user |
| `DATABASE_PASSWORD` | Yes | Database password |
| `DATABASE_NAME` | Yes | Database name |
| `JWT_SECRET` | Yes | Secret used to sign/verify access tokens |
| `SMTP_HOST` | Yes (login flow) | SMTP server for OTP emails |
| `SMTP_PORT` | Yes (login flow) | SMTP port |
| `SMTP_USERNAME` | Yes (login flow) | SMTP user |
| `SMTP_PASSWORD` | Yes (login flow) | SMTP password |
| `SMTP_FROM` | Yes (login flow) | From address for OTP emails |

No secrets or credentials are stored in this repository.

## Running the Application

```bash
# from apps/api
npm install

# ensure PostgreSQL is reachable and configured in .env, then apply the schema
npm run migration:run

# development (watch mode)
npm run start:dev

# production
npm run build
npm run start:prod        # node dist/main
```

The API listens on **port 3001** (`main.ts`); Swagger UI at `http://localhost:3001/api`.

Docker option (repo root): `docker-compose up --build` builds `apps/api` and loads `./.env`. Note that Compose maps host port `3000` to container port `3000`, while the app listens on `3001` inside the container — adjust before relying on it.

## Build, Test, Lint

```bash
npm run build       # compile to dist/
npm run test        # unit tests (Jest)
npm run test:watch  # watch mode
npm run test:cov    # coverage
npm run lint        # ESLint (--fix)
npm run format      # Prettier
```

## Migrations

```bash
npm run migration:run      # apply pending migrations
npm run migration:revert   # revert last migration
npm run migration:show     # list migrations and status
npm run migration:generate # generate diff from entities (requires reachable DB)
```

## Development Notes

- Global `ValidationPipe` uses `whitelist`, `forbidNonWhitelisted` and `forbidUnknownValues`: unknown properties are rejected with HTTP 400.
- Deletes are soft (`deleted_at` / `deleted_by`) across domain tables; several delete/update endpoints require an audit field such as `deleted_by` in the body.
- Activity logging is performed inline by application services after successful mutations.
- Pre-commit hooks run ESLint, Prettier and `tsc --noEmit` on staged `.ts` files (husky + lint-staged).
