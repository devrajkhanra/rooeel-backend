export const PermissionToken = {
  ProjectCreate: 'project:create',
  ProjectRead: 'project:read',
  ProjectConfigure: 'project:configure',
  MemberAssign: 'project:member:assign',
  RoleManage: 'role:manage',
  DocumentRead: 'document:read',
  DocumentManage: 'document:manage',
} as const;

export type PermissionTokenValue =
  (typeof PermissionToken)[keyof typeof PermissionToken];

export const SYSTEM_PERMISSIONS: Array<{
  token: PermissionTokenValue;
  description: string;
}> = [
  { token: PermissionToken.ProjectCreate, description: 'Create projects.' },
  { token: PermissionToken.ProjectRead, description: 'Read project details.' },
  {
    token: PermissionToken.ProjectConfigure,
    description: 'Manage project feature configuration.',
  },
  {
    token: PermissionToken.MemberAssign,
    description: 'Assign users and roles inside a project.',
  },
  { token: PermissionToken.RoleManage, description: 'Manage project roles.' },
  {
    token: PermissionToken.DocumentRead,
    description: 'Read project documents and attachments.',
  },
  {
    token: PermissionToken.DocumentManage,
    description: 'Create document records and upload attachments.',
  },
];

export const DEFAULT_PROJECT_ROLES = [
  {
    name: 'Unassigned',
    description: 'Placeholder role for users awaiting department and role mapping.',
    permissions: [],
  },
  {
    name: 'Project Admin',
    description: 'Full control over project configuration and setup.',
    permissions: Object.values(PermissionToken),
  },
  {
    name: 'Project Editor',
    description: 'Manages project metadata and documents.',
    permissions: [
      PermissionToken.ProjectRead,
      PermissionToken.DocumentRead,
      PermissionToken.DocumentManage,
    ],
  },
  {
    name: 'Project Viewer',
    description: 'Reads project details and documents.',
    permissions: [
      PermissionToken.ProjectRead,
      PermissionToken.DocumentRead,
    ],
  },
] as const;
