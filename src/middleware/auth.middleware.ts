import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/data-source';
import { User, UserRole } from '../entities/user.entity';
import { AppError } from '../utils/errors';
import { verifyToken } from '../services/auth.service';

interface AuthRequest extends Request {
  user?: User;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = verifyToken(token);

      if (!decoded || !decoded.id) {
        return next(new AppError('Not authorized, token failed', 401));
      }

      const userRepository = AppDataSource.getRepository(User);
      const currentUser = await userRepository.findOneBy({ id: decoded.id });

      if (!currentUser) {
        return next(
          new AppError(
            'User belonging to this token does no longer exist.',
            401,
          ),
        );
      }

      req.user = currentUser;
      return next();
    } catch (error) {
      return next(new AppError('Not authorized, token failed', 401));
    }
  }

  if (!token) {
    return next(new AppError('Not authorized, no token', 401));
  }
};

export const roleMiddleware = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new AppError('Authentication error, user not found on request.', 401),
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403),
      );
    }
    next();
  };
};

// Alias for better naming consistency
export const authenticate = protect;
