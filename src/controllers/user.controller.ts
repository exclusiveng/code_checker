import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/data-source';
import { User, UserRole } from '../entities/user.entity';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import * as bcrypt from 'bcryptjs';

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Guard against undefined req.body (can happen if body-parser isn't applied
  // or Content-Type is missing). Default to an empty object so destructuring
  // doesn't throw.
  const body = (req.body || {}) as {
    name?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    companyId?: string;
  };
  const { name, email, password, role, companyId } = body;

  if (!req.user)
    return next(new BadRequestError('Authenticated user not found'));

  // Admins can only create users in their own company; super_admin can choose companyId
  const targetCompanyId =
    req.user.role === UserRole.SUPER_ADMIN
      ? companyId || req.user.companyId
      : req.user.companyId;
  if (!targetCompanyId)
    return next(new BadRequestError('Target company not determined'));

  if (
    req.user.role !== UserRole.SUPER_ADMIN &&
    req.user.companyId !== targetCompanyId
  ) {
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

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user)
      return next(new BadRequestError('Authenticated user not found'));

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const userRepository = AppDataSource.getRepository(User);
    const where: { companyId?: string } = {};

    // Super admin can see all users, Admins can see users in their own company
    if (req.user.role === UserRole.ADMIN) {
      if (!req.user.companyId)
        return next(new BadRequestError('Authenticated user has no company'));
      where.companyId = req.user.companyId;
    } else if (req.user.role !== UserRole.SUPER_ADMIN) {
      // Other roles are not allowed to list users
      return next(new ForbiddenError('Insufficient permissions to list users'));
    }

    const [users, total] = await userRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip,
    });

    return res.json({
      users,
      pagination: {
        total,
        page,
        limit,
      },
    });
  } catch (err) {
    return next(err);
  }
};
