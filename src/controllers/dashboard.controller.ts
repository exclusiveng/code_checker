import { Request, Response, NextFunction } from 'express';
import { User } from '../entities/user.entity';

interface AuthRequest extends Request {
  user?: User; // Make user optional to align with Express's Request type
}

/**
 * @desc    Get current logged-in user details
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // The user object is attached by the `protect` middleware.
  // We can be confident it exists here, but this check satisfies TypeScript.
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  res.status(200).json({ success: true, user: req.user });
};