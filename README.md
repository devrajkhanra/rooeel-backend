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

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
