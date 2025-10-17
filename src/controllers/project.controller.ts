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

  const project = projectRepository.create({ name, repoUrl, companyId, rulesets });
  await projectRepository.save(project);

  res.status(201).json(project);
};
