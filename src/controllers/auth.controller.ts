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

  if (!name || !email || !password || !companyName) {
    return next(new BadRequestError('Missing required fields'));
  }

  const userRepository = AppDataSource.getRepository(User);
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

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = userRepository.create({
    name,
    email,
    passwordHash,
    companyId: company.id,
    role: UserRole.DEVELOPER,
  });

  await userRepository.save(newUser);

  res.status(201).json({ message: 'User created successfully' });
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

  res.json({ token });
};
