<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Rooeel Backend

A generic backend service built with [NestJS](https://github.com/nestjs/nest) and [Prisma](https://www.prisma.io/).

## Prerequisites

-   [Node.js](https://nodejs.org/) (v16 or higher)
-   [PostgreSQL](https://www.postgresql.org/)

## Installation

```bash
$ npm install
```

## Configuration

1.  Copy the environment file example (if available) or create a new `.env` file in the root directory.
2.  Add your database connection string:

```env
DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"
PORT=5000  # Optional: defaults to 5000 if not specified
```

## Database Setup

Initialize your database schema using Prisma:

```bash
# Generate Prisma Client and run migrations
$ npx prisma migrate dev --name init

# Or if migrations already exist
$ npx prisma migrate deploy
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Logging

The application uses a custom logger with colored console output and timestamps for better visibility.

### Log Levels

Configure the log level via the `LOG_LEVEL` environment variable in `.env`:

```env
LOG_LEVEL=debug  # Options: error, warn, log, debug, verbose
ENABLE_HTTP_LOGGING=true  # Enable/disable HTTP request/response logging
```

**Log Levels:**
- `error`: Critical errors requiring immediate attention
- `warn`: Warning messages for potential issues
- `log`: General informational messages (default)
- `debug`: Detailed debugging information
- `verbose`: Very detailed trace information

### Log Format

```
[2025-12-22 11:22:15] [INFO] [AuthService] Admin admin@test.com logged in successfully
[2025-12-22 11:22:16] [HTTP] POST /user 201 - 45ms
[2025-12-22 11:22:17] [DEBUG] [UserService] Creating user: testuser@example.com
```

### HTTP Logging

When `ENABLE_HTTP_LOGGING=true`, all HTTP requests and responses are logged with:
- Request method, URL, and IP address
- Response status code (color-coded: green for 2xx, yellow for 4xx, red for 5xx)
- Request duration in milliseconds

---

## API Documentation

### Application
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Health check. Returns "Hello World!". |

### Authentication
Manage authentication and sessions for both admins and users.

#### Admin Authentication
Admins can self-register and authenticate.

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/signup` | Admin signup | `{ "firstName": "string", "lastName": "string", "email": "string", "password": "string" }` | `{ "access_token": "string", "admin": { "id": number, "firstName": "string", "lastName": "string", "email": "string" } }` |
| `POST` | `/auth/login` | Admin login | `{ "email": "string", "password": "string" }` | `{ "access_token": "string" }` |
| `POST` | `/auth/logout` | Admin logout (requires JWT token) | - | `{ "message": "Logout successful" }` |

**Validation Rules:**
- `firstName`: Required, minimum 3 characters
- `lastName`: Required, minimum 3 characters
- `email`: Required, must be valid email format
- `password`: Required, minimum 6 characters

#### User Authentication

> [!IMPORTANT]
> Users **cannot self-register**. They must be created by an admin using the `POST /user` endpoint. Once created, users can login and logout.

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/user/login` | User login | `{ "email": "string", "password": "string" }` | `{ "access_token": "string" }` |
| `POST` | `/auth/user/logout` | User logout (requires JWT token) | - | `{ "message": "Logout successful" }` |

---

### Admin Module
Manage administrator accounts.

> [!IMPORTANT]
> Admins can only be created through the `/auth/signup` endpoint. Direct admin creation via `/admin` is not available for security reasons.

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/admin` | Retrieve all admins | - | Array of Admin objects |
| `GET` | `/admin/:id` | Retrieve an admin by ID | - | Admin object |
| `PATCH` | `/admin/:id` | Update an existing admin | `{ "firstName"?: "string", "lastName"?: "string", "email"?: "string", "password"?: "string" }` | Updated Admin object |
| `DELETE` | `/admin/:id` | Delete an admin | - | Deleted Admin object |

**Validation Rules (Update):**
- All fields are optional
- `firstName`: Minimum 3 characters (if provided)
- `lastName`: Minimum 3 characters (if provided)
- `email`: Must be valid email format (if provided)
- `password`: Minimum 6 characters (if provided)

---

### User Module
Manage user accounts.

> [!IMPORTANT]
> The `POST /user` endpoint requires **admin authentication**. Include a valid admin JWT token in the Authorization header.

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/user` | Create a new user (requires admin auth) | `{ "firstName": "string", "lastName": "string", "email": "string", "password": "string" }` | Created User object |
| `GET` | `/user` | Retrieve all users | - | Array of User objects |
| `GET` | `/user/:id` | Retrieve a user by ID | - | User object |
| `PATCH` | `/user/:id` | Update an existing user | `{ "firstName"?: "string", "lastName"?: "string", "email"?: "string", "password"?: "string" }` | Updated User object |
| `DELETE` | `/user/:id` | Delete a user | - | Deleted User object |

**Validation Rules (Create):**
- `firstName`: Required, minimum 3 characters
- `lastName`: Required, minimum 3 characters
- `email`: Required, must be valid email format
- `password`: Required, minimum 6 characters

**Validation Rules (Update):**
- All fields are optional
- `firstName`: Minimum 3 characters (if provided)
- `lastName`: Minimum 3 characters (if provided)
- `email`: Must be valid email format (if provided)
- `password`: Minimum 6 characters (if provided)


---

### Request Module
Manage user change requests.

> [!IMPORTANT]
> Users can only create requests for themselves. Admins can only view and manage requests from users they created.

> [!WARNING]
> Password change requests cannot be approved by admins for security reasons. Users must use a different mechanism to change passwords.

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/request` | Create a change request (requires user auth) | `{ "requestType": "firstName" \| "lastName" \| "email" \| "password", "requestedValue": "string", "currentPassword"?: "string" }` | Created UserRequest object |
| `GET` | `/request/my-requests` | Get current user's requests (requires user auth) | - | Array of UserRequest objects |
| `GET` | `/request/admin-requests` | Get requests from admin's users (requires admin auth) | - | Array of UserRequest objects |
| `GET` | `/request/:id` | Get a specific request by ID | - | UserRequest object |
| `PATCH` | `/request/:id/approve` | Approve a request (requires admin auth) | - | Updated UserRequest object |
| `PATCH` | `/request/:id/reject` | Reject a request (requires admin auth) | - | Updated UserRequest object |

**Validation Rules (Create):**
- `requestType`: Required, must be one of 'firstName', 'lastName', 'email', 'password'
- `requestedValue`: Required, minimum 1 character
- `currentPassword`: Required only for password change requests, minimum 6 characters

**Request Workflow:**
1. User creates a change request via `POST /request`
2. Request is automatically assigned to the admin who created the user
3. Admin views pending requests via `GET /request/admin-requests`
4. Admin approves or rejects the request via `PATCH /request/:id/approve` or `PATCH /request/:id/reject`
5. If approved (and not a password request), the user's profile is automatically updated
6. User can view their request history via `GET /request/my-requests`

---

### Data Models

#### Admin
```typescript
{
  id: number;           // Auto-increment
  firstName: string;
  lastName: string;
  email: string;        // Unique
  password: string;     // Hashed
  createdAt: Date;      // Default: now()
}
```

#### User
```typescript
{
  id: number;           // Auto-increment
  firstName: string;
  lastName: string;
  email: string;        // Unique
  password: string;     // Hashed
  createdBy: number;    // Foreign key to Admin (nullable)
  createdAt: Date;      // Default: now()
}
```

#### UserRequest
```typescript
{
  id: number;           // Auto-increment
  userId: number;       // Foreign key to User
  adminId: number;      // Foreign key to Admin
  requestType: string;  // 'firstName', 'lastName', 'email', 'password'
  currentValue: string; // Current value (null for password)
  requestedValue: string; // Requested value ('[HIDDEN]' for password)
  status: string;       // 'pending', 'approved', 'rejected'
  createdAt: Date;      // Default: now()
  updatedAt: Date;      // Auto-updated
}
```

---

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

The JWT payload contains:
```typescript
{
  email: string;
  sub: number;          // User/Admin ID
  role: 'admin' | 'user';
}
```

---

### Authentication Guards

The application uses role-based guards to protect endpoints:

#### AdminGuard
Protects endpoints that should only be accessible by authenticated admins.

**Usage:**
```typescript
@UseGuards(AdminGuard)
@Post()
create(@Body() createUserDto: CreateUserDto) {
  return this.userService.create(createUserDto);
}
```

**Implementation:**
```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
  const isAuthenticated = await super.canActivate(context);
  if (!isAuthenticated) return false;
  
  const user = context.switchToHttp().getRequest().user;
  if (!user || user.role !== 'admin') {
    throw new ForbiddenException('Only admins can perform this action');
  }
  return true;
}
```

**Behavior:**
- Extends `JwtAuthGuard` to verify JWT token asynchronously
- Checks that `user.role === 'admin'`
- Throws `ForbiddenException` if user is not an admin

#### UserGuard
Protects endpoints that should only be accessible by authenticated users.

**Usage:**
```typescript
@UseGuards(UserGuard)
@Get('profile')
getProfile(@Request() req) {
  return req.user;
}
```

**Implementation:**
```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
  const isAuthenticated = await super.canActivate(context);
  if (!isAuthenticated) return false;
  
  const user = context.switchToHttp().getRequest().user;
  if (!user || user.role !== 'user') {
    throw new ForbiddenException('Only users can perform this action');
  }
  return true;
}
```

**Behavior:**
- Extends `JwtAuthGuard` to verify JWT token asynchronously
- Checks that `user.role === 'user'`
- Throws `ForbiddenException` if user is not a regular user

#### JwtAuthGuard
Base guard for JWT authentication without role checking. Use this when you need to authenticate any user (admin or regular user) without role restrictions.

**Current Protected Endpoints:**
- `POST /user` - Protected by `AdminGuard` (only admins can create users)

---

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
