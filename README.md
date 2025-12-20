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
# Generate Prisma Client
$ npx prisma generate

# Push schema to database
$ npx prisma db push
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
Manage user authentication and sessions.

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/signup` | Admin signup | `{ "firstName": "...", "lastName": "...", "email": "...", "password": "..." }` | `{ "access_token": "...", "admin": { ... } }` |
| `POST` | `/auth/login` | Admin login | `{ "email": "...", "password": "..." }` | `{ "access_token": "..." }` |
| `POST` | `/auth/logout` | Admin logout (requires JWT token) | - | `{ "message": "Logout successful" }` |

### Admin Module
Manage administrator accounts.

> [!IMPORTANT]
> Admins can only be created through the `/auth/signup` endpoint. Direct admin creation via `/admin` is not available for security reasons.

| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin` | Retrieve all admins | - |
| `GET` | `/admin/:id` | Retrieve an admin by ID | - |
| `PATCH` | `/admin/:id` | Update an existing admin | Partial Admin Object |
| `DELETE` | `/admin/:id` | Delete an admin | - |

#### Data Models
**Admin**
- `id`: Int (Auto-increment)
- `firstName`: String
- `lastName`: String
- `email`: String (Unique)
- `password`: String
- `createdAt`: DateTime (Default: now)

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
