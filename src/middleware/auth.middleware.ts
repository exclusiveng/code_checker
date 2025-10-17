import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service';
import { AppDataSource } from '../config/data-source';
import { User, UserRole } from '../entities/user.entity';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No token provided'));
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return next(new UnauthorizedError('Invalid token'));
  }

  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { id: decoded.id } });

  if (!user) {
    return next(new UnauthorizedError('User not found'));
  }

  req.user = user;
  next();
};

export const roleMiddleware = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
};
