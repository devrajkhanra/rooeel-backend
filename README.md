<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Rooeel Backend

A comprehensive backend service built with [NestJS](https://github.com/nestjs/nest) and [Prisma](https://www.prisma.io/) featuring authentication, user management, change requests, and project management.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Logging](#logging)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
  - [Authentication](#authentication-endpoints)
  - [Admin Management](#admin-management-endpoints)
  - [User Management](#user-management-endpoints)
  - [Request Management](#request-management-endpoints)
  - [Project Management](#project-management-endpoints)
  - [Designation Management](#designation-management-endpoints)
- [Authentication & Authorization](#authentication--authorization)
- [Testing](#testing)

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [PostgreSQL](https://www.postgresql.org/)

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
# Development mode
npm run start:dev

# Production mode
npm run start:prod

# Build
npm run build
```

The server runs on `http://localhost:5000` by default.

## Logging

The application uses a custom logger with colored output and timestamps.

### Configuration

```env
LOG_LEVEL=debug  # Options: error, warn, log, debug, verbose
ENABLE_HTTP_LOGGING=true
```

### Log Format

```
[2025-12-24 18:48:45] [INFO] [AuthService] Admin admin@test.com logged in successfully
[2025-12-24 18:48:46] [HTTP] POST /user 201 - 45ms
[2025-12-24 18:48:47] [DEBUG] [UserService] Creating user: testuser@example.com
```

---

## Database Schema

### Admin Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `firstName` | String | Required | Admin's first name |
| `lastName` | String | Required | Admin's last name |
| `email` | String | Required, Unique | Admin's email address |
| `password` | String | Required | Hashed password |
| `createdAt` | DateTime | Default: now() | Account creation timestamp |

**Relations:**
- One admin can create many users (`users`)
- One admin can receive many requests (`requests`)
- One admin can create many projects (`projects`)

### User Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `firstName` | String | Required | User's first name |
| `lastName` | String | Required | User's last name |
| `email` | String | Required, Unique | User's email address |
| `password` | String | Required | Hashed password |
| `createdBy` | Integer | Foreign Key (Admin), Nullable | ID of admin who created this user |
| `createdAt` | DateTime | Default: now() | Account creation timestamp |

**Relations:**
- Belongs to one admin (`admin`)
- Can make many requests (`requests`)
- Can be assigned to many projects (`projects` via `ProjectUser`)

### UserRequest Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `userId` | Integer | Foreign Key (User), Indexed | User who made the request |
| `adminId` | Integer | Foreign Key (Admin), Indexed | Admin who receives the request |
| `requestType` | String | Required | Type: 'firstName', 'lastName', 'email', 'password' |
| `currentValue` | String | Nullable | Current value (null for password) |
| `requestedValue` | String | Nullable | Requested value ('[HIDDEN]' for password) |
| `status` | String | Default: 'pending', Indexed | Status: 'pending', 'approved', 'rejected' |
| `createdAt` | DateTime | Default: now() | Request creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last update timestamp |

**Relations:**
- Belongs to one user (`user`) - Cascade delete
- Belongs to one admin (`admin`) - Cascade delete

### Project Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `name` | String | Required | Project name |
| `description` | String | Nullable | Project description |
| `status` | String | Default: 'active', Indexed | Status: 'active', 'inactive', 'completed' |
| `createdBy` | Integer | Foreign Key (Admin), Indexed | ID of admin who created this project |
| `createdAt` | DateTime | Default: now() | Project creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last update timestamp |

**Relations:**
- Belongs to one admin (`admin`) - Cascade delete
- Has many user assignments (`users` via `ProjectUser`)

### ProjectUser Table (Join Table)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `projectId` | Integer | Foreign Key (Project), Indexed | Project ID |
| `userId` | Integer | Foreign Key (User), Indexed | User ID |
| `designationId` | Integer | Foreign Key (Designation), Nullable, Indexed | Optional designation/role for user in project |
| `assignedAt` | DateTime | Default: now() | Assignment timestamp |

**Constraints:**
- Unique constraint on `[projectId, userId]` - prevents duplicate assignments
- Cascade delete on both project and user
- SetNull on designation (if designation deleted, user stays in project)

**Purpose:**
- Links users to projects with optional role/designation
- Allows users to have different roles in different projects
- Designation must be assigned to project before assigning to user

### Designation Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `name` | String | Required, Unique | Designation name (e.g., "Software Engineer") |
| `description` | String | Nullable | Description of the designation |
| `createdAt` | DateTime | Default: now() | Creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last update timestamp |

**Relations:**
- Can be assigned to many projects (`projects` via `ProjectDesignation`)

**Purpose:**
- Defines job roles/titles in the system
- Managed by admins only
- Can be assigned to projects to define available roles within each project

### ProjectDesignation Table (Join Table)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `projectId` | Integer | Foreign Key (Project), Indexed | Project ID |
| `designationId` | Integer | Foreign Key (Designation), Indexed | Designation ID |
| `assignedAt` | DateTime | Default: now() | Assignment timestamp |

**Constraints:**
- Unique constraint on `[projectId, designationId]` - prevents duplicate assignments
- Cascade delete on both project and designation

**Purpose:**
- Links designations to specific projects
- Allows admins to define which roles are available in each project
- Enables project-specific role management

---

## API Documentation

### Authentication Endpoints

#### Admin Signup

Create a new admin account.

**Endpoint:** `POST /auth/signup`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "admin@example.com",
  "password": "securePassword123"
}
```

**Validation:**
- `firstName`: Required, min 3 characters
- `lastName`: Required, min 3 characters
- `email`: Required, valid email format
- `password`: Required, min 6 characters

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
- `409 Conflict` - Email already exists

---

#### Admin Login

Authenticate an admin user.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "securePassword123"
}
```

**Success Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials

---

#### Admin Logout

Logout the current admin (requires authentication).

**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "message": "Logout successful"
}
```

---

#### User Login

Authenticate a regular user.

**Endpoint:** `POST /auth/user/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "userPassword123"
}
```

**Success Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials

---

#### User Logout

Logout the current user (requires authentication).

**Endpoint:** `POST /auth/user/logout`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "message": "Logout successful"
}
```

---

### Admin Management Endpoints

> **Note:** Admins can only be created via `/auth/signup`. Direct creation via `/admin` is disabled for security.

#### Get All Admins

Retrieve all admin accounts.

**Endpoint:** `GET /admin`

**Success Response (200):**
```json
[
  {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "admin@example.com",
    "createdAt": "2025-12-24T10:30:00.000Z"
  }
]
```

---

#### Get Admin by ID

Retrieve a specific admin by ID.

**Endpoint:** `GET /admin/:id`

**Success Response (200):**
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "admin@example.com",
  "createdAt": "2025-12-24T10:30:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Admin not found

---

#### Update Admin

Update an admin's information.

**Endpoint:** `PATCH /admin/:id`

**Request Body (all fields optional):**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "newemail@example.com",
  "password": "newPassword123"
}
```

**Validation:**
- `firstName`: Min 3 characters (if provided)
- `lastName`: Min 3 characters (if provided)
- `email`: Valid email format (if provided)
- `password`: Min 6 characters (if provided)

**Success Response (200):**
```json
{
  "id": 1,
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "newemail@example.com",
  "createdAt": "2025-12-24T10:30:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed
- `404 Not Found` - Admin not found
- `409 Conflict` - Email already exists

---

#### Delete Admin

Delete an admin account.

**Endpoint:** `DELETE /admin/:id`

**Success Response (200):**
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "admin@example.com",
  "createdAt": "2025-12-24T10:30:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Admin not found

---

### User Management Endpoints

#### Create User

Create a new user (requires admin authentication).

**Endpoint:** `POST /user`

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Request Body:**
```json
{
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "alice@example.com",
  "password": "userPassword123"
}
```

**Validation:**
- `firstName`: Required, min 3 characters
- `lastName`: Required, min 3 characters
- `email`: Required, valid email format
- `password`: Required, min 6 characters

**Success Response (201):**
```json
{
  "id": 5,
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "alice@example.com",
  "createdBy": 1,
  "createdAt": "2025-12-24T11:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin
- `409 Conflict` - Email already exists

---

#### Get All Users

Retrieve all users.

**Endpoint:** `GET /user`

**Success Response (200):**
```json
[
  {
    "id": 5,
    "firstName": "Alice",
    "lastName": "Johnson",
    "email": "alice@example.com",
    "createdBy": 1,
    "createdAt": "2025-12-24T11:00:00.000Z"
  }
]
```

---

#### Get User by ID

Retrieve a specific user by ID.

**Endpoint:** `GET /user/:id`

**Success Response (200):**
```json
{
  "id": 5,
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "alice@example.com",
  "createdBy": 1,
  "createdAt": "2025-12-24T11:00:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - User not found

---

#### Update User

Update a user's information.

**Endpoint:** `PATCH /user/:id`

**Request Body (all fields optional):**
```json
{
  "firstName": "Alicia",
  "lastName": "Smith",
  "email": "newemail@example.com",
  "password": "newPassword456"
}
```

**Validation:**
- `firstName`: Min 3 characters (if provided)
- `lastName`: Min 3 characters (if provided)
- `email`: Valid email format (if provided)
- `password`: Min 6 characters (if provided)

**Success Response (200):**
```json
{
  "id": 5,
  "firstName": "Alicia",
  "lastName": "Smith",
  "email": "newemail@example.com",
  "createdBy": 1,
  "createdAt": "2025-12-24T11:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed
- `404 Not Found` - User not found
- `409 Conflict` - Email already exists

---

#### Delete User

Delete a user account.

**Endpoint:** `DELETE /user/:id`

**Success Response (200):**
```json
{
  "id": 5,
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "alice@example.com",
  "createdBy": 1,
  "createdAt": "2025-12-24T11:00:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - User not found

---

### Request Management Endpoints

> **Important:** Users can only create requests for themselves. Admins can only manage requests from users they created.

#### Create Change Request

Create a request to change user profile information (requires user authentication).

**Endpoint:** `POST /request`

**Headers:**
```
Authorization: Bearer <user_access_token>
```

**Request Body:**
```json
{
  "requestType": "email",
  "requestedValue": "newemail@example.com"
}
```

**For Password Change:**
```json
{
  "requestType": "password",
  "requestedValue": "newPassword789",
  "currentPassword": "currentPassword123"
}
```

**Validation:**
- `requestType`: Required, must be 'firstName', 'lastName', 'email', or 'password'
- `requestedValue`: Required, min 1 character
- `currentPassword`: Required for password changes, min 6 characters

**Success Response (201):**
```json
{
  "id": 10,
  "userId": 5,
  "adminId": 1,
  "requestType": "email",
  "currentValue": "alice@example.com",
  "requestedValue": "newemail@example.com",
  "status": "pending",
  "createdAt": "2025-12-24T12:00:00.000Z",
  "updatedAt": "2025-12-24T12:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed or user has no assigned admin
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a regular user

---

#### Get My Requests

Get all requests created by the current user (requires user authentication).

**Endpoint:** `GET /request/my-requests`

**Headers:**
```
Authorization: Bearer <user_access_token>
```

**Success Response (200):**
```json
[
  {
    "id": 10,
    "userId": 5,
    "adminId": 1,
    "requestType": "email",
    "currentValue": "alice@example.com",
    "requestedValue": "newemail@example.com",
    "status": "pending",
    "createdAt": "2025-12-24T12:00:00.000Z",
    "updatedAt": "2025-12-24T12:00:00.000Z"
  }
]
```

---

#### Get Admin Requests

Get all requests from users created by the current admin (requires admin authentication).

**Endpoint:** `GET /request/admin-requests`

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Success Response (200):**
```json
[
  {
    "id": 10,
    "userId": 5,
    "adminId": 1,
    "requestType": "email",
    "currentValue": "alice@example.com",
    "requestedValue": "newemail@example.com",
    "status": "pending",
    "createdAt": "2025-12-24T12:00:00.000Z",
    "updatedAt": "2025-12-24T12:00:00.000Z",
    "user": {
      "id": 5,
      "firstName": "Alice",
      "lastName": "Johnson",
      "email": "alice@example.com"
    }
  }
]
```

---

#### Get Request by ID

Get a specific request by ID.

**Endpoint:** `GET /request/:id`

**Success Response (200):**
```json
{
  "id": 10,
  "userId": 5,
  "adminId": 1,
  "requestType": "email",
  "currentValue": "alice@example.com",
  "requestedValue": "newemail@example.com",
  "status": "pending",
  "createdAt": "2025-12-24T12:00:00.000Z",
  "updatedAt": "2025-12-24T12:00:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Request not found

---

#### Approve Request

Approve a change request (requires admin authentication).

**Endpoint:** `PATCH /request/:id/approve`

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Success Response (200):**
```json
{
  "id": 10,
  "userId": 5,
  "adminId": 1,
  "requestType": "email",
  "currentValue": "alice@example.com",
  "requestedValue": "newemail@example.com",
  "status": "approved",
  "createdAt": "2025-12-24T12:00:00.000Z",
  "updatedAt": "2025-12-24T12:05:00.000Z"
}
```

> **Note:** For firstName, lastName, and email requests, the user's profile is automatically updated upon approval. Password change requests cannot be approved for security reasons.

**Error Responses:**
- `400 Bad Request` - Cannot approve password requests or already processed requests
- `403 Forbidden` - Not authorized to approve this request
- `404 Not Found` - Request not found

---

#### Reject Request

Reject a change request (requires admin authentication).

**Endpoint:** `PATCH /request/:id/reject`

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Success Response (200):**
```json
{
  "id": 10,
  "userId": 5,
  "adminId": 1,
  "requestType": "email",
  "currentValue": "alice@example.com",
  "requestedValue": "newemail@example.com",
  "status": "rejected",
  "createdAt": "2025-12-24T12:00:00.000Z",
  "updatedAt": "2025-12-24T12:05:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Request already processed
- `403 Forbidden` - Not authorized to reject this request
- `404 Not Found` - Request not found

---

### Project Management Endpoints

> **Important:** Projects are created and owned by admins. Users can be assigned to projects and can view projects they're assigned to.

#### Create Project

Create a new project (requires admin authentication).

**Endpoint:** `POST /project`

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Request Body:**
```json
{
  "name": "Website Redesign",
  "description": "Complete redesign of company website",
  "status": "active"
}
```

**Validation:**
- `name`: Required, min 3 characters
- `description`: Optional, min 10 characters
- `status`: Optional, must be 'active', 'inactive', or 'completed' (default: 'active')

**Success Response (201):**
```json
{
  "id": 2,
  "name": "Website Redesign",
  "description": "Complete redesign of company website",
  "status": "active",
  "createdBy": 1,
  "createdAt": "2025-12-24T13:00:00.000Z",
  "updatedAt": "2025-12-24T13:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin

---

#### Get All Projects

Get all projects (filtered by role).

**Endpoint:** `GET /project`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Admin Response (200):**
Returns all projects created by the admin.

```json
[
  {
    "id": 2,
    "name": "Website Redesign",
    "description": "Complete redesign of company website",
    "status": "active",
    "createdBy": 1,
    "createdAt": "2025-12-24T13:00:00.000Z",
    "updatedAt": "2025-12-24T13:00:00.000Z",
    "admin": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "admin@example.com"
    },
    "users": [
      {
        "id": 15,
        "projectId": 2,
        "userId": 5,
        "assignedAt": "2025-12-24T13:10:00.000Z",
        "user": {
          "id": 5,
          "firstName": "Alice",
          "lastName": "Johnson",
          "email": "alice@example.com"
        }
      }
    ]
  }
]
```

**User Response (200):**
Returns only projects the user is assigned to.

```json
[
  {
    "id": 2,
    "name": "Website Redesign",
    "description": "Complete redesign of company website",
    "status": "active",
    "createdBy": 1,
    "createdAt": "2025-12-24T13:00:00.000Z",
    "updatedAt": "2025-12-24T13:00:00.000Z",
    "admin": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "admin@example.com"
    }
  }
]
```

---

#### Get Project by ID

Get a specific project by ID.

**Endpoint:** `GET /project/:id`

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
  "createdAt": "2025-12-24T13:00:00.000Z",
  "updatedAt": "2025-12-24T13:00:00.000Z",
  "admin": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "admin@example.com"
  },
  "users": [
    {
      "id": 15,
      "projectId": 2,
      "userId": 5,
      "assignedAt": "2025-12-24T13:10:00.000Z",
      "user": {
        "id": 5,
        "firstName": "Alice",
        "lastName": "Johnson",
        "email": "alice@example.com"
      }
    }
  ]
}
```

**Error Responses:**
- `404 Not Found` - Project not found

---

#### Update Project

Update a project (requires admin authentication, admin must own the project).

**Endpoint:** `PATCH /project/:id`

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Request Body (all fields optional):**
```json
{
  "name": "Website Redesign v2",
  "description": "Updated project scope",
  "status": "completed"
}
```

**Validation:**
- `name`: Min 3 characters (if provided)
- `description`: Min 10 characters (if provided)
- `status`: Must be 'active', 'inactive', or 'completed' (if provided)

**Success Response (200):**
```json
{
  "id": 2,
  "name": "Website Redesign v2",
  "description": "Updated project scope",
  "status": "completed",
  "createdBy": 1,
  "createdAt": "2025-12-24T13:00:00.000Z",
  "updatedAt": "2025-12-24T14:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed
- `403 Forbidden` - Not authorized (not the project owner)
- `404 Not Found` - Project not found

---

#### Delete Project

Delete a project (requires admin authentication, admin must own the project).

**Endpoint:** `DELETE /project/:id`

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
- `403 Forbidden` - Not authorized (not the project owner)
- `404 Not Found` - Project not found

---

#### Assign User to Project

Assign a user to a project (requires admin authentication, admin must own the project).

**Endpoint:** `POST /project/:id/assign-user`

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Request Body:**
```json
{
  "userId": 5
}
```

**Validation:**
- `userId`: Required, must be a positive integer

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
- `403 Forbidden` - Not authorized (not the project owner)
- `404 Not Found` - Project or user not found
- `409 Conflict` - User already assigned to this project

---

#### Remove User from Project

Remove a user from a project (requires admin authentication, admin must own the project).

**Endpoint:** `DELETE /project/:id/remove-user/:userId`

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

> **Note:** This operation is idempotent. Removing a user who is not assigned will succeed without error and return the current assignment list.

**Error Responses:**
- `403 Forbidden` - Not authorized (not the project owner)
- `404 Not Found` - Project not found

---

#### Set User Designation in Project

Assign a specific designation/role to a user within a project (requires admin authentication, admin must own the project).

**Endpoint:** `PATCH /project/:id/user/:userId/designation`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "designationId": 1
}
```

**Validation:**
- `designationId`: Required, must be a positive integer

**Success Response (200):**
```json
{
  "message": "Designation assigned successfully",
  "user": {
    "id": 5,
    "firstName": "Alice",
    "lastName": "Johnson",
    "designation": "Software Engineer"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Designation not assigned to project
- `403 Forbidden` - Not authorized (not the project owner)
- `404 Not Found` - Project, user, or designation not found

> **Important Prerequisites:**
> 1. User must be assigned to the project first (`POST /project/:id/assign-user`)
> 2. Designation must be assigned to the project first (`POST /project/:id/assign-designation`)
> 3. Only then can you assign the designation to the user
>
> **Workflow Example:**
> ```
> 1. POST /project/2/assign-user { "userId": 5 }
> 2. POST /project/2/assign-designation { "designationId": 1 }
> 3. PATCH /project/2/user/5/designation { "designationId": 1 }
> ```

---

#### Remove User Designation from Project

Remove a user's designation/role from a project (requires admin authentication, admin must own the project).

**Endpoint:** `DELETE /project/:id/user/:userId/designation`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Success Response (200):**
```json
{
  "message": "Designation removed successfully",
  "user": {
    "id": 5,
    "firstName": "Alice",
    "lastName": "Johnson",
    "designation": null
  }
}
```

**Error Responses:**
- `403 Forbidden` - Not authorized (not the project owner)
- `404 Not Found` - Project or user not found

> **Note:** This operation is idempotent. Removing a designation when the user has none will succeed without error.

---

### Designation Management Endpoints

> **Important:** All designation endpoints require admin authentication. Designations are used to define job roles/titles in the system.

#### Create Designation

Create a new designation (requires admin authentication).

**Endpoint:** `POST /designation`

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Request Body:**
```json
{
  "name": "Software Engineer",
  "description": "Responsible for developing and maintaining software applications"
}
```

**Validation:**
- `name`: Required, min 2 characters, max 100 characters
- `description`: Optional, min 10 characters, max 500 characters

**Success Response (201):**
```json
{
  "id": 1,
  "name": "Software Engineer",
  "description": "Responsible for developing and maintaining software applications",
  "createdAt": "2025-12-25T10:00:00.000Z",
  "updatedAt": "2025-12-25T10:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin
- `409 Conflict` - Designation with this name already exists

---

#### Get All Designations

Retrieve all designations (requires admin authentication).

**Endpoint:** `GET /designation`

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "name": "Software Engineer",
    "description": "Responsible for developing and maintaining software applications",
    "createdAt": "2025-12-25T10:00:00.000Z",
    "updatedAt": "2025-12-25T10:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Project Manager",
    "description": "Oversees project planning and execution",
    "createdAt": "2025-12-25T10:05:00.000Z",
    "updatedAt": "2025-12-25T10:05:00.000Z"
  }
]
```

Designations are returned in alphabetical order by name.

---

#### Get Designation by ID

Retrieve a specific designation by ID (requires admin authentication).

**Endpoint:** `GET /designation/:id`

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Success Response (200):**
```json
{
  "id": 1,
  "name": "Software Engineer",
  "description": "Responsible for developing and maintaining software applications",
  "createdAt": "2025-12-25T10:00:00.000Z",
  "updatedAt": "2025-12-25T10:00:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin
- `404 Not Found` - Designation not found

---

#### Update Designation

Update a designation (requires admin authentication).

**Endpoint:** `PATCH /designation/:id`

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Request Body (all fields optional):**
```json
{
  "name": "Senior Software Engineer",
  "description": "Leads development of complex software systems"
}
```

**Validation:**
- `name`: Min 2 characters, max 100 characters (if provided)
- `description`: Min 10 characters, max 500 characters (if provided)

**Success Response (200):**
```json
{
  "id": 1,
  "name": "Senior Software Engineer",
  "description": "Leads development of complex software systems",
  "createdAt": "2025-12-25T10:00:00.000Z",
  "updatedAt": "2025-12-25T11:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin
- `404 Not Found` - Designation not found
- `409 Conflict` - Designation with this name already exists

---

#### Delete Designation

Delete a designation (requires admin authentication).

**Endpoint:** `DELETE /designation/:id`

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Success Response (200):**
```json
{
  "id": 1,
  "name": "Software Engineer",
  "description": "Responsible for developing and maintaining software applications",
  "createdAt": "2025-12-25T10:00:00.000Z",
  "updatedAt": "2025-12-25T10:00:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin
- `404 Not Found` - Designation not found

---

## Authentication & Authorization

### JWT Token Structure

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Payload

```typescript
{
  email: string;
  sub: number;          // User/Admin ID
  role: 'admin' | 'user';
  iat: number;          // Issued at
  exp: number;          // Expiration
}
```

### Request User Object

In controllers, the authenticated user is available via `req.user`:

```typescript
{
  userId: number;       // Extracted from payload.sub
  email: string;
  role: 'admin' | 'user';
}
```

### Guards

#### AdminGuard

Protects endpoints accessible only by admins.

```typescript
@UseGuards(AdminGuard)
@Post()
create(@Request() req, @Body() createDto: CreateDto) {
  const adminId = req.user.userId;
  // ...
}
```

**Behavior:**
- Extends `JwtAuthGuard` for JWT verification
- Checks `user.role === 'admin'`
- Throws `ForbiddenException` if not an admin

#### UserGuard

Protects endpoints accessible only by regular users.

```typescript
@UseGuards(UserGuard)
@Get('profile')
getProfile(@Request() req) {
  const userId = req.user.userId;
  // ...
}
```

**Behavior:**
- Extends `JwtAuthGuard` for JWT verification
- Checks `user.role === 'user'`
- Throws `ForbiddenException` if not a regular user

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
