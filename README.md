<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Rooeel Backend

A comprehensive backend service built with [NestJS](https://github.com/nestjs/nest) and [Prisma](https://www.prisma.io/) featuring role-based authentication, user management, change request workflows, project management, and complete CRUD operations.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Logging](#logging)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Admin Management Endpoints](#admin-management-endpoints)
  - [User Management Endpoints](#user-management-endpoints)
  - [Request Management Endpoints](#request-management-endpoints)
  - [Project Management Endpoints](#project-management-endpoints)
- [Authentication & Authorization](#authentication--authorization)
- [Error Handling](#error-handling)
- [Testing](#testing)

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v12 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
PORT=5000
LOG_LEVEL=debug
ENABLE_HTTP_LOGGING=true
JWT_SECRET=your-secret-key-here
```

**Environment Variables:**

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `PORT` | Server port | 5000 | No |
| `LOG_LEVEL` | Logging level (error, warn, log, debug, verbose) | debug | No |
| `ENABLE_HTTP_LOGGING` | Enable HTTP request/response logging | true | No |
| `JWT_SECRET` | Secret key for JWT token generation | - | Yes |

## Database Setup

Initialize your database schema using Prisma:

```bash
# Generate Prisma Client and run migrations
npx prisma migrate dev --name init

# Or if migrations already exist
npx prisma migrate deploy

# Open Prisma Studio to view/edit data
npx prisma studio
```

### Troubleshooting: User-Admin Assignment

If users encounter **"User does not have an assigned admin"** error, run:

```bash
npx ts-node src/scripts/fix-user-admin.ts
```

This assigns all users with `createdBy = null` to the first available admin.

## Running the Application

```bash
# Development mode with hot-reload
npm run start:dev

# Production mode
npm run start:prod

# Build
npm run build
```

The server runs on `http://localhost:5000` by default.

## Logging

The application uses a custom logger with colored output and timestamps.

**Configuration:**

```env
LOG_LEVEL=debug  # Options: error, warn, log, debug, verbose
ENABLE_HTTP_LOGGING=true  # Enable/disable HTTP request logging
```

**Log Levels:**
- `error` - Only errors
- `warn` - Warnings and errors
- `log` - General logs, warnings, and errors
- `debug` - Debug info, logs, warnings, and errors
- `verbose` - All messages including verbose output

---

## Database Schema

### Overview

The database consists of 4 main tables with relationships:

```
Admin (1) ──┬─── creates ───> User (N)
            ├─── creates ───> Project (N)
            └─── receives ──> UserRequest (N)

User (N) ───┬─── makes ─────> UserRequest (N)
            └─── assigned ──> ProjectUser (Join)

Project (N) ──── has ───────> ProjectUser (Join) ───> User (N)
```

### Admin Table

Stores administrator accounts who manage the system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `firstName` | String | Required | Admin's first name |
| `lastName` | String | Required | Admin's last name |
| `email` | String | Required, Unique | Admin's email address |
| `password` | String | Required | Hashed password |
| `createdAt` | DateTime | Default: now() | Account creation timestamp |

**Relations:**
- Has many `User` (one admin can create many users)
- Has many `Project` (one admin can create many projects)
- Has many `UserRequest` (one admin receives many requests)

---

### User Table

Stores regular user accounts created by admins.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `firstName` | String | Required | User's first name |
| `lastName` | String | Required | User's last name |
| `email` | String | Required, Unique | User's email address |
| `password` | String | Required | Hashed password |
| `createdAt` | DateTime | Default: now() | Account creation timestamp |
| `createdBy` | Integer | Foreign Key (Admin), Nullable | ID of admin who created this user |

**Relations:**
- Belongs to one `Admin` (creator)
- Has many `UserRequest` (user can make many requests)
- Has many `ProjectUser` (user can be assigned to many projects)

---

### UserRequest Table

Stores change requests made by users for their profile information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `userId` | Integer | Foreign Key (User), Indexed | User making the request |
| `adminId` | Integer | Foreign Key (Admin), Indexed | Admin who will review |
| `requestType` | String | Required | Type: 'firstName', 'lastName', 'email', 'password' |
| `currentValue` | String | Nullable | Current value (hidden for password) |
| `requestedValue` | String | Nullable | Requested value (hidden for password) |
| `status` | String | Default: 'pending', Indexed | Status: 'pending', 'approved', 'rejected' |
| `createdAt` | DateTime | Default: now() | Request creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last update timestamp |

**Relations:**
- Belongs to one `User`
- Belongs to one `Admin`

**Constraints:**
- Cascade delete on both user and admin

---

### Project Table

Stores projects created by admins.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `name` | String | Required | Project name |
| `description` | String | Nullable | Project description |
| `status` | String | Default: 'active', Indexed | Status: 'active', 'inactive', 'completed' |
| `createdBy` | Integer | Foreign Key (Admin), Indexed | Admin who created the project |
| `createdAt` | DateTime | Default: now() | Creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last update timestamp |

**Relations:**
- Belongs to one `Admin` (creator)
- Has many `ProjectUser` (users assigned to project)

---

### ProjectUser Table (Join Table)

Links users to projects.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `projectId` | Integer | Foreign Key (Project), Indexed | Project ID |
| `userId` | Integer | Foreign Key (User), Indexed | User ID |
| `assignedAt` | DateTime | Default: now() | Assignment timestamp |

**Constraints:**
- Unique constraint on `[projectId, userId]` - prevents duplicate assignments
- Cascade delete on project and user

**Purpose:**
- Links users to projects
- Tracks when users were assigned to projects

---

## API Documentation

Base URL: `http://localhost:5000`

All endpoints return JSON responses.

### Common Response Formats

**Success Response:**
```json
{
  "data": { ... },
  "message": "Success message"
}
```

**Error Response:**
```json
{
  "statusCode": 400,
  "message": "Error message or array of validation errors",
  "error": "Bad Request"
}
```

---

## Authentication Endpoints

### Admin Signup

Create a new admin account (first admin in the system).

**Endpoint:** `POST /auth/signup`

**Authentication:** Not required

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "admin@example.com",
  "password": "SecurePassword123"
}
```

**Validation Rules:**
- `firstName`: String, required, min 2 characters, max 50 characters
- `lastName`: String, required, min 2 characters, max 50 characters
- `email`: String, required, valid email format
- `password`: String, required, min 8 characters

**Success Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "admin@example.com"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed
- `409 Conflict` - Admin with this email already exists

**Example:**
```bash
curl -X POST http://localhost:5000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "admin@example.com",
    "password": "SecurePassword123"
  }'
```

---

### Login

Authenticate as admin or user.

**Endpoint:** `POST /auth/login`

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "admin"
}
```

**Validation Rules:**
- `email`: String, required, valid email format
- `password`: String, required
- `role`: String, required, must be either 'admin' or 'user'

**Success Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Invalid credentials

**Example:**
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123",
    "role": "admin"
  }'
```

---

### Logout

Logout current user (client-side token removal).

**Endpoint:** `POST /auth/logout`

**Authentication:** Required (JWT token)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:** None

**Success Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token

**Example:**
```bash
curl -X POST http://localhost:5000/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Admin Management Endpoints

> **Note:** All admin management endpoints require admin authentication.

### Create Admin

Create a new admin account (admin only).

**Endpoint:** `POST /admin`

**Authentication:** Required - Admin only

**Headers:**
```
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "password": "SecurePass456"
}
```

**Validation Rules:**
- `firstName`: String, required, min 2 characters, max 50 characters
- `lastName`: String, required, min 2 characters, max 50 characters
- `email`: String, required, valid email format, unique
- `password`: String, required, min 8 characters

**Success Response (201):**
```json
{
  "id": 2,
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "createdAt": "2025-12-26T10:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin
- `409 Conflict` - Email already exists

---

### Get All Admins

Retrieve all admin accounts (admin only).

**Endpoint:** `GET /admin`

**Authentication:** Required - Admin only

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "admin@example.com",
    "createdAt": "2025-12-25T10:00:00.000Z"
  },
  {
    "id": 2,
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "createdAt": "2025-12-26T10:00:00.000Z"
  }
]
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin

---

### Get Admin by ID

Retrieve a specific admin by ID (admin only).

**Endpoint:** `GET /admin/:id`

**Authentication:** Required - Admin only

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Success Response (200):**
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "admin@example.com",
  "createdAt": "2025-12-25T10:00:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin
- `404 Not Found` - Admin not found

---

### Update Admin

Update admin information (admin only).

**Endpoint:** `PATCH /admin/:id`

**Authentication:** Required - Admin only

**Headers:**
```
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "firstName": "John",
  "lastName": "Updated",
  "email": "newemail@example.com"
}
```

**Validation Rules:**
- `firstName`: String, min 2 characters, max 50 characters (if provided)
- `lastName`: String, min 2 characters, max 50 characters (if provided)
- `email`: String, valid email format, unique (if provided)

**Success Response (200):**
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Updated",
  "email": "newemail@example.com",
  "createdAt": "2025-12-25T10:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin
- `404 Not Found` - Admin not found
- `409 Conflict` - Email already exists

---

### Delete Admin

Delete an admin account (admin only).

**Endpoint:** `DELETE /admin/:id`

**Authentication:** Required - Admin only

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Success Response (200):**
```json
{
  "message": "Admin deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin
- `404 Not Found` - Admin not found

---

## User Management Endpoints

### Create User

Create a new user account (admin only).

**Endpoint:** `POST /user`

**Authentication:** Required - Admin only

**Headers:**
```
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "alice@example.com",
  "password": "UserPass123"
}
```

**Validation Rules:**
- `firstName`: String, required, min 2 characters, max 50 characters
- `lastName`: String, required, min 2 characters, max 50 characters
- `email`: String, required, valid email format, unique
- `password`: String, required, min 8 characters

**Success Response (201):**
```json
{
  "id": 5,
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "alice@example.com",
  "createdBy": 1,
  "createdAt": "2025-12-26T10:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin
- `409 Conflict` - Email already exists

---

### Get All Users

Retrieve all users (admin sees all, user sees only themselves).

**Endpoint:** `GET /user`

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200) - Admin:**
```json
[
  {
    "id": 5,
    "firstName": "Alice",
    "lastName": "Johnson",
    "email": "alice@example.com",
    "createdBy": 1,
    "createdAt": "2025-12-26T10:00:00.000Z"
  },
  {
    "id": 6,
    "firstName": "Bob",
    "lastName": "Smith",
    "email": "bob@example.com",
    "createdBy": 1,
    "createdAt": "2025-12-26T11:00:00.000Z"
  }
]
```

**Success Response (200) - User:**
```json
[
  {
    "id": 5,
    "firstName": "Alice",
    "lastName": "Johnson",
    "email": "alice@example.com",
    "createdBy": 1,
    "createdAt": "2025-12-26T10:00:00.000Z"
  }
]
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated

---

### Get User by ID

Retrieve a specific user by ID.

**Endpoint:** `GET /user/:id`

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "id": 5,
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "alice@example.com",
  "createdBy": 1,
  "createdAt": "2025-12-26T10:00:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - User not found

---

### Update User

Update user information (admin only).

**Endpoint:** `PATCH /user/:id`

**Authentication:** Required - Admin only

**Headers:**
```
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "firstName": "Alice",
  "lastName": "Updated",
  "email": "newemail@example.com"
}
```

**Validation Rules:**
- `firstName`: String, min 2 characters, max 50 characters (if provided)
- `lastName`: String, min 2 characters, max 50 characters (if provided)
- `email`: String, valid email format, unique (if provided)

**Success Response (200):**
```json
{
  "id": 5,
  "firstName": "Alice",
  "lastName": "Updated",
  "email": "newemail@example.com",
  "createdBy": 1,
  "createdAt": "2025-12-26T10:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin
- `404 Not Found` - User not found
- `409 Conflict` - Email already exists

---

### Delete User

Delete a user account (admin only).

**Endpoint:** `DELETE /user/:id`

**Authentication:** Required - Admin only

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Success Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin
- `404 Not Found` - User not found

---

### Reset User Password

Reset a user's password (admin only, must be the creator of the user).

**Endpoint:** `PATCH /user/:id/reset-password`

**Authentication:** Required - Admin only

**Headers:**
```
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "password": "NewSecurePassword123"
}
```

**Validation Rules:**
- `password`: String, required, min 8 characters

**Success Response (200):**
```json
{
  "id": 5,
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "alice@example.com",
  "createdBy": 1,
  "createdAt": "2025-12-26T10:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin or trying to reset password for a user created by another admin
- `404 Not Found` - User not found

---

## Request Management Endpoints

### Create Change Request

Create a request to change profile information (user only).

**Endpoint:** `POST /request`

**Authentication:** Required - User only

**Headers:**
```
Authorization: Bearer <user_access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "requestType": "email",
  "requestedValue": "newemail@example.com"
}
```

**Validation Rules:**
- `requestType`: String, required, must be one of: 'firstName', 'lastName', 'email', 'password'
- `requestedValue`: String, required for firstName/lastName/email, not required for password

**Success Response (201):**
```json
{
  "id": 1,
  "userId": 5,
  "adminId": 1,
  "requestType": "email",
  "currentValue": "alice@example.com",
  "requestedValue": "newemail@example.com",
  "status": "pending",
  "createdAt": "2025-12-26T10:00:00.000Z",
  "updatedAt": "2025-12-26T10:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed or user has no assigned admin
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a user

---

### Get User's Requests

Get all change requests made by the authenticated user (user only).

**Endpoint:** `GET /request`

**Authentication:** Required - User only

**Headers:**
```
Authorization: Bearer <user_access_token>
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "userId": 5,
    "adminId": 1,
    "requestType": "email",
    "currentValue": "alice@example.com",
    "requestedValue": "newemail@example.com",
    "status": "pending",
    "createdAt": "2025-12-26T10:00:00.000Z",
    "updatedAt": "2025-12-26T10:00:00.000Z"
  }
]
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a user

---

### Get Admin's Requests

Get all change requests for users created by the authenticated admin (admin only).

**Endpoint:** `GET /request/admin`

**Authentication:** Required - Admin only

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "userId": 5,
    "adminId": 1,
    "requestType": "email",
    "currentValue": "alice@example.com",
    "requestedValue": "newemail@example.com",
    "status": "pending",
    "createdAt": "2025-12-26T10:00:00.000Z",
    "updatedAt": "2025-12-26T10:00:00.000Z",
    "user": {
      "id": 5,
      "firstName": "Alice",
      "lastName": "Johnson",
      "email": "alice@example.com"
    }
  }
]
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin

---

### Approve Change Request

Approve a user's change request (admin only).

**Endpoint:** `PATCH /request/:id/approve`

**Authentication:** Required - Admin only

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Success Response (200):**
```json
{
  "id": 1,
  "userId": 5,
  "adminId": 1,
  "requestType": "email",
  "currentValue": "alice@example.com",
  "requestedValue": "newemail@example.com",
  "status": "approved",
  "createdAt": "2025-12-26T10:00:00.000Z",
  "updatedAt": "2025-12-26T10:30:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Request already processed
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin or not the assigned admin
- `404 Not Found` - Request not found

> **Note:** Approving a request automatically updates the user's information.

---

### Reject Change Request

Reject a user's change request (admin only).

**Endpoint:** `PATCH /request/:id/reject`

**Authentication:** Required - Admin only

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Success Response (200):**
```json
{
  "id": 1,
  "userId": 5,
  "adminId": 1,
  "requestType": "email",
  "currentValue": "alice@example.com",
  "requestedValue": "newemail@example.com",
  "status": "rejected",
  "createdAt": "2025-12-26T10:00:00.000Z",
  "updatedAt": "2025-12-26T10:30:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Request already processed
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin or not the assigned admin
- `404 Not Found` - Request not found

---

## Project Management Endpoints

### Create Project

Create a new project (admin only).

**Endpoint:** `POST /project`

**Authentication:** Required - Admin only

**Headers:**
```
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Website Redesign",
  "description": "Complete redesign of company website",
  "status": "active"
}
```

**Validation Rules:**
- `name`: String, required, min 3 characters, max 100 characters
- `description`: String, optional, max 500 characters
- `status`: String, optional, must be one of: 'active', 'inactive', 'completed', default: 'active'

**Success Response (201):**
```json
{
  "id": 2,
  "name": "Website Redesign",
  "description": "Complete redesign of company website",
  "status": "active",
  "createdBy": 1,
  "createdAt": "2025-12-26T10:00:00.000Z",
  "updatedAt": "2025-12-26T10:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin

---

### Get All Projects

Retrieve all projects (admin sees all their projects, user sees assigned projects).

**Endpoint:** `GET /project`

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
[
  {
    "id": 2,
    "name": "Website Redesign",
    "description": "Complete redesign of company website",
    "status": "active",
    "createdBy": 1,
    "createdAt": "2025-12-26T10:00:00.000Z",
    "updatedAt": "2025-12-26T10:00:00.000Z",
    "admin": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "admin@example.com"
    },
    "users": [
      {
        "id": 1,
        "projectId": 2,
        "userId": 5,
        "user": {
          "id": 5,
          "firstName": "Alice",
          "lastName": "Johnson",
          "email": "alice@example.com"
        },

        "assignedAt": "2025-12-26T10:30:00.000Z"
      }
    ]
  }
]
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated

---

### Get Project by ID

Retrieve a specific project by ID.

**Endpoint:** `GET /project/:id`

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "id": 2,
  "name": "Website Redesign",
  "description": "Complete redesign of company website",
  "status": "active",
  "createdBy": 1,
  "createdAt": "2025-12-26T10:00:00.000Z",
  "updatedAt": "2025-12-26T10:00:00.000Z",
  "admin": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "admin@example.com"
  },
  "users": [
    {
      "id": 1,
      "projectId": 2,
      "userId": 5,
      "user": {
        "id": 5,
        "firstName": "Alice",
        "lastName": "Johnson",
        "email": "alice@example.com"
      },

      "assignedAt": "2025-12-26T10:30:00.000Z"
    },
    {
      "id": 2,
      "projectId": 2,
      "userId": 6,
      "user": {
        "id": 6,
        "firstName": "Bob",
        "lastName": "Smith",
        "email": "bob@example.com"
      },

      "assignedAt": "2025-12-26T11:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Project not found

---

### Update Project

Update project information (admin only, must own the project).

**Endpoint:** `PATCH /project/:id`

**Authentication:** Required - Admin only

**Headers:**
```
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "status": "completed"
}
```

**Validation Rules:**
- `name`: String, min 3 characters, max 100 characters (if provided)
- `description`: String, max 500 characters (if provided)
- `status`: String, must be one of: 'active', 'inactive', 'completed' (if provided)

**Success Response (200):**
```json
{
  "id": 2,
  "name": "Updated Project Name",
  "description": "Updated description",
  "status": "completed",
  "createdBy": 1,
  "createdAt": "2025-12-26T10:00:00.000Z",
  "updatedAt": "2025-12-26T12:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin or not the project owner
- `404 Not Found` - Project not found

---

### Delete Project

Delete a project (admin only, must own the project).

**Endpoint:** `DELETE /project/:id`

**Authentication:** Required - Admin only

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Success Response (200):**
```json
{
  "message": "Project deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin or not the project owner
- `404 Not Found` - Project not found

---

### Assign User to Project

Assign a user to a project (admin only, must own the project).

**Endpoint:** `POST /project/:id/assign-user`

**Authentication:** Required - Admin only

**Headers:**
```
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": 5
}
```

**Validation Rules:**
- `userId`: Integer, required, must be a positive integer

**Success Response (200):**
```json
{
  "assignedUsers": [
    "Alice Johnson",
    "Bob Smith"
  ]
}
```

Returns the list of all users currently assigned to the project.

**Error Responses:**
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin or not the project owner
- `404 Not Found` - Project or user not found
- `409 Conflict` - User already assigned to this project

---

### Remove User from Project

Remove a user from a project (admin only, must own the project).

**Endpoint:** `DELETE /project/:id/remove-user/:userId`

**Authentication:** Required - Admin only

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Success Response (200):**
```json
{
  "assignedUsers": [
    "Bob Smith"
  ]
}
```

Returns the list of remaining users assigned to the project.

> **Note:** This operation is idempotent. Removing a user who is not assigned will succeed without error.

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin or not the project owner
- `404 Not Found` - Project not found

---



## Authentication & Authorization

### JWT Authentication

The API uses JWT (JSON Web Tokens) for authentication. After successful login, you receive an access token that must be included in subsequent requests.

**Token Format:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Payload:**
```json
{
  "email": "user@example.com",
  "sub": 1,
  "role": "admin",
  "iat": 1640000000,
  "exp": 1640086400
}
```

### Guards

The API uses three types of guards for authorization:

#### JwtAuthGuard

Base guard for JWT authentication without role checking. Use when both admins and users can access an endpoint.

```typescript
@UseGuards(JwtAuthGuard)
@Get()
findAll(@Request() req) {
  const role = req.user.role;
  // Filter results based on role
}
```

#### AdminGuard

Extends `JwtAuthGuard` and verifies the user has the 'admin' role.

```typescript
@UseGuards(AdminGuard)
@Post()
create(@Request() req, @Body() dto) {
  const adminId = req.user.userId;
  // Only admins can access
}
```

#### UserGuard

Extends `JwtAuthGuard` and verifies the user has the 'user' role.

```typescript
@UseGuards(UserGuard)
@Get('profile')
getProfile(@Request() req) {
  const userId = req.user.userId;
  // Only users can access
}
```

### Request Object

After authentication, the request object contains user information:

```typescript
req.user = {
  userId: 1,
  email: "user@example.com",
  role: "admin" // or "user"
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Validation failed or invalid request |
| 401 | Unauthorized | Authentication required or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists (e.g., duplicate email) |
| 500 | Internal Server Error | Server error |

### Error Response Format

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

**Validation Errors:**
```json
{
  "statusCode": 400,
  "message": [
    "email must be a valid email",
    "password must be at least 8 characters"
  ],
  "error": "Bad Request"
}
```

---

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## License

This project is [MIT licensed](LICENSE).
