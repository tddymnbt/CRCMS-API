# Postman — LWPH SIMS API

How to use [`postman/collection.json`](./postman/collection.json), which covers all 58 API routes.

## Import

1. Open Postman (desktop or web).
2. **Import** → drag `docs/postman/collection.json` or use *File → Import*.
3. The collection appears as **LWPH SIMS API** with folders: Status, Authentication, Users, Clients, Products, Product Categories, Product Brands, Product Authenticators, Sales, Activity Logs.

## Environment Variables

The collection uses collection-level variables (no separate environment file required). Override them with a Postman environment if needed:

| Variable | Default | Purpose |
| --- | --- | --- |
| `baseUrl` | `http://localhost:3001` | API host + port. Change for UAT/prod deployments. |
| `token` | *(empty)* | JWT access token used as `Authorization: Bearer {{token}}`. |
| `userId` | sample value | `:id` for user endpoints (user `external_id`). |
| `clientId` | sample value | `:id` for client endpoints and client sale transactions. |
| `productId` | sample value | `:id` for product endpoints. |
| `saleId` | sample value | `:id` for sale detail / payment / cancel / extend-due-date. |
| `categoryId`, `brandId`, `authenticatorId` | sample values | `:id` for the misc product CRUD folders. |
| `consignorId` | sample value | Client `external_id` for consignor item listing. |

Replace the sample ID variables with real IDs returned by create/list calls. No credentials or secrets are stored in the collection.

## Configuring `baseUrl`

- Local run of the API (`npm run start:dev` in `apps/api`): keep `http://localhost:3001`.
- Docker Compose: the app listens on port 3001 inside the container; verify your port mapping before relying on the default.
- Deployed environments: set `baseUrl` to the environment URL (e.g. via a Postman environment with `baseUrl` overridden).

## Authentication

The API uses an email OTP flow; tokens are JWTs valid for 3600 seconds.

1. Run **Authentication → Login (request OTP)** with an existing user's email. The response contains `status.token` (a one-time token) and an OTP is emailed to the user via SMTP.
2. Run **Authentication → Verify OTP** with `{ email, otp, token }` from step 1. On success the response contains `access.token`.
3. Copy `access.token` into the collection variable `token` (collection → *Variables* tab → current/persistent value).
4. Every request in the collection then sends `Authorization: Bearer {{token}}`.

Notes:

- **Resend OTP** re-issues an OTP and invalidates the previous one-time token.
- **Logout** revokes the token server-side; it is currently the only endpoint that actually enforces authentication (401 on missing/invalid/expired/revoked tokens).

## Recommended Test Sequence

1. **Status → Get status** — confirm connectivity.
2. **Users → Create user** — provision a test account (or use an existing one for login).
3. **Authentication → Login** → check email for the OTP → **Verify OTP** → store `access.token` in `token`.
4. **Product Categories / Brands → Create** — create reference records; copy their `external_id` into `categoryId`/`brandId`.
5. **Clients → Create client** — copy `external_id` into `clientId`; optionally create a second client with `is_consignor: true` + bank details to use as `consignorId`.
6. **Products → Create product** using those reference IDs; copy its `external_id` into `productId`.
7. **Products → Update stock** — try `increase`, then `decrease`.
8. **Sales → Create sale** — regular (`type: "R"`) first, then layaway (`type: "L"`); copy the sale's `external_id` into `saleId`.
9. **Sales → Record payment**, **Extend layaway due date**, then list views (**List layaway sales**, **Transaction statistics**, **Customer purchase frequencies**).
10. **Sales → Cancel sale** — verify stock is restored via **Products → Get product**.
11. **Activity Logs → List activity logs** — confirm the audit trail recorded steps above.
12. Cleanup: delete requests for the created product/client/user; finally **Authentication → Logout** to revoke the token.

## Troubleshooting

- **400 with `message` array** — validation failure; unknown body properties are rejected (`forbidNonWhitelisted`). Compare against [API.md](./API.md).
- **404 on `:id` routes** — the path variable must be the record's `external_id`, not the numeric PK.
- **401 on Logout** — token missing/expired/revoked; log in again.
- **No OTP email arrives** — SMTP settings (`SMTP_*`) must be configured in `apps/api/.env`.
