# Architecture Document - Rooeel Backend

**Project:** Rooeel Backend API
**Date:** 2026-05-16
**Version:** 1.0
**Status:** Implemented & Documented

---

## 1. System Overview

### Purpose
A production-grade REST API backend for the Rooeel platform - a project and task management system supporting multiple user roles (Admin, User) with features including user management, project tracking with dynamic fields, task management, and request approval workflows.

### Scope
- RESTful API serving a React frontend
- PostgreSQL database for persistent storage
- Redis for caching and token management
- Docker containerization for deployment
- JWT-based authentication with refresh token rotation

### Architectural Drivers (Key NFRs)
- **Security**: JWT authentication with access/refresh tokens, role-based access control (AdminGuard, UserGuard)
- **Scalability**: Stateless API design, Redis caching layer, modular NestJS architecture
- **Maintainability**: Clear module boundaries, separation of concerns, TypeScript strict typing
- **Reliability**: Prisma ORM for database transactions, proper error handling with NestJS exceptions
- **Performance**: Redis caching via cache-manager, database indexing on foreign keys

---

## 2. Architecture Pattern

### Selected Pattern: Modular Monolith (Layered)

**Justification:**
- Level 2 complexity (medium) - multiple modules with clear boundaries but single deployable unit
- Team is in development stage - need rapid iteration without microservices overhead
- Single PostgreSQL database - no distributed transactions needed
- Can evolve to microservices later if needed - modules have clear interfaces

### Layer Separation
```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  Controllers (Auth, Admin, User, Project, Task, Request)   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                    │
│  Services (AuthService, UserService, ProjectService, etc.) │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                       Data Access Layer                      │
│  Prisma Service (ORM) - PostgreSQL                          │
│  Redis Service - Caching & Token Blacklisting               │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Component Design

### Core Modules

| Module | Responsibilities | Key Dependencies |
|--------|------------------|------------------|
| **AuthModule** | JWT authentication, login/signup, token refresh, logout | JwtStrategy, Passport, Redis |
| **AdminModule** | Admin CRUD, password management | Prisma, PasswordService |
| **UserModule** | User CRUD, profile management, password change | Prisma, AuthGuard |
| **ProjectModule** | Project CRUD, user assignment, dynamic fields, file upload | Prisma, File System |
| **TaskModule** | Task CRUD, assignment, form submissions | Prisma |
| **RequestModule** | Change requests (profile, password), admin approval workflow | Prisma, EmailService |
| **PasswordResetModule** | Token-based password reset flow | Prisma, EmailService |
| **RedisModule** | Caching, token blacklist | Redis, cache-manager |
| **LoggerModule** | HTTP request/response logging | CustomLogger |

### Component Boundaries

**AuthModule**
- Boundaries: Handles all authentication concerns, guards protect other modules
- Interfaces: POST /auth/login, POST /auth/signup, POST /auth/refresh, POST /auth/logout

**ProjectModule**
- Boundaries: Projects created by Admins, Users can be assigned to projects
- Interfaces: CRUD /project, POST /project/:id/assign, POST /project/:id/upload-work-order

**RequestModule**
- Boundaries: User requests → Admin approval workflow
- Interfaces: POST /request/create, GET /request (admin), PATCH /request/:id/approve|reject

---

## 4. Data Model

### Entity Relationship Summary

```
Admin (1) ────< User (M)
Admin (1) ────< Project (M)
Admin (1) ────< UserRequest (M)
User (1) ────< UserRequest (M)
User (M) ───< ProjectUser > (M) Project
Project (1) ───< Task (M)
Project (1) ───< ProjectField (M)
User (1) ───< Task (assignedTo)
```

### Storage Strategy

| Entity | Storage | Justification |
|--------|---------|---------------|
| Admin, User | PostgreSQL | Structured relational data, authentication |
| Project, Task, Request | PostgreSQL | Complex relationships, transactions |
| ProjectField | PostgreSQL | Dynamic schema per project |
| RefreshToken | PostgreSQL + Redis | Active tokens in Redis cache, persistent in DB |
| PasswordResetToken | PostgreSQL | Short-lived, needs durability |
| HTTP Cache | Redis | TTL-based expiration |

### Key Indexes
- User.email (unique)
- Admin.email (unique)
- UserRequest.status, userId, adminId
- Project.createdBy, status
- RefreshToken.expiresAt (cleanup)

---

## 5. API Specifications

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/login | Public | Login with email/password |
| POST | /auth/signup | Public | Register new admin |
| POST | /auth/refresh | Public (cookie) | Refresh access token |
| POST | /auth/logout | Access Token | Invalidate tokens |

### Admin Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /admin | Public | Create admin (signup) |
| GET | /admin/:id | Admin | Get admin profile |
| PATCH | /admin/:id | Admin | Update admin profile |
| PATCH | /admin/:id/reset-password | Admin | Reset user password |

### User Endpoints (AdminGuard required)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /user | Admin | Create user |
| GET | /user | Admin | List all users |
| GET | /user/:id | Admin | Get user |
| PATCH | /user/:id | Admin | Update user |
| DELETE | /user/:id | Admin | Delete user |
| PATCH | /user/me/profile | User | Update own profile |
| PATCH | /user/me/change-password | User | Change own password |

### Project Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /project | Admin | Create project |
| GET | /project | User/Admin | List projects (filtered by role) |
| GET | /project/:id | User/Admin | Get project |
| PATCH | /project/:id | Admin | Update project |
| DELETE | /project/:id | Admin | Delete project |
| POST | /project/:id/assign | Admin | Assign user |
| DELETE | /project/:id/remove-user | Admin | Remove user |
| POST | /project/:id/upload-work-order | Admin | Upload PDF |
| PUT | /project/:id/fields | Admin | Update dynamic fields |
| GET | /project/:id/fields | User/Admin | Get fields |

### Task Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /task | Admin | Create task |
| GET | /task | User/Admin | List tasks |
| GET | /task/:id | User/Admin | Get task |
| PATCH | /task/:id | Admin/User | Update task (status) |
| DELETE | /task/:id | Admin | Delete task |

### Request Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /request/create | User | Create change request |
| GET | /request | Admin | List pending requests |
| GET | /request/:id | User/Admin | Get request |
| PATCH | /request/:id/approve | Admin | Approve request |
| PATCH | /request/:id/reject | Admin | Reject request |
| POST | /request/forgot-password | Public | Request password reset |
| POST | /request/reset-password | Public | Reset with token |

### Request/Response Formats

**Authentication**
```json
// POST /auth/login
{ "email": "string", "password": "string" }

// Response
{ "accessToken": "string", "user": { "id": "number", "email": "string", "role": "string" } }
```

**Project with Dynamic Fields**
```json
// POST /project
{
  "name": "string",
  "description": "string",
  "status": "active|inactive|completed",
  "fields": [
    { "name": "clientName", "label": "Client Name", "fieldType": "text", "required": true }
  ]
}
```

---

## 6. NFR Mapping

| NFR Category | Architectural Decisions |
|--------------|------------------------|
| **Performance** | - Redis caching via cache-manager v6<br>- Database indexes on foreign keys<br>- CDN ready (static uploads served separately) |
| **Scalability** | - Stateless JWT authentication<br>- Horizontal scaling via Docker/K8s<br>- Redis for session/caching<br>- Modular monolith allows future microservices |
| **Security** | - JWT access tokens (15min expiry)<br>- Refresh tokens (7d expiry, httpOnly cookies)<br>- bcrypt password hashing<br>- Role-based guards (AdminGuard, UserGuard)<br>- Token blacklist in Redis<br>- Input validation with class-validator |
| **Reliability** | - Prisma ORM for type-safe queries<br>- PostgreSQL transactions<br>- NestJS dependency injection<br>- Global exception filters<br>- Docker health checks |
| **Maintainability** | - Modular NestJS architecture<br>- Clear separation: Controllers → Services → Prisma<br>- TypeScript strict mode<br>- DTOs for request validation<br>- Custom logger service |
| **Availability** | - Docker containerization<br>- Health check endpoints (Prisma, Redis)<br>- Graceful shutdown handling<br>- Volume persistence for PostgreSQL and Redis |

---

## 7. Technology Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Runtime** | Node.js 22 | Modern async I/O, NestJS requirement |
| **Framework** | NestJS 11 | Dependency injection, modular architecture, TypeScript first |
| **Language** | TypeScript 5 | Type safety, better IDE support |
| **ORM** | Prisma 5 | Type-safe queries, migrations, schema management |
| **Database** | PostgreSQL 17 | ACID compliance, complex queries, JSON support |
| **Cache** | Redis 7 | Token blacklist, HTTP caching, session store |
| **Auth** | Passport.js + JWT | Industry standard, access/refresh token rotation |
| **Container** | Docker + Docker Compose | Reproducible deployments, local development |
| **Email** | Resend API | Transactional emails (password reset) |

---

## 8. Trade-off Analysis

### Key Decisions & Trade-offs

| Decision | Trade-off | Rationale |
|----------|-----------|-----------|
| Modular Monolith vs Microservices | Lose independent deployability, gain simpler development | Level 2 complexity doesn't warrant microservices overhead yet |
| PostgreSQL vs NoSQL | Less flexible schema, gain ACID transactions | Complex relationships (projects → fields → users) require relational integrity |
| JWT vs Session | Stateless scalability vs token invalidation complexity | JWT scales horizontally; refresh tokens solve rotation |
| Redis Cache vs No Cache | Additional infrastructure, gain response speed | Frequent lookups (user, project) benefit from caching |
| file uploads to disk vs S3 | Simplicity now, migration needed later | MVP approach; S3 can be added without changing API |

### Future Considerations

| Aspect | Migration Path |
|--------|----------------|
| File Storage | Move to AWS S3 / Cloudflare R2 |
| Microservices | Extract modules to separate services with API gateway |
| Real-time | Add WebSocket gateway for task notifications |
| GraphQL | Add GraphQL layer for complex queries |
| Multi-region | Deploy to AWS/GCP with read replicas |

---

## 9. Deployment Architecture

### Development Mode
```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Bridge Network                  │
│                                                              │
│   ┌──────────────┐    ┌─────────────┐    ┌──────────────┐  │
│   │   API        │───▶│  PostgreSQL │    │    Redis     │  │
│   │  (NestJS)    │    │   (5432)    │    │   (6379)     │  │
│   │   :5000      │    └─────────────┘    └──────────────┘  │
│   └──────────────┘                                            │
│         │                                                     │
│    :5000 (exposed to host)                                   │
└─────────────────────────────────────────────────────────────┘
```

### Production Mode
```
┌─────────────────────────────────────────────────────────────┐
│                     Cloud Environment                        │
│                                                              │
│   ┌──────────────┐    ┌─────────────┐    ┌──────────────┐  │
│   │   API        │───▶│  PostgreSQL │    │    Redis     │  │
│   │  (Container) │    │   (RDS)     │    │  (ElastiCache)│ │
│   └──────────────┘    └─────────────┘    └──────────────┘  │
│         │                                                     │
│   ┌──────────────┐                                            │
│   │ Load Balancer│                                            │
│   └──────────────┘                                            │
```

### Docker Compose Services
- **api**: NestJS application (port 5000)
- **db**: PostgreSQL 17 with persistent volume
- **redis**: Redis 7 with persistent volume

---

## 10. Functional Requirements Summary

### Implemented Features

| ID | Requirement | Status |
|----|-------------|--------|
| FR-001 | Admin signup and authentication | Implemented |
| FR-002 | JWT login with access/refresh tokens | Implemented |
| FR-003 | Admin user management (CRUD) | Implemented |
| FR-004 | User profile management | Implemented |
| FR-005 | Project CRUD with dynamic fields | Implemented |
| FR-006 | Project-user assignment | Implemented |
| FR-007 | Work order PDF upload | Implemented |
| FR-008 | Task CRUD with assignment | Implemented |
| FR-009 | Form-type tasks with submission data | Implemented |
| FR-010 | Change request workflow (profile changes) | Implemented |
| FR-011 | Admin approval/rejection of requests | Implemented |
| FR-012 | Password reset via email token | Implemented |
| FR-013 | Role-based access control | Implemented |
| FR-014 | HTTP request logging | Implemented |

---

## Appendix: Module Structure

```
src/
├── admin/           # Admin management
├── auth/            # JWT authentication, guards
├── user/            # User management
├── project/         # Project + dynamic fields + file upload
├── task/            # Task management
├── request/         # Change requests + approval workflow
├── password-reset/  # Token-based password reset
├── prisma/          # Database service
├── redis/           # Caching service
├── logger/          # HTTP logging
└── common/          # Shared services (password, email)
```