# Rooeel Backend API

A NestJS-based backend API with admin authentication and user management, connected to Supabase PostgreSQL database via Prisma ORM.

## Tech Stack

- **Framework**: NestJS
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma 5
- **Authentication**: Token-based (stored in database)
- **Validation**: class-validator & class-transformer

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm
- Supabase account with PostgreSQL database

### Installation

```bash
npm install
```

### Environment Configuration

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

- `DATABASE_URL`: Connection pooler URL (used by application)
- `DIRECT_URL`: Direct connection URL (used for migrations)

### Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# View database in Prisma Studio (optional)
npx prisma studio
```

### Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

## API Documentation

### Base URL

```
http://localhost:3000
```

### Authentication

Protected endpoints require an `Authorization` header:

```
Authorization: Bearer <token>
```

Or simply:

```
Authorization: <token>
```

---

## Endpoints

### 1. Signup

Create a new admin account.

**Endpoint**: `POST /admin/signup`

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation**:
- `name`: Optional string (but required by controller logic)
- `email`: Valid email, automatically lowercased and trimmed
- `password`: String, minimum 8 characters

**Response** (200):
```json
{
  "id": "cm4dj8k2l0000xyz",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "admin"
}
```

**Error Responses**:
- `409 Conflict`: Email already in use
- `401 Unauthorized`: Name is required

---

### 2. Login

Authenticate and receive a session token.

**Endpoint**: `POST /admin/login`

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation**:
- `email`: Valid email, automatically lowercased and trimmed
- `password`: String, minimum 8 characters

**Response** (200):
```json
{
  "token": "a1b2c3d4e5f6...",
  "user": {
    "id": "cm4dj8k2l0000xyz",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin"
  }
}
```

**Error Responses**:
- `404 Not Found`: Invalid credentials
- `401 Unauthorized`: Invalid credentials (wrong password)

---

### 3. Logout

Invalidate the current session token.

**Endpoint**: `POST /admin/logout`

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true
}
```

**Error Responses**:
- `401 Unauthorized`: Authorization token is required
- `404 Not Found`: Session not found

---

### 4. Get Profile

Get the current authenticated admin's profile.

**Endpoint**: `GET /admin/profile`

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "id": "cm4dj8k2l0000xyz",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "admin"
}
```

**Error Responses**:
- `401 Unauthorized`: Authorization token is required / Invalid token

---

### 5. Create User

Create a new admin user (admin-only operation).

**Endpoint**: `POST /admin/users`

**Request Body**:
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "role": "moderator"
}
```

**Validation**:
- `name`: Required string
- `email`: Valid email, automatically lowercased and trimmed
- `password`: Optional string, minimum 8 characters (auto-generated if not provided)
- `role`: Optional string (defaults to "admin")

**Response** (200):
```json
{
  "id": "cm4dj9x3m0001abc",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "moderator"
}
```

**Response with auto-generated password**:
```json
{
  "id": "cm4dj9x3m0001abc",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "moderator",
  "generatedPassword": "x7k9m2p4q1"
}
```

**Error Responses**:
- `409 Conflict`: Email already in use

---

### 6. Update User Password

Set a new password for a specific user (admin-only operation).

**Endpoint**: `PUT /admin/users/:id/password`

**URL Parameters**:
- `id`: User ID

**Request Body**:
```json
{
  "password": "newpassword123"
}
```

**Validation**:
- `password`: Required string, minimum 8 characters

**Response** (200):
```json
{
  "id": "cm4dj9x3m0001abc",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "moderator"
}
```

**Note**: All existing sessions for this user will be invalidated.

**Error Responses**:
- `404 Not Found`: User not found

---

### 7. Reset Password by Email

Reset a user's password and generate a new one (admin-only operation).

**Endpoint**: `POST /admin/users/reset-password`

**Request Body**:
```json
{
  "email": "jane@example.com"
}
```

**Validation**:
- `email`: Valid email, automatically lowercased and trimmed

**Response** (200):
```json
{
  "id": "cm4dj9x3m0001abc",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "moderator",
  "newPassword": "y8n3q5r7t2"
}
```

**Note**: All existing sessions for this user will be invalidated.

**Error Responses**:
- `404 Not Found`: User not found

---

### 8. Delete User

Delete a user account (admin-only operation).

**Endpoint**: `DELETE /admin/users/:id`

**URL Parameters**:
- `id`: User ID

**Response** (200):
```json
{
  "id": "cm4dj9x3m0001abc",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "moderator"
}
```

**Note**: All sessions for this user will be automatically deleted (CASCADE).

**Error Responses**:
- `404 Not Found`: User not found

---

### 9. Assign Role

Assign or update a user's role (admin-only operation).

**Endpoint**: `POST /admin/users/:id/role`

**URL Parameters**:
- `id`: User ID

**Request Body**:
```json
{
  "role": "super-admin"
}
```

**Validation**:
- `role`: Required string

**Response** (200):
```json
{
  "id": "cm4dj9x3m0001abc",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "super-admin"
}
```

**Error Responses**:
- `404 Not Found`: User not found

---

## Database Schema

### Admin Table

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key, auto-generated |
| name | String | Admin's full name |
| email | String (Unique) | Email address (lowercase) |
| passwordHash | String | Hashed password (scrypt) |
| salt | String | Password salt |
| role | String (Nullable) | User role (default: "admin") |
| createdAt | DateTime | Account creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### Session Table

| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key (the token itself) |
| adminId | String | Foreign key to Admin |
| createdAt | DateTime | Session creation timestamp |
| expiresAt | DateTime (Nullable) | Optional expiration time |

**Relationships**:
- One Admin can have many Sessions
- Deleting an Admin cascades to delete all their Sessions

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK`: Successful request
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource (e.g., email already exists)
- `400 Bad Request`: Validation errors

**Validation Error Example**:
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

---

## Security Features

- **Password Hashing**: Uses `scrypt` with random salt
- **Timing-Safe Comparison**: Prevents timing attacks during password verification
- **Email Normalization**: All emails stored in lowercase
- **Session Management**: Token-based authentication with database storage
- **Validation**: Automatic request validation with `class-validator`
- **CORS**: Enabled for cross-origin requests

---

## Development

### Project Structure

```
src/
├── admin/
│   ├── dto/                 # Data Transfer Objects
│   ├── admin.controller.ts  # API endpoints
│   ├── admin.service.ts     # Business logic
│   └── admin.module.ts      # Module configuration
├── prisma/
│   ├── prisma.service.ts    # Prisma client wrapper
│   └── prisma.module.ts     # Prisma module
├── app.module.ts            # Root module
└── main.ts                  # Application entry point

prisma/
├── schema.prisma            # Database schema
└── migrations/              # Migration history
```

### Available Scripts

```bash
# Development
npm run start:dev

# Build
npm run build

# Production
npm run start:prod

# Linting
npm run lint

# Formatting
npm run format

# Testing
npm run test
```

---

## License

UNLICENSED
