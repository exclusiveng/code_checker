import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/data-source';
import { Project } from '../entities/project.entity';
import { RuleSet } from '../entities/ruleset.entity';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import { In } from 'typeorm';

export const createProject = async (req: Request, res: Response, next: NextFunction) => {
  const { id: companyId } = req.params;
  const { name, repoUrl, rulesetIds } = req.body as { name?: string; repoUrl?: string; rulesetIds?: string[] };

  if (!req.user) return next(new BadRequestError('Authenticated user not found'));
  if (req.user.companyId !== companyId) return next(new ForbiddenError('Cannot create project for another company'));

  if (!name || !repoUrl) {
    return next(new BadRequestError('Missing required fields'));
  }

  const projectRepository = AppDataSource.getRepository(Project);
  const rulesetRepository = AppDataSource.getRepository(RuleSet);

  let rulesets: RuleSet[] = [];
  if (rulesetIds && rulesetIds.length > 0) {
    rulesets = await rulesetRepository.findBy({ id: In(rulesetIds), companyId });
    if (rulesets.length !== rulesetIds.length) {
      return next(new BadRequestError('One or more invalid rulesetIds provided.'));
    }
  }

  // generate a slug/id from name to be used as a human-friendly identifier
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  let slug = baseSlug;
  let attempt = 0;
  while (await projectRepository.findOne({ where: { companyId, slug } })) {
    attempt++;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    if (attempt > 5) break; // avoid infinite loop
  }

  const project = projectRepository.create({ name, repoUrl, companyId, rulesets, slug });
  await projectRepository.save(project);

  res.status(201).json(project);
};

export const getProjects = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return next(new BadRequestError('Authenticated user not found'));

  const companyId = req.user.companyId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const projectRepository = AppDataSource.getRepository(Project);

  const [projects, total] = await projectRepository.findAndCount({
    where: { companyId },
    relations: ['rulesets'],
    order: { createdAt: 'DESC' },
    take: limit,
    skip,
  });

  res.json({
    data: projects,
    meta: {
      total,
      page,
      last_page: Math.ceil(total / limit),
    },
  });
};
