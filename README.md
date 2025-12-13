# NestJS Application

A NestJS application with Authentication, Admin, and User modules.

## Installation

```bash
npm install
```

## Environment Setup

Create a `.env` file in the root directory (see `.env.example` for reference):

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/rooeel?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRATION="7d"
```

## Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (if using a database)
npx prisma migrate dev
```

## Running the app

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Build

```bash
npm run build
```

## Modules

- **AuthModule**: Authentication module with JWT-based authentication
  - Register and login endpoints
  - Password hashing with bcrypt
  - JWT token generation and validation

- **UserModule**: User management module
  - Protected user endpoints requiring authentication
  
- **AdminModule**: Admin functionality module
  - Controller: `/admin` endpoint
  - Service: AdminService with basic functionality

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
  - Body: `{ "email": "user@example.com", "password": "password123", "name": "John Doe" }`
  - Returns: User object (without password)

- `POST /auth/login` - Login with email and password
  - Body: `{ "email": "user@example.com", "password": "password123" }`
  - Returns: `{ "accessToken": "jwt-token", "user": { ... } }`

### User (Protected - Requires JWT Token)

- `GET /user` - Get all users
  - Headers: `Authorization: Bearer <token>`
  
- `GET /user/profile` - Get current user profile
  - Headers: `Authorization: Bearer <token>`
  
- `GET /user/:id` - Get user by ID
  - Headers: `Authorization: Bearer <token>`

### Admin

- `GET /admin` - Returns admin information
