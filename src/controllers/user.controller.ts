import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/data-source';
import { User, UserRole } from '../entities/user.entity';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import * as bcrypt from 'bcryptjs';
import { tryCatch } from 'bullmq';

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

    // Admins can only see users in their own company.
    if (req.user.role === UserRole.ADMIN) {
      if (!req.user.companyId) {
        return next(new BadRequestError('Authenticated user has no company'));
      }
      where.companyId = req.user.companyId;
    } else if (req.user.role !== UserRole.SUPER_ADMIN) {
      // Non-admin/super_admin roles cannot list users.
      return next(new ForbiddenError('Insufficient permissions.'));
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

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id: userIdToUpdate } = req.params;
    const { name, role } = req.body as { name?: string; role?: UserRole };
    const authenticatedUser = req.user;

    if (!authenticatedUser) {
      return next(new ForbiddenError('Authentication required.'));
    }

    const userRepository = AppDataSource.getRepository(User);
    const userToUpdate = await userRepository.findOneBy({ id: userIdToUpdate });

    if (!userToUpdate) {
      return next(new NotFoundError(`User with ID ${userIdToUpdate} not found.`));
    }

    // Permission checks
    if (authenticatedUser.role === UserRole.ADMIN) {
      if (
        userToUpdate.companyId !== authenticatedUser.companyId || // Can't edit users outside their company
        userToUpdate.role === UserRole.SUPER_ADMIN || // Can't edit a super_admin
        (userToUpdate.role === UserRole.ADMIN && userToUpdate.id !== authenticatedUser.id) || // Can't edit other admins
        role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN // Can't promote users to admin
      ) {
        return next(new ForbiddenError('Insufficient permissions to edit this user or assign this role.'));
      }
    } else if (authenticatedUser.role !== UserRole.SUPER_ADMIN) {
      return next(new ForbiddenError('Insufficient permissions.'));
    }

    // Apply updates
    if (name) userToUpdate.name = name;
    if (role) userToUpdate.role = role;

    await userRepository.save(userToUpdate);

    // Omit passwordHash from the response
    const { passwordHash, ...userResponse } = userToUpdate;
    res.json(userResponse);
  } catch (err) {
    return next(err);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id: userIdToDelete } = req.params;
    const authenticatedUser = req.user;

    if (!authenticatedUser) {
      return next(new ForbiddenError('Authentication required.'));
    }

    if (userIdToDelete === authenticatedUser.id) {
      return next(new ForbiddenError('You cannot delete your own account.'));
    }

    const userRepository = AppDataSource.getRepository(User);
    const userToDelete = await userRepository.findOneBy({ id: userIdToDelete });

    if (!userToDelete) {
      return next(new NotFoundError(`User with ID ${userIdToDelete} not found.`));
    }

    // Permission check
    if (authenticatedUser.role === UserRole.ADMIN) {
      // Admins can only delete non-admin users in their own company
      if (
        userToDelete.companyId !== authenticatedUser.companyId ||
        userToDelete.role === UserRole.ADMIN ||
        userToDelete.role === UserRole.SUPER_ADMIN
      ) {
        return next(
          new ForbiddenError('Insufficient permissions to delete this user.'),
        );
      }
    } else if (authenticatedUser.role !== UserRole.SUPER_ADMIN) {
      // Only admins and super_admins can delete users
      return next(new ForbiddenError('Insufficient permissions.'));
    }

    await userRepository.remove(userToDelete);

    res.status(204).send();
  } catch (err) {
    return next(err);
  }
};