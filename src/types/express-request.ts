import type { AuthenticatedRequestUser } from "./auth.types";

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedRequestUser;
    }
  }
}

export {};
