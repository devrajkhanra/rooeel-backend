<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Rooeel Backend

A production-grade backend API built with [NestJS](https://github.com/nestjs/nest), [Prisma](https://www.prisma.io/), PostgreSQL, and Redis — containerised with Docker and designed for cloud deployment.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start with Docker](#quick-start-with-docker)
  - [Production Mode](#production-mode)
  - [Development Mode](#development-mode)
- [Environment Variables](#environment-variables)
- [Health Check](#health-check)
- [Database Setup](#database-setup)
- [Redis Caching](#redis-caching)
- [Logging](#logging)
- [Docker Reference](#docker-reference)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Admin Management Endpoints](#admin-management-endpoints)
  - [User Management Endpoints](#user-management-endpoints)
  - [Request Management Endpoints](#request-management-endpoints)
    - [Password Change (authenticated)](#post-request--create-change-request)
    - [Forgot Password (public)](#post-requestforgot-password--forgot-password-public)
    - [Generate Password (admin)](#post-requestidgenerate-password--generate-password-admin)
  - [Project Management Endpoints](#project-management-endpoints)
  - [Task Management Endpoints](#task-management-endpoints)
- [Authentication & Authorization](#authentication--authorization)
- [Error Handling](#error-handling)
- [Testing](#testing)

---

## Architecture

```
┌─────────────────────── rooeel-net (Docker bridge) ───────────────────────┐
│                                                                            │
│   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│   │   rooeel-api     │───▶│   rooeel-db      │    │  rooeel-redis    │   │
│   │   NestJS :5000   │    │  Postgres 17     │    │  Redis 7         │   │
│   │                  │───▶│  Volume: pgdata  │    │ Volume: redisdata│   │
│   └──────────────────┘    └──────────────────┘    └──────────────────┘   │
│           │                                                ▲               │
│           └────────────────────────────────────────────────┘               │
└────────────────────────────────────────────────────────────────────────────┘
         │
      :5000 ← only this port exposed to host (production)
      :5432, :6379 exposed to host in dev mode only
```

**Startup sequence**: `db` and `redis` must pass health checks before `api` starts. On first boot, `api` runs `prisma migrate deploy` automatically before the NestJS server comes up.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS 11 (Node.js 22) |
| ORM | Prisma 5 |
| Database | PostgreSQL 17 |
| Cache | Redis 7 + cache-manager v6 + @keyv/redis |
| Auth | JWT + Passport |
| Container | Docker + Docker Compose |
| Language | TypeScript 5 |

**API protocol choices by use case:**

| Use Case | Protocol |
|----------|----------|
| Complex dashboards | GraphQL (planned) |
| Standard CRUD | REST |
| Real-time events | WebSockets (planned) |
| File uploads | REST |
| Authentication | REST |

---

## Prerequisites

**For Docker (recommended):**
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) v24+

**For local development without Docker:**
- [Node.js](https://nodejs.org/) v22+
- [PostgreSQL](https://www.postgresql.org/) v17+
- [Redis](https://redis.io/) v7+

---

## Quick Start with Docker

### Step 1 — Create your `.env`

```powershell
# Windows
Copy-Item .env.example .env
```

```bash
# macOS / Linux
cp .env.example .env
```

Then open `.env` and change the secrets:

```env
JWT_SECRET=your_very_long_random_secret_here   # openssl rand -hex 64
POSTGRES_PASSWORD=your_db_password
REDIS_PASSWORD=your_redis_password
```

> **Important**: The `DATABASE_URL` in `.env` must use the internal Docker hostname `db` (not `localhost`) because the API runs inside Docker. The `.env.example` already sets this correctly.

---

### Production Mode

Runs all three services (`api`, `db`, `redis`) with no dev tools. Database and Redis ports are **not** exposed to the host — only the API port `5000` is.

```bash
# Build the image and start all services in background
docker compose up --build -d

# Follow logs
docker compose logs -f

# Follow only API logs
docker compose logs -f api

# Stop all services (data volumes are preserved)
docker compose down

# Stop and delete all data volumes (destructive!)
docker compose down -v
```

**Verify everything is healthy:**

```bash
docker compose ps
# Expected output:
# NAME           STATUS
# rooeel-api     Up (healthy)
# rooeel-db      Up (healthy)
# rooeel-redis   Up (healthy)
```

**Test the health endpoint:**

```bash
curl http://localhost:5000/health
# {"status":"ok","timestamp":"...","uptime":35,"version":"0.0.1","services":{"database":"up","redis":"up"}}
```

---

### Development Mode

Uses a Compose override that:
- Mounts your source code into the container (hot-reload via `nest start --watch`)
- Exposes **Postgres on `5432`** and **Redis on `6379`** to the host (for Prisma Studio, TablePlus, RedisInsight)
- Uses the `builder` stage instead of the `production` stage (includes dev dependencies)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

You can now run Prisma Studio from your host machine:

```bash
npx prisma studio
```

---

## Environment Variables

Copy `.env.example` to `.env` before starting. All variables are listed in `.env.example` with descriptions.

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Runtime environment | `production` | No |
| `PORT` | API server port | `5000` | No |
| `ENABLE_HTTP_LOGGING` | Log every HTTP request | `true` | No |
| `JWT_SECRET` | JWT signing secret — **must be changed** | — | **Yes** |
| `JWT_EXPIRY` | JWT token expiry | `7d` | No |
| `DATABASE_URL` | Full PostgreSQL connection string | — | **Yes** |
| `POSTGRES_USER` | Postgres username (used by the `db` container) | — | **Yes** |
| `POSTGRES_PASSWORD` | Postgres password — **must be changed** | — | **Yes** |
| `POSTGRES_DB` | Postgres database name | — | **Yes** |
| `REDIS_HOST` | Redis hostname (`redis` inside Docker) | `redis` | **Yes** |
| `REDIS_PORT` | Redis port | `6379` | No |
| `REDIS_PASSWORD` | Redis password — **must be changed** | — | **Yes** |
| `REDIS_TTL` | Default cache TTL in seconds | `300` | No |
| `RESEND_API_KEY` | Resend API key for sending emails | — | **Yes** |
| `RESEND_FROM_NAME` | From name for outgoing emails | `Rooeel` | No |
| `RESEND_FROM_EMAIL` | From email address (verified domain) | `onboarding@resend.dev` | No |
| `FRONTEND_URL` | Frontend URL for password reset links | `http://localhost:3000` | No |

> **Security note**: Never commit `.env` to version control. The `.gitignore` already excludes it.

---

## Health Check

The API exposes a `GET /health` endpoint that verifies connectivity to both PostgreSQL and Redis.

**Endpoint:** `GET /health`  
**Authentication:** Not required  

**Example response (all healthy):**
```json
{
  "status": "ok",
  "timestamp": "2026-05-14T17:14:20.720Z",
  "uptime": 35,
  "version": "0.0.1",
  "services": {
    "database": "up",
    "redis": "up"
  }
}
```

**Status values:**
| `status` | Meaning |
|----------|---------|
| `ok` | All services are up |
| `degraded` | One or more services are down |
| `error` | Critical failure |

This endpoint is used by Docker Compose health checks and cloud load balancers (AWS ALB, GCP GCLB, etc.).

---

## Database Setup

Prisma manages all schema migrations. In Docker, **migrations run automatically** before the API starts (`prisma migrate deploy`).

**For local development (outside Docker):**

```bash
# Create and apply a new migration
npx prisma migrate dev --name your_migration_name

# Apply pending migrations (production-safe, no interactive prompts)
npx prisma migrate deploy

# Regenerate the Prisma client after schema changes
npx prisma generate

# Open Prisma Studio (visual DB browser)
npx prisma studio
```

**Migration files are committed** to the repository under `src/prisma/migrations/`. This is intentional — migrations are the source of truth for your schema history.

### Troubleshooting: User-Admin Assignment

If users encounter **"User does not have an assigned admin"** errors:

```bash
npx ts-node src/scripts/fix-user-admin.ts
```

This assigns all users with `createdBy = null` to the first available admin.

---

## Redis Caching

Redis is wired into NestJS via `@nestjs/cache-manager` backed by `@keyv/redis` (cache-manager v6 pattern). The `RedisModule` is registered globally — inject `CACHE_MANAGER` in any service without re-importing.

**How to use cache in a service:**

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class MyService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async getData(id: string) {
    // Try cache first
    const cached = await this.cache.get<MyType>(`data:${id}`);
    if (cached) return cached;

    // Fetch from DB
    const data = await this.fetchFromDb(id);

    // Cache for 60 seconds (TTL in milliseconds)
    await this.cache.set(`data:${id}`, data, 60_000);

    return data;
  }

  async invalidate(id: string) {
    await this.cache.del(`data:${id}`);
  }
}
```

**Default TTL** is controlled by `REDIS_TTL` in your `.env` (default: 300 seconds).

---

## Logging

The application uses a custom structured logger with colored output and timestamps.

**Configuration:**

```env
ENABLE_HTTP_LOGGING=true   # Logs every HTTP request/response (method, path, status, duration)
```

**Log format:**
```
[2026-05-14 17:13:46] [LOG] [NestApplication] Nest application successfully started
[2026-05-14 17:13:47] [LOG] [HTTP] POST /auth/login 200 45ms
```

**Log levels** (set via NestJS logger — currently fixed at all levels in production):
- `error` — Only unhandled errors
- `warn` — Warnings + errors
- `log` — General info + above
- `debug` — Debug details + above
- `verbose` — All output

---

## Docker Reference

### File Overview

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build (`builder` → `production`). Uses `node:22-alpine`, installs `openssl` and `dumb-init`, runs as non-root `nestjs` user |
| `.dockerignore` | Excludes `node_modules`, `dist`, `.env`, test files, git history from build context |
| `docker-compose.yml` | Production: API + Postgres 17 + Redis 7 on private `rooeel-net` bridge network. Persistent named volumes. Health checks on all services |
| `docker-compose.dev.yml` | Dev override: exposes DB/Redis ports to host, mounts source for hot-reload, uses `builder` stage |
| `.env.example` | Template for all required environment variables |

### Dockerfile Stages

```
Stage 1: builder (node:22-alpine)
├── Install openssl
├── npm ci (all deps including devDependencies)
├── npx prisma generate (generates @prisma/client types)
└── npm run build (nest build → dist/)

Stage 2: production (node:22-alpine)  ← final image
├── Install dumb-init + openssl
├── npm ci --omit=dev (production deps only)
├── Copy src/prisma (schema for prisma generate)
├── npx prisma generate (generates client in prod image)
├── COPY dist/ from builder stage
├── Create non-root nestjs user (uid 1001)
└── ENTRYPOINT: dumb-init → prisma migrate deploy → node dist/main
```

### Useful Docker Commands

```bash
# View all container logs
docker compose logs -f

# Execute a command inside the running API container
docker compose exec api sh

# Run Prisma Studio from inside the container
docker compose exec api npx prisma studio

# Inspect a container's environment variables
docker compose exec api env

# View image size
docker images rooeel-backend-api

# Remove unused images/volumes (free disk space)
docker system prune -f

# Force rebuild from scratch (no cache)
docker compose build --no-cache
```

### Named Volumes

| Volume | Container Path | Purpose |
|--------|----------------|---------|
| `rooeel-pgdata` | `/var/lib/postgresql/data` | Postgres data — persists across container restarts |
| `rooeel-redisdata` | `/data` | Redis AOF persistence — survives restarts |

---

## Database Schema

### Overview

```
Admin (1) ──┬─── creates ────► User (N)
            ├─── creates ────► Project (N)
            └─── receives ───► UserRequest (N)

User (N) ───┬─── makes ──────► UserRequest (N)
            ├─── assigned ───► ProjectUser (Join)
            └─── assigned ───► Task (N)

Project (N) ──── has ────────► ProjectUser (Join) ──► User (N)
            └─── has ────────► Task (N)
```

### Admin Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | PK, Auto-increment | Unique identifier |
| `firstName` | String | Required | Admin's first name |
| `lastName` | String | Required | Admin's last name |
| `email` | String | Required, Unique | Admin's email |
| `password` | String | Required | Bcrypt-hashed password |
| `createdAt` | DateTime | Default: now() | Creation timestamp |

### User Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | PK, Auto-increment | Unique identifier |
| `firstName` | String | Required | First name |
| `lastName` | String | Required | Last name |
| `email` | String | Required, Unique | Email address |
| `password` | String | Required | Bcrypt-hashed password |
| `createdAt` | DateTime | Default: now() | Creation timestamp |
| `createdBy` | Integer | FK (Admin), Nullable | Admin who created this user |

### UserRequest Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | PK, Auto-increment | Unique identifier |
| `userId` | Integer | FK (User), Indexed | Requesting user |
| `adminId` | Integer | FK (Admin), Indexed | Reviewing admin |
| `requestType` | String | Required | `firstName`, `lastName`, `email`, `password` |
| `currentValue` | String | Nullable | Current value (hidden for password) |
| `requestedValue` | String | Nullable | Requested new value |
| `status` | String | Default: `pending`, Indexed | `pending`, `approved`, `rejected` |
| `createdAt` | DateTime | Default: now() | Creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last update |

### Project Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | PK, Auto-increment | Unique identifier |
| `name` | String | Required | Project name |
| `description` | String | Nullable | Project description |
| `status` | String | Default: `active`, Indexed | `active`, `inactive`, `completed` |
| `workOrderPdf` | String | Nullable | Path to uploaded work order PDF |
| `createdBy` | Integer | FK (Admin), Indexed | Creating admin |
| `createdAt` | DateTime | Default: now() | Creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last update |

### ProjectField Table

Dynamic fields for each project. Admin defines custom fields when creating a project.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | PK, Auto-increment | Unique identifier |
| `projectId` | Integer | FK (Project), Indexed | Parent project |
| `name` | String | Required | Field identifier (e.g., `clientName`, `siteAddress`) |
| `label` | String | Required | Display label (e.g., `Client Name`) |
| `fieldType` | String | Required | `text`, `number`, `date`, `select`, `textarea`, `file` |
| `options` | Json | Nullable | For `select` type: `[{ value: 'opt1', label: 'Option 1' }]` |
| `required` | Boolean | Default: false | Is field mandatory |
| `sortOrder` | Integer | Default: 0 | Display order |
| `createdAt` | DateTime | Default: now() | Creation timestamp |

### ProjectUser Table (Join)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | PK, Auto-increment | Unique identifier |
| `projectId` | Integer | FK (Project), Indexed | Project |
| `userId` | Integer | FK (User), Indexed | User |
| `assignedAt` | DateTime | Default: now() | Assignment timestamp |

Unique constraint on `[projectId, userId]` prevents duplicate assignments.

### Task Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | PK, Auto-increment | Unique identifier |
| `title` | String | Required | Task title |
| `description` | String | Nullable | Task description |
| `status` | String | Default: `pending` | `pending`, `accepted`, `in-progress`, `done` |
| `type` | String | Default: `basic` | `basic`, `form` |
| `formSchema` | Json | Nullable | Form field definitions (for `form` type) |
| `submissionData` | Json | Nullable | User's form submission |
| `projectId` | Integer | FK (Project), Indexed | Parent project |
| `assignedTo` | Integer | FK (User), Nullable, Indexed | Assigned user |
| `createdAt` | DateTime | Default: now() | Creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last update |

---

## API Documentation

**Base URL:** `http://localhost:5000`

All endpoints return JSON. Protected endpoints require `Authorization: Bearer <token>`.

### Common Response Formats

**Success:**
```json
{ "data": { ... }, "message": "Success message" }
```

**Error:**
```json
{ "statusCode": 400, "message": "Error description", "error": "Bad Request" }
```

---

## Authentication Endpoints

### POST /auth/signup — Admin Signup

Creates a new admin account. No authentication required.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "admin@example.com",
  "password": "SecurePassword123"
}
```

**Validation:** `firstName`/`lastName`: 2–50 chars | `email`: valid format | `password`: min 8 chars

**Success (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "admin": { "id": 1, "firstName": "John", "lastName": "Doe", "email": "admin@example.com" }
}
```

**Note:** The `refresh_token` is also set as an httpOnly cookie (7-day expiry).

**Errors:** `400` Validation failed | `409` Email already exists

```bash
curl -X POST http://localhost:5000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"admin@example.com","password":"SecurePassword123"}'
```

---

### POST /auth/login — Login

Authenticates admin or user and returns a JWT token.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "SecurePassword123",
  "role": "admin"
}
```

`role` must be `"admin"` or `"user"`.

**Success (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": { "id": 1, "firstName": "John", "email": "admin@example.com", "role": "admin" }
}
```

**Note:** The `refresh_token` is also set as an httpOnly cookie (7-day expiry).

**Errors:** `400` Validation | `401` Invalid credentials

---

### POST /auth/refresh — Refresh Access Token

**Auth:** Not required (uses refresh token from cookie)

Refreshes the access token using the refresh token from the httpOnly cookie.

**Success (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

**Note:** This also rotates the refresh token (old one is invalidated, new one issued).

**Errors:** `401` Invalid or expired refresh token

---

### POST /auth/logout — Logout

**Auth:** Required

Invalidates the refresh token in the database and clears the refresh token cookie.

**Success (200):**
```json
{
  "message": "Logout successful"
}
```

---

### POST /auth/user/login — User Login

Same as `/auth/login` but for user role. Returns access_token + sets refresh_token cookie.

**Success (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

---

### POST /auth/user/logout — User Logout

**Auth:** Required (user token)

Invalidates the refresh token in the database and clears the refresh token cookie.

**Success (200):**
```json
{
  "message": "Logout successful"
}
```

---

## Admin Management Endpoints

> All admin management endpoints require Admin JWT.

### GET /admin — List All Admins

Returns array of all admin accounts.

### GET /admin/:id — Get Admin

Returns a single admin by ID. `404` if not found.

### PATCH /admin/:id — Update Admin

**Request Body (all optional):**
```json
{ "firstName": "John", "lastName": "Updated", "email": "new@example.com" }
```

**Errors:** `404` Not found | `409` Email conflict

### DELETE /admin/:id — Delete Admin

Deletes an admin. Cascades to associated users and projects. `404` if not found.

---

## User Management Endpoints

### POST /user — Create User

**Auth:** Admin only

```json
{
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "alice@example.com",
  "password": "UserPass123"
}
```

**Success (201):** Returns user object with `createdBy` set to the creating admin's ID.

**Errors:** `403` Not admin | `409` Email conflict

---

### GET /user — List Users

**Auth:** Required  
Admin sees all users. User sees only themselves.

---

### GET /user/:id — Get User

**Auth:** Required. Returns user by ID. `404` if not found.

---

### PATCH /user/:id — Update User

**Auth:** Admin only. Partial update of user fields.

---

### DELETE /user/:id — Delete User

**Auth:** Admin only. Cascades to user's requests and project assignments.

---

### PATCH /user/:id/reset-password — Reset User Password

**Auth:** Admin only. Admin must have created the user (`createdBy` check).

**Request Body:**
```json
{ "password": "NewSecurePass123" }
```

**Errors:** `403` Admin did not create this user | `404` User not found

---

## Request Management Endpoints

Users can submit change requests for their profile fields. Admins review and action them.
There are two dedicated password flows:

| Flow | Who submits | Endpoint | Auth |
|------|------------|----------|------|
| **Password Change** | Logged-in user (knows current password) | `POST /request` | User JWT |
| **Forgot Password / Reset** | Anyone who knows their email | `POST /password-reset/forgot-password` | None |

For **both** password flows the admin actions the request by generating a random password via `POST /request/:id/generate-password`. The plain-text password is returned once — admin must share it with the user.

---

### POST /request — Create Change Request

**Auth:** User JWT required

Creates a change request for any profile field. For `requestType: "password"`, the user must verify their identity with `currentPassword`.

```json
{
  "requestType": "firstName",
  "requestedValue": "NewName"
}
```

**`requestType` values:**

| Type | `requestedValue` required | `currentPassword` required | Admin action |
|------|--------------------------|---------------------------|--------------|
| `firstName` | ✅ Yes | ❌ No | `approve` |
| `lastName` | ✅ Yes | ❌ No | `approve` |
| `email` | ✅ Yes | ❌ No | `approve` |
| `password` | ❌ No | ✅ Yes | `generate-password` |

**Example — password change (authenticated):**
```json
{
  "requestType": "password",
  "currentPassword": "MyCurrentPass123"
}
```

**Errors:** `400` Missing/wrong current password | `400` No admin assigned | `401` Not authenticated

```bash
# Submit a password change request (user must be logged in)
curl -X POST http://localhost:5000/request \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"requestType":"password","currentPassword":"MyCurrentPass123"}'
```

---

### POST /password-reset/forgot-password — Forgot Password (Public)

**Auth:** None required — fully public endpoint

User provides their email address. The system generates a secure reset token and sends a password reset link to their email.

```json
{ "email": "user@example.com" }
```

**Success (200):**
```json
{ "message": "If an account exists with this email, a password reset link has been sent." }
```

**Behaviour:**
- Always returns success message (prevents user enumeration)
- Reset link is valid for 1 hour
- Previous unused reset tokens are invalidated when a new request is made
- Link format: `{FRONTEND_URL}/reset-password?token={token}`

**Errors:** None (always returns success message)

```bash
# Forgot password — no token needed
curl -X POST http://localhost:5000/password-reset/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

---

### POST /password-reset/reset — Reset Password with Token

**Auth:** None required — fully public endpoint

User submits the reset token (from email link) along with their new password.

```json
{
  "token": "abc123def456...",
  "newPassword": "SecurePassword123"
}
```

**Success (200):**
```json
{ "message": "Password has been reset successfully. You can now log in with your new password." }
```

**Errors:**
- `400` Token has already been used
- `400` Token has expired
- `404` Invalid token

**Frontend integration:**
```javascript
// Extract token from URL and call reset endpoint
const params = new URLSearchParams(window.location.search);
const token = params.get('token');
// POST /password-reset/reset with token and newPassword
```

---

### GET /request — Get My Requests

**Auth:** User JWT required. Returns all requests made by the authenticated user (with admin info), newest first.

---

### GET /request/admin — Get All Requests (Admin View)

**Auth:** Admin JWT required. Returns all pending and processed requests directed to the authenticated admin (with user info), newest first.

---

### GET /request/:id — Get Single Request

No auth required. Returns a single request with both `user` and `admin` relations.

---

### POST /request/:id/generate-password — Generate Password (Admin)

**Auth:** Admin JWT required

The core admin action for both password flows. Generates a cryptographically random 12-character password (base64url charset), hashes it with bcrypt, saves it on the user, and marks the request as `approved`.

> ⚠️ The generated plain-text password is returned **exactly once**. It is never stored. The admin must communicate it to the user immediately.

**Request:** No body required — just the request ID in the path and the admin token in the header.

**Success (200):**
```json
{
  "message": "Password generated and applied successfully. Share this password with the user — it will not be shown again.",
  "generatedPassword": "TLJFbBFu4OWr",
  "requestId": 3,
  "userId": 2
}
```

**Errors:**
- `403` Request belongs to a different admin
- `400` Request is already `approved` or `rejected`
- `400` Request is not a password type (use `approve` for other fields)
- `404` Request not found

```bash
# Admin generates a password for request ID 3
curl -X POST http://localhost:5000/request/3/generate-password \
  -H "Authorization: Bearer <admin_token>"
```

**Complete Flow Example:**

```
1. User forgets password → POST /request/forgot-password  {email}
2. Admin sees new password_reset request in their queue → GET /request/admin
3. Admin generates a password → POST /request/3/generate-password
4. API returns { generatedPassword: "TLJFbBFu4OWr" }
5. Admin shares the password with the user (via email, chat, etc.)
6. User logs in with the new password → POST /auth/user/login
7. User immediately submits a password change request with the new password as currentPassword
   (optional best practice — change temp password immediately)
```

---

### PATCH /request/:id/approve — Approve Non-Password Request

**Auth:** Admin required. Applies `requestedValue` to the user's profile field and marks the request `approved`.

> ❌ Will return `400` if called on a `password` or `password_reset` request — use `generate-password` instead.

**Errors:** `403` Wrong admin | `400` Already processed | `400` Password request (use generate-password)

---

### PATCH /request/:id/reject — Reject Request

**Auth:** Admin required. Marks the request as `rejected` without modifying any user data. Works on all request types including password requests.

---

## Project Management Endpoints

### POST /project — Create Project

**Auth:** Admin required

Create a project with optional dynamic fields.

```json
{
  "name": "My Project",
  "description": "Optional description",
  "status": "active",
  "fields": [
    { "name": "clientName", "label": "Client Name", "fieldType": "text", "required": true, "sortOrder": 0 },
    { "name": "siteAddress", "label": "Site Address", "fieldType": "textarea", "required": true, "sortOrder": 1 },
    { "name": "contractValue", "label": "Contract Value", "fieldType": "number", "required": true, "sortOrder": 2 },
    { "name": "startDate", "label": "Start Date", "fieldType": "date", "required": false, "sortOrder": 3 },
    { "name": "workType", "label": "Work Type", "fieldType": "select", "options": [{ "value": "residential", "label": "Residential" }, { "value": "commercial", "label": "Commercial" }], "required": true, "sortOrder": 4 }
  ]
}
```

**Field Types:** `text`, `number`, `date`, `select`, `textarea`, `file`

For `select` type, provide `options` array with `value` and `label` objects.

---

### GET /project — List Projects

**Auth:** Required. Admin sees all projects. User sees only projects they're assigned to.

---

### GET /project/:id — Get Project

**Auth:** Required. Returns project with assigned users list.

---

### PATCH /project/:id — Update Project

**Auth:** Admin required.

```json
{ "name": "Updated Name", "status": "completed" }
```

---

### DELETE /project/:id — Delete Project

**Auth:** Admin required. Cascades to project users and tasks.

---

### POST /project/:id/assign-user — Assign User to Project

**Auth:** Admin required

```json
{ "userId": 5 }
```

**Errors:** `404` Project or user not found | `409` User already assigned

---

### DELETE /project/:id/remove-user/:userId — Remove User from Project

**Auth:** Admin required. `404` if assignment not found.

---

### POST /project/:id/work-order — Upload Work Order PDF

**Auth:** Admin required

Upload a PDF work order for the project.

**Content-Type:** `multipart/form-data`

```bash
curl -X POST http://localhost:5000/project/1/work-order \
  -H "Authorization: Bearer <admin_token>" \
  -F "file=@work-order.pdf"
```

**Success (200):** Returns updated project with `workOrderPdf` path.

**Errors:** `404` Project not found | `400` Only PDF files allowed

---

### PATCH /project/:id/fields — Update Project Fields

**Auth:** Admin required

Replace all existing fields with new ones.

```json
[
  { "name": "clientName", "label": "Client Name", "fieldType": "text", "required": true, "sortOrder": 0 },
  { "name": "contractValue", "label": "Contract Value", "fieldType": "number", "required": false, "sortOrder": 1 }
]
```

---

### GET /project/:id/fields — Get Project Fields

**Auth:** Required

Returns all dynamic fields for the project, sorted by `sortOrder`.

---

## Task Management Endpoints

### POST /task — Create Task

**Auth:** Admin required

```json
{
  "title": "Complete onboarding",
  "description": "Optional",
  "type": "basic",
  "projectId": 1,
  "assignedTo": 5
}
```

For `form` type, include `formSchema`:
```json
{
  "type": "form",
  "formSchema": {
    "fields": [
      { "name": "department", "type": "text", "label": "Department", "required": true }
    ]
  }
}
```

---

### GET /task — List Tasks

**Auth:** Required. Admin sees all tasks. User sees only their assigned tasks.

---

### GET /task/:id — Get Task

**Auth:** Required. Returns task with project and assignee info.

---

### PATCH /task/:id — Update Task

**Auth:** Required.
- Admin: can update any field including `status`, `assignedTo`, `formSchema`
- User: can update `status` and `submissionData` only

**Submit form data (user):**
```json
{
  "status": "done",
  "submissionData": { "department": "Engineering" }
}
```

---

### DELETE /task/:id — Delete Task

**Auth:** Admin required.

---

## Authentication & Authorization

The API uses JWT (JSON Web Tokens) with a dual-token system: **Access Token** for API requests and **Refresh Token** for maintaining sessions.

### Token Configuration

| Token Type | Expiry | Storage | Purpose |
|------------|--------|---------|---------|
| Access Token | 15 minutes (`JWT_ACCESS_EXPIRY`) | Client (Authorization header) | API authentication |
| Refresh Token | 7 days (`JWT_REFRESH_EXPIRY`) | httpOnly Cookie | Session maintenance |

### Environment Variables

```env
JWT_SECRET=your-secure-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

### Token Payload

```json
{
  "sub": 1,
  "email": "user@example.com",
  "role": "admin",
  "jti": "unique-token-id",
  "type": "access"
}
```

### Guards

- `JwtAuthGuard` — Verifies the JWT is valid, not expired, and not blacklisted
- Role checks are performed inside service methods based on the `role` in the token payload

### Token Usage

**Access Token (Authorization header):**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Refresh Token (Automatic):**
- Stored in httpOnly cookie on login
- Automatically sent with API requests
- Use `/auth/refresh` endpoint to get new access token when expired

### Authentication Flow

```
1. POST /auth/login → Returns access_token + refresh_token (cookie)
2. API Requests → Use access_token in Authorization header
3. Access Expired → POST /auth/refresh → New access_token + rotated refresh_token
4. POST /auth/logout → Clears cookie + revokes refresh token in database
```

### Security Features

- Token blacklist via Redis for immediate logout revocation
- Token rotation on refresh (old refresh token is revoked)
- Refresh tokens stored in database with expiry tracking
- httpOnly cookies prevent XSS attacks on refresh tokens

---

## Error Handling

All errors follow the NestJS standard error format:

| HTTP Status | Meaning |
|-------------|---------|
| `400` | Bad Request — validation failed or business rule violated |
| `401` | Unauthorized — missing or invalid JWT |
| `403` | Forbidden — authenticated but insufficient permissions |
| `404` | Not Found — resource does not exist |
| `409` | Conflict — duplicate unique field (email, project assignment) |
| `500` | Internal Server Error — unexpected error |

Global `ValidationPipe` is configured with:
- `whitelist: true` — strips unknown fields from request bodies
- `forbidNonWhitelisted: true` — returns 400 if unknown fields are sent
- `transform: true` — automatically transforms types (e.g. string `"1"` → number `1`)

---

## Testing

```bash
# Unit tests
npm run test

# Unit tests with watch mode
npm run test:watch

# Coverage report
npm run test:cov

# End-to-end tests
npm run test:e2e
```

> Note: E2E tests require a running database. Use `docker-compose.dev.yml` to expose the database port to the host for testing.
