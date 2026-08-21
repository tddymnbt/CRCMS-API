# API Reference — LWPH SIMS API

Generated from the controllers/DTOs in `apps/api/src` (58 routes). The interactive OpenAPI document is served by the app at `http://localhost:3001/api` (JSON: `/api-json`).

## Conventions

- **Base URL (local):** `http://localhost:3001`
- **Content type:** `application/json` for all requests/responses.
- **Success envelope** (most endpoints):

  ```json
  {
    "status": { "success": true, "message": "..." },
    "data": {},
    "meta": { "page": 1, "totalNumber": 100, "totalPages": 10, "displayPage": 10 }
  }
  ```

  `meta` appears only on paginated list endpoints.
- **Error shapes:**
  - Validation failures (HTTP 400, global `ValidationPipe` — unknown properties are rejected):

    ```json
    { "statusCode": 400, "message": ["email must be an email"], "error": "Bad Request" }
    ```

  - Business errors thrown by services keep the status envelope:

    ```json
    { "status": { "success": false, "message": "User not found" } }
    ```

- **Status codes:** `POST` create endpoints return **201**; everything else returns **200**. Documented error codes per endpoint below.
- **Authentication:** JWT bearer (`Authorization: Bearer <token>`) obtained via the login flow. **Currently only `POST /auth/logout` enforces the guard at runtime**; other endpoints declare bearer auth in Swagger but do not reject unauthenticated calls yet.
- **Path `:id` parameters are external IDs** (the public identifiers returned by the API), not serial PKs.

---

## Status

| Method | Route | Purpose | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/status` | Service health + version | 200 `{ "status": "Ok", "version": "2.0" }` | — |

---

## Authentication

| Method | Route | Purpose | Auth | Success | Errors |
| --- | --- | --- | --- | --- | --- |
| POST | `/auth/login` | Request OTP for an email | — | 200 | 400 validation |
| POST | `/auth/login/verify` | Validate OTP, get access token | — | 200 | 400 validation, 404 invalid/expired OTP or token |
| POST | `/auth/login/resend` | Re-issue OTP (invalidates previous token) | — | 200 | 400 validation |
| POST | `/auth/logout` | Revoke current bearer token | **Bearer required** | 200 | 400 validation, 401 missing/invalid/expired/revoked token |

**POST /auth/login** — body: `{ "email": "user@example.com" }`.
Response (identical whether or not the email is registered):

```json
{ "status": { "success": true, "message": "If the email exists, an OTP will be sent shortly.", "token": "<one-time token>" } }
```

**POST /auth/login/verify** — body: `{ "email", "otp", "token" }` (both values from the login step / email).
Response on success:

```json
{
  "status": { "success": true, "message": "Login verified" },
  "access": { "token": "<JWT>", "tokenExpiry": "2025-06-12 10:15:30" },
  "data": { "...user record..." }
}
```

**POST /auth/logout** — no body. Response: `{ "message": "Token revoked successfully" }`.

---

## Users

`:id` = user `external_id`.

| Method | Route | Purpose | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/users` | Paginated user list | 200 | 400 validation |
| GET | `/users/:id` | Single user (incl. role) | 200 | 404 `User not found` |
| POST | `/users` | Create user | 201 | 400 validation, 409 `Email address already exists` |
| PUT | `/users/:id` | Update user (partial) | 200 | 400, 404 |
| DELETE | `/users/:id` | Soft delete user | 200 | 400 `Deleted By is required`, 404 |
| PUT | `/users/update-role/:id` | Assign a role by name | 200 | 404 `Role not found.` / user not found, 409 `User was already assigned to this role.` |

**GET /users query params:** `searchValue?`, `isActive?` (`Y`/`N`, default `Y`), `pageNumber=1`, `displayPerPage=10`, `sortBy=first_name`, `orderBy=asc|desc`.

**POST /users body:** `first_name*`, `last_name*`, `email*` (valid email), `created_by*`; optional `updated_by`, `deleted_by`.

**PUT /users/:id body:** any subset of the create fields.

**DELETE /users/:id body:** `{ "deleted_by": "admin_user" }`.

**PUT /users/update-role/:id body:** `{ "roleName": "Admin", "updated_by": "admin_user" }`.

User record fields: `id`, `external_id`, `first_name`, `last_name`, `email`, `is_active`, `created_at/by`, `updated_at/by`, `deleted_at/by`, `last_login`, `role?` (`{ id, name }`).

---

## Clients

`:id` = client `external_id`.

| Method | Route | Purpose | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/clients` | Paginated client list | 200 | 400 validation |
| GET | `/clients/:id` | Single client (incl. bank details) | 200 | 404 `Client not found` |
| POST | `/clients` | Create client | 201 | 400 bank details required when consignor, 409 email already exists / duplicate details |
| PUT | `/clients/:id` | Update client (partial) | 200 | 400 `Updated By is required`, 404, 409 |
| DELETE | `/clients/:id` | Soft delete client | 200 | 400 `Deleted By is required` / `Cannot delete: existing transactions found.`, 404 |
| POST | `/clients/celebrant` | Active clients with birthday in given month | 200 (empty list if none) | 400 validation |
| GET | `/clients/stats/counts` | Client counts by period | 200 | — |

**GET /clients query params:** `searchValue?`, `isActive?` (`Y` default), `isConsignor?` (`Y`/`N`, default `N`), `pageNumber=1`, `displayPerPage=10`, `sortBy=first_name`, `orderBy=asc|desc`.

**POST /clients body:**

```json
{
  "first_name": "John",
  "middle_name": "Marquez",
  "last_name": "Cruz",
  "suffix": "Jr.",
  "birth_date": "1999-04-01",
  "email": "john.doe@example.com",
  "contact_no": "09123456789",
  "address": "Block 1, Street 2, City",
  "instagram": "https://www.instagram.com/test",
  "facebook": "https://www.facebook.com/test",
  "is_consignor": false,
  "created_by": "system",
  "bank": { "account_name": "TESTACCOUNT001", "account_no": "1234657890123", "bank": "BPI" }
}
```

Required: `first_name`, `last_name`, `birth_date` (ISO date), `contact_no`, `instagram`, `is_consignor`, `created_by`. Optional: `middle_name`, `suffix`, `email`, `address`, `facebook`, `bank`. When `is_consignor` is `true`, `bank` details are required (400 otherwise).

**PUT /clients/:id body:** any subset of the create fields plus required `updated_by`.

**DELETE /clients/:id body:** `{ "deleted_by": "admin_user" }`.

**POST /clients/celebrant body:** `{ "month": 6 }` (integer 1–12).

**GET /clients/stats/counts response `data`:** `totalCount`, `todayCount`, `yesterdayCount`, `lastWeekCount`, `lastMonthCount`, `lastYearCount` (string numbers).

---

## Products

`:id` = product `external_id`.

| Method | Route | Purpose | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/products` | Paginated product list with stock filters | 200 | 400 validation |
| GET | `/products/id/:id` | Product detail (condition, stock, refs) | 200 | 404 `Product not found` |
| POST | `/products` | Create product with condition + stock | 201 | 400 consignor requirements, 404 category/brand/authenticator/consignor not found, 409 `Product already exists` |
| PUT | `/products/id/:id` | Update product | 200 | 400 `Updated By is required`, 404 |
| DELETE | `/products/id/:id` | Soft delete product | 200 | 400 `Deleted By is required` / existing transactions, 404 |
| PUT | `/products/update-stock/id/:id` | Increase/decrease stock (records movement) | 200 | 400 quantity rules, 404 `Stock not found` |
| POST | `/products/id/:id/transactions` | Product transaction history (search body) | 200 | 404 product not found |
| GET | `/products/consignor/:id/items` | Items consigned by a client | 200 | 404 client not found |
| GET | `/products/stats/counts` | Product counts by period | 200 | — |

**GET /products query params:** `searchValue?`, `isConsigned?` (`Y`/`N`, default `N`), `isOutOfStock?` (`Y`/`N`, default `N`), `isLowStock?` (`Y`/`N`, default `N`), `pageNumber=1`, `displayPerPage=10`, `sortBy=name`, `orderBy=asc|desc`.

**POST /products body:**

```json
{
  "category_ext_id": "cAT123",
  "brand_ext_id": "bBR456",
  "name": "Louis Vuitton Speedy 25",
  "material": "Canvas",
  "hardware": "Gold",
  "code": "LV-SP25",
  "measurement": "25cm",
  "model": "Speedy 25",
  "auth_ext_id": "aAU789",
  "inclusion": ["Dust bag", "Receipt"],
  "images": ["https://..."],
  "condition": { "interior": "Clean", "exterior": "Minor scratches", "overall": "Good", "description": "..." },
  "stock": { "min_qty": 1, "qty_in_stock": 2 },
  "cost": 50000,
  "price": 90000,
  "is_consigned": true,
  "consignor_ext_id": "cCL001",
  "consignor_selling_price": 85000,
  "consigned_date": "2025-06-01",
  "created_by": "admin_user"
}
```

Required: `category_ext_id`, `brand_ext_id`, `name`, `code`, `condition`, `stock.qty_in_stock`, `cost`, `price`, `is_consigned`, `created_by`. Consigned products require `consignor_ext_id` (+ `consignor_selling_price`) — validated against an existing consignor client.

**PUT /products/id/:id body:** same shape as create (with `code` optional) but `updated_by*` instead of `created_by`.

**PUT /products/update-stock/id/:id body:** `{ "type": "increase" | "decrease", "qty": 1, "cost": 50000, "updated_by": "admin_user" }`. Quantity must be > 0; decrease cannot exceed available stock.

**POST /products/id/:id/transactions body:** `{ "searchValue?", "pageNumber": 1, "displayPerPage": 10, "sortBy": "created_at", "orderBy": "desc" }`.

**GET /products/consignor/:id/items query params:** `searchValue?`, `pageNumber=1`, `displayPerPage=10`, `sortBy=name`, `orderBy=asc|desc`.

**GET /products/stats/counts query param:** optional `isConsigned` (`Y`/`N`). Response `data` = same count fields as clients stats.

---

## Product Categories / Brands / Authenticators

Identical CRUD pattern under three prefixes: `/products/categories`, `/products/brands`, `/products/authenticators` (`:id` = record `external_id`).

| Method | Route (`<prefix>`) | Purpose | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `<prefix>` | List all | 200 | — |
| GET | `<prefix>/id/:id` | Single record | 200 | 404 |
| POST | `<prefix>` | Create | 201 | 400 validation, 409 already exists |
| PUT | `<prefix>/id/:id` | Rename | 200 | 400 `` `updated_by` is required``, 404, 409 |
| DELETE | `<prefix>/id/:id` | Soft delete | 200 | 400 `` `deleted_by` is required`` / existing transactions, 404 |

**POST body:** `{ "name": "Louis Vuitton", "created_by": "admin_user" }`.
**PUT body:** `{ "name": "Louis Vuitton", "updated_by": "admin_user" }`.
**DELETE body:** `{ "deleted_by": "admin_user" }`.

---

## Sales

Sale `type`: `R` = regular (fully paid at purchase), `L` = layaway. `:id` = sale `external_id` unless noted.

| Method | Route | Purpose | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/sales` | All sales (paginated) | 200 | 400 invalid date range |
| GET | `/sales/regular` | Regular sales | 200 | 400 |
| GET | `/sales/layaway` | Layaway sales | 200 | 400 |
| GET | `/sales/overdue` | Overdue layaways | 200 | 400 |
| GET | `/sales/consigned` | Sales containing consigned items | 200 | 400 |
| GET | `/sales/cancelled` | Cancelled sales | 200 | 400 |
| GET | `/sales/paid` | Fully paid sales | 200 | 400 |
| GET | `/sales/client/:id/transactions` | Sales of one client (`:id` = client ext id) | 200 | 400 |
| GET | `/sales/id/:id` | Sale detail (items, payments, layaway) | 200 | 404 |
| POST | `/sales` | Create sale | 201 | 400 business rules, 404 client/product not found |
| POST | `/sales/payment` | Record layaway payment | 200 | 400 payment rules, 404 not found/not layaway |
| POST | `/sales/cancel` | Cancel sale (restocks items) | 200 | 404 not found/already cancelled |
| PUT | `/sales/layaway/extend-due-date/:id` | Extend layaway due date | 200 | 400 rules, 404 |
| GET | `/sales/transaction/stats` | Aggregated sales statistics | 200 | 400 invalid date range |
| GET | `/sales/transaction/frequencies` | New vs repeat customer metrics | 200 | 400 validation |

**List query params (all listing routes):** `searchValue?`, `pageNumber=1`, `displayPerPage=10`, `sortBy=created_at`, `orderBy=asc|desc` (default `desc`), `dateFrom?`, `dateTo?` (`YYYY-MM-DD`; `dateFrom` must not be after `dateTo`).

**POST /sales body:**

```json
{
  "client_ext_id": "cCL001",
  "type": "L",
  "products": [{ "product_ext_id": "pPR001", "qty": 1 }],
  "layaway": { "no_of_months": 3, "due_date": "2025-09-01" },
  "is_discounted": false,
  "discount_percentage": "0",
  "discount_flat_rate": "0",
  "date_purchased": "2025-06-01",
  "payment": { "amount": "30000", "payment_date": "2025-06-01", "payment_method": "Cash" },
  "images": [],
  "created_by": "admin_user"
}
```

Rules: `type` must be `L` or `R`; `layaway` plan is required for `L` sales (initial deposit must not exceed total); discount fields must be provided when `is_discounted` is `true`; duplicate products in cart and insufficient stock are rejected (400).

**POST /sales/payment body:** `{ "sale_ext_id": "sSA001", "payment": { "amount": "10000", "payment_date": "2025-07-01", "payment_method": "Cash" }, "created_by": "admin_user" }`. Rejects fully paid/cancelled sales and payments exceeding the outstanding balance.

**POST /sales/cancel body:** `{ "sale_ext_id": "sSA001", "cancelled_by": "admin_user" }`.

**PUT /sales/layaway/extend-due-date/:id body:** `{ "due_date": "2025-10-01", "updated_by": "admin_user" }` — must be later than the current due date.

**GET /sales/transaction/stats query params:** `mode?` (`A` all (default) | `CN` consigned | `R` regular | `L` layaway), `dateFrom?`, `dateTo?`. Without dates the response includes period breakdowns (today/yesterday/last week/month/year); with dates only the range totals.

**GET /sales/transaction/frequencies query params:** `dateFrom?`, `dateTo?`. With both, only `customRange` is returned; otherwise predefined periods (`thisMonth`, `lastMonth`, `last6mos`, `lastYear`).

---

## Activity Logs

| Method | Route | Purpose | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/logs/activity` | Paginated audit trail | 200 | 400 validation |

**Query params:** `userExternalId?`, `module?`, `dateFrom?`, `dateTo?` (`YYYY-MM-DD`), `pageNumber=1`, `displayPerPage=10`.

Log item fields: `id`, `user_ext_id`, `user_name`, `module?`, `action?`, `description?`, `ref_id?`, `created_at`.

---

## RBAC

The RBAC module currently exposes **no HTTP routes** (`rbac.controller.ts` is empty). Roles/modules/permissions are managed via the seeder only.
