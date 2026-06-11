import { Request } from 'express';

export type GraphqlContext = {
  req: Request & {
    user?: AuthenticatedUser;
    projectId?: string;
  };
};

export type AuthenticatedUser = {
  sub: string;
  email: string;
};
