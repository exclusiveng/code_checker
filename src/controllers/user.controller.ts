import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/data-source';
import { User, UserRole } from '../entities/user.entity';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import * as bcrypt from 'bcryptjs';

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password, role, companyId } = req.body as {
    name?: string; email?: string; password?: string; role?: UserRole; companyId?: string;
  };

  if (!req.user) return next(new BadRequestError('Authenticated user not found'));

  // Admins can only create users in their own company; super_admin can choose companyId
  const targetCompanyId = req.user.role === UserRole.SUPER_ADMIN ? (companyId || req.user.companyId) : req.user.companyId;
  if (!targetCompanyId) return next(new BadRequestError('Target company not determined'));

  if (req.user.role !== UserRole.SUPER_ADMIN && req.user.companyId !== targetCompanyId) {
    return next(new ForbiddenError('Cannot create user for another company'));
  }

  if (!name || !email || !password) {
    return next(new BadRequestError('Missing required fields'));
  }

  const userRepository = AppDataSource.getRepository(User);
  const existing = await userRepository.findOne({ where: { email } });
  if (existing) return next(new BadRequestError('Email already in use'));

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = userRepository.create({
    name,
    email,
    passwordHash,
    role: role || UserRole.DEVELOPER,
    companyId: targetCompanyId,
  });

  await userRepository.save(newUser);
  res.status(201).json(newUser);
};


