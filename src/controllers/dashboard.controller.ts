import { Request, Response, NextFunction } from 'express';
import { User } from '../entities/user.entity';

interface AuthRequest extends Request {
  user?: User; 
}

/**
 * @desc    Get current logged-in user details
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  res.status(200).json({ success: true, user: req.user });
};