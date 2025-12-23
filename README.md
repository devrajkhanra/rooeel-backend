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
  createdAt: Date;      // Default: now()
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
