# Rooeel Backend

A NestJS-based backend API for project management with separate authentication for Admins and Users.

## Features

- 🔐 **Dual Authentication System**: Distinct login flows for Admins and Users.
- 👥 **Admin Management**: Admin signup and authentication.
- 📂 **Project Management**: CRUD operations for projects (Admin only).
- �️ **Security**: Password hashing, JWT-based session management, and role-based guards.
- ✅ **Validation**: Request validation using `class-validator`.
- 🗄️ **Database**: PostgreSQL with Prisma ORM.
- � **API Documentation**: Swagger UI integration.

## Tech Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL
- **ORM**: Prisma 5.22.0
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger (OpenAPI)
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
   
   Create a PostgreSQL database named `rooeel_db` (or as configured in your environment).

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

   The API will be available at `http://localhost:3000`.
   Swagger documentation is available at `http://localhost:3000/api`.

## API Documentation

Base URL: `http://localhost:3000`

### Admin Authentication

#### 1. Admin Signup

Create a new admin account.

**Endpoint**: `POST /admin/signup`

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "securepassword123"
}
```

**Validation Rules**:
- `firstName`: Required, string, min length 2.
- `lastName`: Required, string, min length 2.
- `email`: Required, valid email format (normalized to lowercase).
- `password`: Required, string, min length 8.

#### 2. Admin Login

Authenticate as an admin.

**Endpoint**: `POST /admin/login`

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "securepassword123"
}
```

**Response**:
Returns an authentication token/session details.

#### 3. Admin Logout

Invalidate the current admin session.

**Endpoint**: `POST /admin/logout`

**Headers**:
```
Authorization: Bearer <token>
```

---

### User Authentication

#### 1. User Login

Authenticate as a standard user.

**Endpoint**: `POST /user/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "userpassword123"
}
```

#### 2. User Logout

Invalidate the current user session.

**Endpoint**: `POST /user/logout`

**Headers**:
```
Authorization: Bearer <token>
```

---

### Project Management

> **Note**: These endpoints are protected by `AdminAuthGuard`. You must provide a valid Admin token in the `Authorization` header.

#### 1. Create Project

**Endpoint**: `POST /project`

**Request Body**:
```json
{
  "name": "New Project",
  "description": "Optional description of the project"
}
```

**Validation Rules**:
- `name`: Required, string, non-empty.
- `description`: Optional, string.

#### 2. Get All Projects

Retrieve all projects associated with the authenticated admin.

**Endpoint**: `GET /project`

#### 3. Get Project by ID

Retrieve a specific project.

**Endpoint**: `GET /project/:id`

#### 4. Update Project

Update an existing project.

**Endpoint**: `PATCH /project/:id`

**Request Body** (Partial `CreateProjectDto`):
```json
{
  "name": "Updated Project Name",
  "description": "Updated description"
}
```

#### 5. Delete Project

Delete a project.

**Endpoint**: `DELETE /project/:id`

---

## Development Scripts

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

## License

UNLICENSED - Private project
