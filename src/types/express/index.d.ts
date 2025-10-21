declare global {
  namespace Express {
    interface Request {
      // import type inline to avoid top-level import in a declaration file
      user?: import('../../entities/user.entity').User;
    }
  }
}

export {};
