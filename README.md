# Rooeel Backend

A NestJS-based backend API for admin user management with session-based authentication using PostgreSQL and Prisma ORM.

## Features

- 🔐 Session-based authentication with secure token management
- 👥 Admin user management (CRUD operations)
- 🔒 Password hashing with crypto scrypt
- 🛡️ Role-based access control
- ✅ Request validation with class-validator
- 🗄️ PostgreSQL database with Prisma ORM
- 🚀 CORS enabled for cross-origin requests

## Tech Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL
- **ORM**: Prisma 5.22.0
- **Validation**: class-validator, class-transformer
- **Runtime**: Node.js
- **Language**: TypeScript

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rooeel-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL database**
   
   Create a PostgreSQL database named `rooeel_db`:
   ```sql
   CREATE DATABASE rooeel_db;
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/rooeel_db"
   ```
   
   Replace `YOUR_PASSWORD` with your PostgreSQL password.

5. **Run Prisma migrations**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. **Start the development server**
   ```bash
   npm run start:dev
   ```

   The API will be available at `http://localhost:3000`

## Database Schema

### Admin Table
| Field        | Type     | Description                          |
|--------------|----------|--------------------------------------|
| id           | String   | Primary key (CUID)                   |
| name         | String   | Admin user's name                    |
| email        | String   | Unique email address                 |
| passwordHash | String   | Hashed password                      |
| salt         | String   | Salt for password hashing            |
| role         | String?  | User role (default: 'admin')         |
| createdAt    | DateTime | Timestamp of creation                |
| updatedAt    | DateTime | Timestamp of last update             |

### Session Table
| Field     | Type      | Description                          |
|-----------|-----------|--------------------------------------|
| id        | String    | Primary key (session token)          |
| adminId   | String    | Foreign key to Admin                 |
| createdAt | DateTime  | Timestamp of session creation        |
| expiresAt | DateTime? | Optional expiration timestamp        |

## API Documentation

Base URL: `http://localhost:3000`

### Authentication Endpoints

#### 1. Signup (Create First Admin)

Create a new admin account.

**Endpoint**: `POST /admin/signup`

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Validation Rules**:
- `name`: Required, non-empty string
- `email`: Required, valid email format
- `password`: Required, minimum 8 characters

**Response** (200 OK):
```json
{
  "id": "clx1234567890abcdef",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "admin"
}
```

**Error Responses**:
- `409 Conflict`: Email already in use
- `400 Bad Request`: Validation failed

---

#### 2. Login

Authenticate and receive a session token.

**Endpoint**: `POST /admin/login`

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Validation Rules**:
- `email`: Required, valid email format
- `password`: Required, minimum 8 characters

**Response** (200 OK):
```json
{
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "user": {
    "id": "clx1234567890abcdef",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin"
  }
}
```

**Error Responses**:
- `404 Not Found`: Invalid credentials (user not found)
- `401 Unauthorized`: Invalid credentials (wrong password)

---

#### 3. Logout

Invalidate the current session.

**Endpoint**: `POST /admin/logout`

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true
}
```

**Error Responses**:
- `401 Unauthorized`: Authorization token is required
- `404 Not Found`: Session not found

---

#### 4. Get Profile

Retrieve the authenticated user's profile.

**Endpoint**: `GET /admin/profile`

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "id": "clx1234567890abcdef",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "admin"
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token

---

### User Management Endpoints

> **Note**: All user management endpoints require authentication via the `Authorization` header.

#### 5. Create User

Create a new admin user (admin-only).

**Endpoint**: `POST /admin/users`

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "optional_password",
  "role": "admin"
}
```

**Validation Rules**:
- `name`: Required, string
- `email`: Required, valid email format
- `password`: Optional, minimum 8 characters if provided
- `role`: Optional, string (defaults to 'admin')

**Response** (200 OK):

*With password provided*:
```json
{
  "id": "clx9876543210fedcba",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "admin"
}
```

*Without password (auto-generated)*:
```json
{
  "id": "clx9876543210fedcba",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "admin",
  "generatedPassword": "xy7k2m9p4q"
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
- `409 Conflict`: Email already in use

---

#### 6. Update User Password

Set a new password for a specific user (admin-only).

**Endpoint**: `PUT /admin/users/:id/password`

**Headers**:
```
Authorization: Bearer <token>
```

**URL Parameters**:
- `id`: User ID (CUID)

**Request Body**:
```json
{
  "password": "newpassword123"
}
```

**Validation Rules**:
- `password`: Required, minimum 8 characters

**Response** (200 OK):
```json
{
  "id": "clx9876543210fedcba",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "admin"
}
```

**Side Effects**:
- All active sessions for this user are invalidated

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: User not found

---

#### 7. Reset Password by Email

Generate and set a new random password for a user (admin-only).

**Endpoint**: `POST /admin/users/reset-password`

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "email": "jane@example.com"
}
```

**Validation Rules**:
- `email`: Required, valid email format

**Response** (200 OK):
```json
{
  "id": "clx9876543210fedcba",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "admin",
  "newPassword": "xy7k2m9p4q"
}
```

**Side Effects**:
- All active sessions for this user are invalidated
- A new random password is generated (10 characters)

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: User not found

---

#### 8. Delete User

Delete a user account (admin-only).

**Endpoint**: `DELETE /admin/users/:id`

**Headers**:
```
Authorization: Bearer <token>
```

**URL Parameters**:
- `id`: User ID (CUID)

**Response** (200 OK):
```json
{
  "id": "clx9876543210fedcba",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "admin"
}
```

**Side Effects**:
- All sessions for this user are automatically deleted (CASCADE)

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: User not found

---

#### 9. Assign Role

Update a user's role (admin-only).

**Endpoint**: `POST /admin/users/:id/role`

**Headers**:
```
Authorization: Bearer <token>
```

**URL Parameters**:
- `id`: User ID (CUID)

**Request Body**:
```json
{
  "role": "superadmin"
}
```

**Validation Rules**:
- `role`: Required, string

**Response** (200 OK):
```json
{
  "id": "clx9876543210fedcba",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "superadmin"
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: User not found

---

## Authentication Flow

1. **Signup/Login**: User provides credentials and receives a session token
2. **Token Storage**: Client stores the token (e.g., localStorage, cookies)
3. **Authenticated Requests**: Client includes token in `Authorization` header:
   ```
   Authorization: Bearer <token>
   ```
4. **Token Validation**: Server validates token against active sessions in database
5. **Logout**: Token is deleted from database, invalidating the session

### Token Format

- Tokens are 64-character hexadecimal strings
- Generated using `crypto.randomBytes(32)`
- Stored directly in the database (no JWT)

### Password Security

- Passwords are hashed using `crypto.scrypt`
- Each password has a unique 32-character hex salt
- Timing-safe comparison prevents timing attacks

## Error Handling

All endpoints return appropriate HTTP status codes:

| Status Code | Description                          |
|-------------|--------------------------------------|
| 200         | Success                              |
| 400         | Bad Request (validation failed)      |
| 401         | Unauthorized (invalid/missing token) |
| 404         | Not Found (resource doesn't exist)   |
| 409         | Conflict (duplicate email)           |
| 500         | Internal Server Error                |

Error response format:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## Development

### Available Scripts

```bash
# Development
npm run start:dev      # Start with hot-reload

# Production
npm run build          # Build for production
npm run start:prod     # Run production build

# Database
npx prisma studio      # Open Prisma Studio (DB GUI)
npx prisma generate    # Regenerate Prisma Client
npx prisma db push     # Push schema changes to DB

# Code Quality
npm run format         # Format code with Prettier
npm run lint           # Lint code with ESLint
npm test               # Run tests
```

### Project Structure

```
src/
├── admin/
│   ├── dto/                    # Data Transfer Objects
│   │   ├── signup-admin.dto.ts
│   │   ├── login-admin.dto.ts
│   │   ├── create-admin.dto.ts
│   │   ├── update-password.dto.ts
│   │   ├── reset-password.dto.ts
│   │   └── assign-role.dto.ts
│   ├── admin.controller.ts     # API endpoints
│   ├── admin.service.ts        # Business logic
│   ├── admin.module.ts         # Module definition
│   └── auth.guard.ts           # Authentication guard
├── prisma/
│   ├── prisma.service.ts       # Prisma client service
│   └── prisma.module.ts        # Prisma module
├── app.module.ts               # Root module
└── main.ts                     # Application entry point

prisma/
└── schema.prisma               # Database schema
```

## Database Management

### View Database with Prisma Studio

```bash
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can view and edit database records.

### Reset Database

```bash
npx prisma db push --force-reset
```

**Warning**: This will delete all data!

## Security Considerations

- ✅ Passwords are hashed with scrypt and unique salts
- ✅ Timing-safe password comparison prevents timing attacks
- ✅ Email addresses are normalized (lowercase, trimmed)
- ✅ Input validation on all endpoints
- ✅ Session-based authentication with database storage
- ⚠️ **Production**: Add rate limiting for login attempts
- ⚠️ **Production**: Implement session expiration
- ⚠️ **Production**: Use HTTPS only
- ⚠️ **Production**: Add CSRF protection
- ⚠️ **Production**: Implement proper logging and monitoring

## License

UNLICENSED - Private project

## Support

For issues or questions, please contact the development team.
