<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# Rooeel Backend — Admin API

Minimal in-memory Admin module for authentication and user management.

Important notes

- Data is stored in memory. Restarting the server clears admins and sessions.
- Validation uses `class-validator` / `class-transformer`. Ensure ValidationPipe is enabled.
- Tokens are simple random hex strings stored in-memory (no JWT). Use `Authorization: Bearer <token>`.

Requirements

- Node.js (14+)
- npm or yarn
- Packages: class-validator, class-transformer, reflect-metadata (install below)

Install

```powershell
cd /d d:\rooeel-backend
npm install
npm install class-validator class-transformer reflect-metadata
# or
# yarn
# yarn install
# yarn add class-validator class-transformer reflect-metadata
```

Enable validation (example in `src/main.ts`)

```ts
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  await app.listen(3000);
}
```

Run

```powershell
cd /d d:\rooeel-backend
npm run start:dev
```

API (base path: /admin)

- All request/response bodies are JSON.

1. Signup (create first admin)

- POST /admin/signup
- Body

```json
{
  "email": "admin@example.com",
  "password": "secret123",
  "name": "Optional Name"
}
```

- Notes: `email` and `password` are mandatory. Password min length 8.
- Response: sanitized admin `{ id, name?, email, role? }`

2. Login

- POST /admin/login
- Body

```json
{ "email": "admin@example.com", "password": "secret123" }
```

- Response:

```json
{
  "token": "<token>",
  "user": { "id": "...", "email": "...", "name": "...", "role": "..." }
}
```

3. Logout

- POST /admin/logout
- Header: `Authorization: Bearer <token>`
- Response: `{ "success": true }`

4. Profile (validate token)

- GET /admin/profile
- Header: `Authorization: Bearer <token>`
- Response: sanitized admin

5. Create user (admin-only endpoints are not protected by a guard in this minimal implementation — caller must implement auth guard if desired)

- POST /admin/users
- Body

```json
{
  "name": "User",
  "email": "user@example.com",
  "password": "optionalPass",
  "role": "admin|user"
}
```

- If `password` omitted a generated password will be returned in response: `{ ...user, generatedPassword: "..." }`

6. Set user password (admin action)

- PUT /admin/users/:id/password
- Body

```json
{ "password": "newSecret123" }
```

- Response: sanitized user

7. Reset password by email (admin action)

- POST /admin/users/reset-password
- Body

```json
{ "email": "user@example.com" }
```

- Response includes generated password: `{ ...user, newPassword: "..." }`

8. Delete user

- DELETE /admin/users/:id
- Response: sanitized deleted user

9. Assign role

- POST /admin/users/:id/role
- Body

```json
{ "role": "admin" }
```

- Response: sanitized user with updated role

Validation & DTOs

- DTO files are under `src/admin/dto/` (signup, login, create, update-password, reset-password, assign-role, admin-response).
- The ValidationPipe must be enabled to enforce class-validator rules.

Security & Production notes

- Replace in-memory storage with a persistent database.
- Replace token storage with secure JWT/session store.
- Add proper authentication/authorization guards for admin-only endpoints.
- Do not return plaintext passwords in production. Use email flows or secure reset links.

Example curl flows

- Signup

```bash
curl -X POST http://localhost:3000/admin/signup -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"secret123"}'
```

- Login

```bash
curl -X POST http://localhost:3000/admin/login -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"secret123"}'
```

- Create user (example)

```bash
curl -X POST http://localhost:3000/admin/users -H "Content-Type: application/json" -d '{"name":"User","email":"user@example.com"}'
```

Files of interest

- src/admin/admin.service.ts — core logic (in-memory users, tokens)
- src/admin/admin.controller.ts — routes
- src/admin/dto/\* — DTOs and validation

If you want I can:

- Add an auth guard that validates token header automatically.
- Replace tokens with JWT.
- Persist admins using Prisma / TypeORM.
