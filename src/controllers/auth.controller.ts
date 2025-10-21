import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/data-source';
import { User, UserRole } from '../entities/user.entity';
import { Company } from '../entities/company.entity';
import { signToken } from '../services/auth.service';
import { BadRequestError } from '../utils/errors';
import * as bcrypt from 'bcryptjs';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.body) {
    return next(new BadRequestError('Missing request body'));
  }

  const { name, email, password, companyName } = req.body;

  if (!name || !email || !password) {
    return next(new BadRequestError('Missing required fields'));
  }

  const userRepository = AppDataSource.getRepository(User);
  const userCount = await userRepository.count();
  const isFirstUser = userCount === 0;

  // companyName is required so we can associate the new user with a company.
  if (!companyName) {
    return next(new BadRequestError('Missing required fields'));
  }
  const existingUser = await userRepository.findOne({ where: { email } });

  if (existingUser) {
    return next(new BadRequestError('User with this email already exists'));
  }

  const companyRepository = AppDataSource.getRepository(Company);
  // find or create the company by name
  let company = await companyRepository.findOne({ where: { name: companyName } });
  if (!company) {
    company = companyRepository.create({ name: companyName });
    await companyRepository.save(company);
  }

  // If this is the first user for this company, promote them to SUPER_ADMIN
  const companyUserCount = await userRepository.count({ where: { companyId: company.id } });
  const isFirstForCompany = companyUserCount === 0;

  const passwordHash = await bcrypt.hash(password, 10);

  const role = isFirstForCompany ? UserRole.SUPER_ADMIN : UserRole.DEVELOPER;

  const newUser = userRepository.create({
    name,
    email,
    passwordHash,
    companyId: company.id,
    role,
  });

  const saved = await userRepository.save(newUser);

  // Sign a token so the frontend can auto-login after registering the first admin
  const token = signToken(saved);
  const { passwordHash: _ph, ...userToSend } = saved as any;

  res.status(201).json({ token, user: userToSend });
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.body) {
    return next(new BadRequestError('Missing request body'));
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    return next(new BadRequestError('Missing email or password'));
  }

  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { email } });

  if (!user) {
    return next(new BadRequestError('Invalid credentials'));
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    return next(new BadRequestError('Invalid credentials'));
  }

  const token = signToken(user);

  const { passwordHash, ...userToSend } = user;

  res.json({ token, user: userToSend });
};
