# Frontend Requirements Tracking

**Backend Repo:** `rooeel-backend` (this repo)
**Frontend Repo:** `C:/Users/Devraj/Documents/rooeel-frontend`
**Generated:** 2026-05-16

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Implemented & Working |
| 🔄 | Partially Implemented |
| ⏳ | Not Started |
| 🚫 | Not Needed |

---

## API → Frontend Mapping

### 1. Authentication (Auth Service)

| Backend Endpoint | Frontend Service | Frontend Page/Component | Status |
|------------------|-------------------|------------------------|--------|
| POST /auth/login | auth.service.ts: login() | LoginPage.tsx | ✅ |
| POST /auth/signup | auth.service.ts: signup() | SignupPage.tsx | ✅ |
| POST /auth/refresh | api.client.ts (interceptor) | - | ✅ |
| POST /auth/logout | auth.service.ts: logout() | - | ✅ |
| POST /auth/admin/signup | auth.service.ts: adminSignup() | SignupPage.tsx | ✅ |

### 2. Admin Management (Admin Service)

| Backend Endpoint | Frontend Service | Frontend Page/Component | Status |
|------------------|-------------------|------------------------|--------|
| GET /admin/:id | admin.service.ts: getAdmin() | - | ✅ |
| PATCH /admin/:id | admin.service.ts: updateAdmin() | AdminEditPage.tsx | ✅ |
| PATCH /admin/:id/reset-password | admin.service.ts: resetUserPassword() | - | ⏳ |
| GET /admin/requests | admin.service.ts: getRequests() | AdminRequestsPage.tsx | ✅ |
| PATCH /admin/requests/:id/approve | admin.service.ts: approveRequest() | AdminRequestsPage.tsx | ✅ |
| PATCH /admin/requests/:id/reject | admin.service.ts: rejectRequest() | AdminRequestsPage.tsx | ✅ |

### 3. User Management (User Service)

| Backend Endpoint | Frontend Service | Frontend Page/Component | Status |
|------------------|-------------------|------------------------|--------|
| POST /user | user.service.ts: createUser() | CreateUserForm.tsx | ✅ |
| GET /user | user.service.ts: getAllUsers() | UserListPage.tsx | ✅ |
| GET /user/:id | user.service.ts: getUserById() | - | ✅ |
| PATCH /user/:id | user.service.ts: updateUser() | UserListPage.tsx | ✅ |
| DELETE /user/:id | user.service.ts: deleteUser() | - | ⏳ |
| PATCH /user/me/profile | user.service.ts: updateMyProfile() | - | ⏳ |
| PATCH /user/me/change-password | user.service.ts: changeMyPassword() | - | ⏳ |
| PATCH /user/:id/reset-password | user.service.ts: resetPassword() | ResetPasswordModal.tsx | ✅ |

### 4. Project Management (Project Service)

| Backend Endpoint | Frontend Service | Frontend Page/Component | Status |
|------------------|-------------------|------------------------|--------|
| POST /project | project.service.ts: createProject() | CreateProjectPage.tsx | ✅ |
| GET /project | project.service.ts: getAllProjects() | DashboardPage.tsx | ✅ |
| GET /project/:id | project.service.ts: getProjectById() | ProjectDetailPage.tsx | ✅ |
| PATCH /project/:id | project.service.ts: updateProject() | ProjectDetailPage.tsx | ✅ |
| DELETE /project/:id | project.service.ts: deleteProject() | - | ⏳ |
| POST /project/:id/assign-user | project.service.ts: assignUser() | UserAssignmentModal.tsx | ✅ |
| DELETE /project/:id/remove-user/:userId | project.service.ts: removeUser() | UserAssignmentModal.tsx | ✅ |
| POST /project/:id/work-order | project.service.ts: uploadWorkOrder() | CreateProjectPage.tsx | ✅ |
| GET /project/:id/fields | project.service.ts: getProjectFields() | ProjectDetailPage.tsx | ✅ |
| PUT /project/:id/fields | project.service.ts: updateProjectFields() | - | ⏳ |

### 5. Task Management (Task Service)

| Backend Endpoint | Frontend Service | Frontend Page/Component | Status |
|------------------|-------------------|------------------------|--------|
| POST /task | task.service.ts: createTask() | - | ⏳ |
| GET /task | task.service.ts: getAllTasks() | - | ⏳ |
| GET /task/:id | task.service.ts: getTaskById() | - | ⏳ |
| PATCH /task/:id | task.service.ts: updateTask() | - | ⏳ |
| DELETE /task/:id | task.service.ts: deleteTask() | - | ⏳ |

### 6. Request / Change Management (Request Service)

| Backend Endpoint | Frontend Service | Frontend Page/Component | Status |
|------------------|-------------------|------------------------|--------|
| POST /request/create | request.service.ts: createRequest() | - | ⏳ |
| GET /request | request.service.ts: getMyRequests() | MyRequestsPage.tsx | ✅ |
| GET /request/:id | request.service.ts: getRequestById() | - | ✅ |
| POST /request/forgot-password | request.service.ts: forgotPassword() | LoginPage.tsx | ✅ |
| POST /request/reset-password | request.service.ts: resetPassword() | ResetPasswordPage.tsx | ✅ |

---

## Missing Features Summary

### High Priority (Blocking Users)

| Feature | Where Needed | Status |
|---------|--------------|--------|
| Create Project UI | DashboardPage or new page | ⏳ |
| Create Task UI | ProjectDetailPage | ⏳ |
| Task List/Board View | New page | ⏳ |
| View Work Order PDF | ProjectDetailPage | ⏳ |
| User Profile Page | - | ⏳ |
| Change My Password UI | User settings | ⏳ |

### Medium Priority

| Feature | Where Needed | Status |
|---------|--------------|--------|
| Delete User | UserListPage | ⏳ |
| Dynamic Field Form Builder | ProjectDetailPage | ⏳ |
| Task Status Updates | Task list | ⏳ |

### Low Priority

| Feature | Where Needed | Status |
|---------|--------------|--------|
| Admin Reset User Password UI | - | ⏳ |
| Bulk User Import | - | ⏳ |
| Project Reports/Charts | DashboardPage | ⏳ |

---

## Component Inventory

### Implemented

```
src/components/
├── ErrorBoundary.tsx ✅
├── admin/
│   ├── CreateUserForm.tsx ✅
│   └── NotificationBell.tsx ✅
├── auth/
│   └── ProtectedRoute.tsx ✅
├── project/
│   ├── ProjectCard.tsx ✅
│   └── UserAssignmentModal.tsx ✅
├── ui/
│   ├── Breadcrumbs.tsx ✅
│   ├── Dialog.tsx ✅
│   ├── Skeleton.tsx ✅
│   └── Table.tsx ✅
└── user/
    └── ResetPasswordModal.tsx ✅
```

### Not Yet Implemented

```
src/components/
├── project/
│   ├── ProjectForm.tsx         ⏳ (create/edit project)
│   ├── ProjectFieldEditor.tsx  ⏳ (dynamic fields)
│   ├── WorkOrderViewer.tsx     ⏳ (view PDF)
│   └── TaskCard.tsx           ⏳
├── task/
│   ├── TaskList.tsx           ⏳
│   ├── TaskForm.tsx           ⏳
│   └── TaskBoard.tsx          ⏳ (kanban view)
├── user/
│   ├── UserProfile.tsx        ⏳
│   └── PasswordChangeForm.tsx ⏳
└── layout/
    ├── Sidebar.tsx            ⏳ (if needed)
    └── Header.tsx             ⏳ (if needed)
```

---

## Pages Inventory

### Implemented

| Page | Path | Status |
|------|------|--------|
| LoginPage | /login | ✅ |
| SignupPage | /signup | ✅ |
| ResetPasswordPage | /reset-password | ✅ |
| DashboardPage | /dashboard | ✅ |
| ProjectDetailPage | /projects/:id | ✅ |
| AdminEditPage | /admin/edit | ✅ |
| AdminRequestsPage | /admin/requests | ✅ |
| UserListPage | /users | ✅ |
| UserProjectsPage | /my-projects | ✅ |
| MyRequestsPage | /my-requests | ✅ |
| NotFoundPage | /* | ✅ |

### Not Yet Implemented

| Page | Path | Purpose |
|------|------|---------|
| CreateProjectPage | /projects/new | Create new project |
| TaskListPage | /tasks | View all tasks |
| UserProfilePage | /profile | View/edit own profile |
| AdminDashboardPage | /admin/dashboard | Admin-specific dashboard |
| ProjectListPage (admin) | /admin/projects | All projects for admin |

---

## Next Steps

1. **Decide what to build next** — Pick from "Missing Features Summary"
2. **Start with Create Project** — Likely the biggest blocker
3. **Then Task Management** — Core functionality for 25-30 users