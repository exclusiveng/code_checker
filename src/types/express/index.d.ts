// Use a type-only import to avoid bringing runtime code into a declaration file
// Ambient module augmentation for Express Request to include `user`.
// Use an inline type import so this file stays a pure declaration file and
// TypeScript correctly merges the Express namespace.
declare global {
  namespace Express {
    interface Request {
      // import type inline to avoid top-level import in a declaration file
      user?: import('../../entities/user.entity').User;
    }
  }
}

export {};
