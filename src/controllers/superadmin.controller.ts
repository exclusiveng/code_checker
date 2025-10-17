import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/data-source';
import { Company } from '../entities/company.entity';
import { User, UserRole } from '../entities/user.entity';
import { BadRequestError } from '../utils/errors';
import * as bcrypt from 'bcryptjs';

export const createSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const { companyName, name, email, password } = req.body as { companyName?: string; name?: string; email?: string; password?: string };

  if (!companyName || !name || !email || !password) {
    return next(new BadRequestError('Missing required fields'));
  }

  const companyRepository = AppDataSource.getRepository(Company);
  const userRepository = AppDataSource.getRepository(User);

  let company = await companyRepository.findOne({ where: { name: companyName } });
  if (!company) {
    company = companyRepository.create({ name: companyName });
    await companyRepository.save(company);
  }

  const existingUser = await userRepository.findOne({ where: { email } });
  if (existingUser) {
    return next(new BadRequestError('User with this email already exists'));
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = userRepository.create({
    name,
    email,
    passwordHash,
    role: UserRole.SUPER_ADMIN,
    companyId: company.id,
  });

  await userRepository.save(newUser);

  res.status(201).json({ company, user: newUser });
};


