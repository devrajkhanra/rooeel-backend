# Rooeel Backend

Rooeel Backend is a focused NestJS GraphQL API for one clean workflow:

1. register the admin
2. log in
3. create a project
4. run the project's tendering phase stage by stage
5. capture dated tender records inside each stage
6. attach supporting documents to tender stages or dated tender records

The stale project-editing, user-management, and non-tendering ERP flows have
been removed from the active API path so the backend and frontend now share the
same scope.

## Scope

The current product scope is intentionally narrow:

- admin authentication
- project creation
- tendering workflow management
- tender-stage and tender-record document upload and download

Everything else is out of scope for this version.

## Architecture

The API follows a simple, explicit design:

- `auth`
  Handles admin registration, login, refresh tokens, logout, and `me`.
- `authorization`
  Enforces project-scoped permissions for the active admin workspace.
- `projects`
  Owns project creation and the tendering phase lifecycle.
- `documents`
  Owns stage-document records plus attachment upload and download URLs.
- core infrastructure
  Prisma, PostgreSQL, Redis, MinIO, and GraphQL.

## Tendering Workflow

Every new project starts with `status: TENDERING`.

Each new project is seeded with these ordered tender stages:

1. `TENDER_RECEIVED`
2. `SITE_VISIT`
3. `PREBID_QUERY`
4. `TENDER_SUBMISSION`
5. `CLARIFICATION`
6. `AUCTION`
7. `NEGOTIATION`
8. `LOI_AWARDED`

Each stage has one of these statuses:

- `NOT_STARTED`
- `IN_PROGRESS`
- `COMPLETED`
- `SKIPPED`

Workflow rules:

- stages are strictly ordered
- a later stage cannot move until all earlier stages are either `COMPLETED` or `SKIPPED`
- if a stage does not apply, skip it
- if a stage applies, complete it before moving forward
- skipped stages cannot accept documents or dated tender records
- documents can belong directly to tender stages through owner type `PROJECT_TENDER_STAGE`
- documents can belong to dated tender records through owner type `PROJECT_TENDER_STAGE_EVENT`

### Dated Tender Records

Each tender stage can hold dated records. A record stores:

- `eventType`
- `eventDate`
- optional `note`
- zero or more supporting documents

Supported records by stage:

| Stage | Records |
| --- | --- |
| `TENDER_RECEIVED` | `TENDER_RECEIVED` |
| `SITE_VISIT` | `SITE_VISIT` |
| `PREBID_QUERY` | `PREBID_QUERY_SENT`, `PREBID_QUERY_RESPONSE` |
| `TENDER_SUBMISSION` | `TENDER_TECHNICAL_SUBMISSION`, `TENDER_PRICE_SUBMISSION` |
| `CLARIFICATION` | `CLARIFICATION_SENT`, `CLARIFICATION_RECEIVED` |
| `AUCTION` | `AUCTION` |
| `NEGOTIATION` | `NEGOTIATION` |
| `LOI_AWARDED` | `LOI_AWARDED` |

Repeatable records:

- `PREBID_QUERY_SENT`
- `PREBID_QUERY_RESPONSE`
- `CLARIFICATION_SENT`
- `CLARIFICATION_RECEIVED`

This supports real-world client workflows where multiple query/response or
clarification rounds happen before moving to the next tendering stage.

## Data Model

The current database schema contains only the entities needed for this flow:

- `User`
- `Project`
- `ProjectConfiguration`
- `ProjectTenderStage`
- `ProjectTenderStageEvent`
- `ProjectMember`
- `ProjectRole`
- `Permission`
- `RolePermission`
- `RefreshSession`
- `Document`
- `DocumentAttachment`

`ProjectStatus` has been simplified to `TENDERING`. Stage progression is tracked
through `ProjectTenderStage`, not by moving the project across multiple project
status enums.

## GraphQL API

GraphQL is exposed at [http://localhost:3000/graphql](http://localhost:3000/graphql).

### Auth

Available operations:

- `registerAdmin`
- `login`
- `refreshToken`
- `logout`
- `me`

`registerAdmin` accepts only:

- `firstName`
- `lastName`
- `email`
- `password`

Example:

```graphql
mutation RegisterAdmin($input: RegisterAdminInput!) {
  registerAdmin(input: $input) {
    accessToken
    refreshToken
    expiresInSeconds
    user {
      id
      email
      firstName
      lastName
      status
      createdAt
    }
  }
}
```

Example variables:

```json
{
  "input": {
    "firstName": "Ava",
    "lastName": "Patel",
    "email": "admin@example.com",
    "password": "super-secret-password"
  }
}
```

### Projects

Available operations:

- `createProject`
- `updateProject`
- `deleteProject`
- `myProjects`
- `activeProject`
- `tenderStages`
- `tenderStage`
- `startTenderStage`
- `completeTenderStage`
- `skipTenderStage`
- `createTenderStageEvent`
- `createTenderStageEventDocument`
- `createTenderStageDocument`

#### Create Project

```graphql
mutation CreateProject($input: CreateProjectInput!) {
  createProject(input: $input) {
    id
    name
    description
    status
    tenderStages {
      id
      stage
      sequence
      status
    }
  }
}
```

Variables:

```json
{
  "input": {
    "title": "Metro Package",
    "description": "Civil and structural bid package"
  }
}
```

#### Edit Project

Send the selected project id in the `x-project-id` header. The same project id
is also required in the input as a safety check.

```graphql
mutation UpdateProject($input: UpdateProjectInput!) {
  updateProject(input: $input) {
    id
    name
    description
    status
  }
}
```

Variables:

```json
{
  "input": {
    "projectId": "cm123example",
    "title": "Updated Metro Package",
    "description": "Updated civil and structural bid package"
  }
}
```

#### Delete Project

Send the selected project id in the `x-project-id` header.

Deleting a project permanently removes its tender stages, dated records,
documents, attachments metadata, roles, and memberships through cascading
relations.

```graphql
mutation DeleteProject {
  deleteProject
}
```

#### Load Active Project Workspace

Send the selected project id in the `x-project-id` header.

```graphql
query ProjectWorkspace {
  activeProject {
    id
    name
    description
    status
    tenderStages {
      id
      projectId
      stage
      sequence
      status
      note
      startedAt
      completedAt
      skippedAt
      createdAt
      updatedAt
      documents {
        id
        projectId
        ownerType
        ownerId
        title
        description
        status
        attachments {
          id
          projectId
          documentId
          objectKey
          fileName
          contentType
          sizeBytes
          uploadedById
          uploadedAt
        }
      }
      events {
        id
        projectId
        stageId
        eventType
        eventDate
        note
        sequence
        createdAt
        updatedAt
        documents {
          id
          projectId
          ownerType
          ownerId
          title
          description
          status
          attachments {
            id
            projectId
            documentId
            objectKey
            fileName
            contentType
            sizeBytes
            uploadedById
            uploadedAt
          }
        }
      }
    }
  }
}
```

#### Start, Complete, or Skip a Stage

```graphql
mutation StartTenderStage($input: UpdateTenderStageInput!) {
  startTenderStage(input: $input) {
    id
    stage
    status
    startedAt
  }
}
```

```graphql
mutation CompleteTenderStage($input: UpdateTenderStageInput!) {
  completeTenderStage(input: $input) {
    id
    stage
    status
    completedAt
  }
}
```

```graphql
mutation SkipTenderStage($input: UpdateTenderStageInput!) {
  skipTenderStage(input: $input) {
    id
    stage
    status
    skippedAt
  }
}
```

Example variables:

```json
{
  "input": {
    "stageId": "cm123example"
  }
}
```

#### Create a Tender Stage Document

```graphql
mutation CreateTenderStageDocument($input: CreateTenderStageDocumentInput!) {
  createTenderStageDocument(input: $input) {
    id
    projectId
    ownerType
    ownerId
    title
  }
}
```

Variables:

```json
{
  "input": {
    "stageId": "cm123example",
    "title": "Site Visit Report",
    "description": "Signed observations from the site visit"
  }
}
```

#### Create a Dated Tender Record

Use `createTenderStageEvent` to capture dates such as tender received date,
site visit date, pre-bid query sent/response dates, technical and price
submission dates, clarification dates, auction date, negotiation date, and LOI
awarded date.

```graphql
mutation CreateTenderStageEvent($input: CreateTenderStageEventInput!) {
  createTenderStageEvent(input: $input) {
    id
    projectId
    stageId
    eventType
    eventDate
    note
    sequence
    documents {
      id
      title
    }
  }
}
```

Variables:

```json
{
  "input": {
    "stageId": "cm123example",
    "eventType": "PREBID_QUERY_SENT",
    "eventDate": "2026-06-11",
    "note": "First pre-bid query round sent to client"
  }
}
```

#### Create a Dated Tender Record Document

After creating a dated tender record, create one or more document records under
that event, then use the normal attachment upload flow.

```graphql
mutation CreateTenderStageEventDocument($input: CreateTenderStageEventDocumentInput!) {
  createTenderStageEventDocument(input: $input) {
    id
    projectId
    ownerType
    ownerId
    title
  }
}
```

Variables:

```json
{
  "input": {
    "eventId": "cm456event",
    "title": "Pre-bid query round 1.pdf",
    "description": "Supporting document for the first pre-bid query sent date"
  }
}
```

### Attachments

Available operations:

- `requestAttachmentUpload`
- `confirmAttachmentUpload`
- `attachmentDownloadUrl`

Attachment flow:

1. create a tender-stage document record or tender-stage-event document record
2. call `requestAttachmentUpload`
3. upload the file to the returned presigned URL
4. call `confirmAttachmentUpload`
5. later, call `attachmentDownloadUrl` to download it

#### Request Upload

```graphql
mutation RequestAttachmentUpload($input: RequestAttachmentUploadInput!) {
  requestAttachmentUpload(input: $input) {
    objectKey
    uploadUrl
    expiresInSeconds
  }
}
```

#### Confirm Upload

```graphql
mutation ConfirmAttachmentUpload($input: ConfirmAttachmentUploadInput!) {
  confirmAttachmentUpload(input: $input) {
    id
    fileName
    uploadedAt
  }
}
```

#### Download Attachment

```graphql
query AttachmentDownloadUrl($attachmentId: String!) {
  attachmentDownloadUrl(attachmentId: $attachmentId) {
    downloadUrl
    expiresInSeconds
  }
}
```

## Running Locally

The frontend lives in the sibling repository:

- backend: `C:\Users\Devraj\Documents\rooeel-backend`
- frontend: `C:\Users\Devraj\Documents\rooeel-frontend`

### 1. Start infrastructure

From the backend repo:

```bash
npm run infra:up
```

This starts:

- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- MinIO on `localhost:9000`
- MinIO console on `localhost:9001`

### 2. Sync Prisma schema

For a clean reset after the stale-code cleanup:

```bash
npx prisma db push --force-reset --skip-generate
npx prisma generate
```

If you already have a clean local database and only need a normal sync:

```bash
npm run db:push
```

### 3. Run the API

To run only the backend API:

```bash
npm run start:dev
```

The API will be available at:

- [http://localhost:3000/graphql](http://localhost:3000/graphql)

### 4. Run the frontend

From the frontend repo:

```bash
npm run dev
```

The frontend will connect to:

- `http://localhost:3000/graphql`

### 5. Run both from the backend repo

If you want the backend and frontend together:

```bash
npm run dev
```

That command:

1. starts Docker infra
2. generates the Prisma client
3. runs the backend watcher
4. runs the frontend dev server from the sibling repo

## Useful Commands

From the backend repo:

```bash
npm run infra:up
npm run infra:down
npm run infra:restart
npm run infra:logs
npm run build
npm test
npx prisma validate
npm run db:push
```

From the frontend repo:

```bash
npm run build
```

## Current Frontend Behavior

The frontend now matches the backend scope:

- admin register or login
- create a project
- open the project workspace
- move through tender stages
- add dated tender records under each stage
- create tender-stage and tender-record documents
- upload and download stage/event attachments

Removed from the active frontend flow:

- users page
- project editing UI
- document edit and delete UI
- unrelated ERP navigation

## Notes

- use Docker, not Podman
- if the database was created from older schemas, prefer `prisma db push --force-reset`
- the frontend must send `x-project-id` for project-scoped queries and mutations
- attachment storage uses MinIO through presigned URLs
