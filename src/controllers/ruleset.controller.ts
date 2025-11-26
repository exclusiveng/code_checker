import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/data-source';
import { RuleSet } from '../entities/ruleset.entity';
import { Rule } from '../entities/rule.entity';
import { BadRequestError } from '../utils/errors';
import { validateRulesArray } from '../utils/validator';

export const createRuleset = async (req: Request, res: Response, next: NextFunction) => {
  const { name, description, rules, projectId } = req.body;

  // Helpful debug logging for payload issues
  if (process.env.NODE_ENV !== 'production') {
    console.debug('createRuleset payload rules:', JSON.stringify(rules));
  }

  if (!name || !rules) {
    return next(new BadRequestError('Missing required fields'));
  }

  const validation = validateRulesArray(rules);
  if (!validation.valid) {
    return next(new BadRequestError('Invalid rules: ' + (validation.errors || []).join('; ')));
  }

  const rulesetRepository = AppDataSource.getRepository(RuleSet);
  const projectRepository = AppDataSource.getRepository(require('../entities/project.entity').Project);

  const companyId = req.user?.companyId;
  if (!companyId) return next(new BadRequestError('Authenticated user not found'));

  // Require projectId (UUID) to associate this ruleset with a project
  if (!projectId) return next(new BadRequestError('projectId is required for a ruleset'));
  const p = await projectRepository.findOne({ where: { id: projectId, companyId } });
  if (!p) return next(new BadRequestError('Invalid projectId'));
  const resolvedProjectId = p.id;

  const newRuleset = rulesetRepository.create({
    name,
    description,
    rules,
    companyId,
    projectId: resolvedProjectId,
  });
  try {
    await rulesetRepository.save(newRuleset);
    res.status(201).json(newRuleset);
  } catch (err: any) {
    console.error('Failed to save new ruleset:', err?.message || err);
    return next(new BadRequestError('Failed to save ruleset: ' + (err?.message || 'unknown error')));
  }
};

export const getRulesets = async (req: Request, res: Response, next: NextFunction) => {
  const rulesetRepository = AppDataSource.getRepository(RuleSet);
  const companyId = req.user?.companyId;
  if (!companyId) return next(new BadRequestError('Authenticated user not found'));

  const rulesets = await rulesetRepository.find({
    where: { companyId },
  });
  res.json(rulesets);
};

export const getRuleset = async (req: Request, res: Response, next: NextFunction) => {
  const rulesetRepository = AppDataSource.getRepository(RuleSet);
  const companyId = req.user?.companyId;
  if (!companyId) return next(new BadRequestError('Authenticated user not found'));

  const ruleset = await rulesetRepository.findOne({
    where: { id: req.params.id, companyId },
    relations: ['rules'],
  });
  if (!ruleset) {
    return next(new BadRequestError('Ruleset not found'));
  }
  res.json(ruleset);
};

export const updateRuleset = async (req: Request, res: Response, next: NextFunction) => {
  const rulesetRepository = AppDataSource.getRepository(RuleSet);
  const companyId = req.user?.companyId;
  if (!companyId) return next(new BadRequestError('Authenticated user not found'));

  const ruleset = await rulesetRepository.findOne({
    where: { id: req.params.id, companyId },
    relations: ['rules'],
  });
  if (!ruleset) {
    return next(new BadRequestError('Ruleset not found'));
  }

  const { name, description, rules } = req.body;

  if (process.env.NODE_ENV !== 'production') {
    console.debug('updateRuleset payload rules:', JSON.stringify(rules));
  }

  if (rules) {
    const validation = validateRulesArray(rules);
    if (!validation.valid) {
      return next(new BadRequestError('Invalid rules: ' + (validation.errors || []).join('; ')));
    }
    // Replace old rules with new ones. Cascade will handle inserts.
    ruleset.rules = rules.map((ruleData: any) => AppDataSource.getRepository(Rule).create(ruleData));
  }

  // Merge other properties
  rulesetRepository.merge(ruleset, { name, description });
  try {
    await rulesetRepository.save(ruleset);
  } catch (err: any) {
    console.error('Failed to update ruleset:', err?.message || err);
    return next(new BadRequestError('Failed to update ruleset: ' + (err?.message || 'unknown error')));
  }

  res.json(await rulesetRepository.findOne({ where: { id: ruleset.id }, relations: ['rules'] }));
};

export const deleteRuleset = async (req: Request, res: Response, next: NextFunction) => {
  const rulesetRepository = AppDataSource.getRepository(RuleSet);
  const companyId = req.user?.companyId;
  if (!companyId) return next(new BadRequestError('Authenticated user not found'));

  const ruleset = await rulesetRepository.findOne({
    where: { id: req.params.id, companyId },
    relations: ['rules'],
  });
  if (!ruleset) {
    return next(new BadRequestError('Ruleset not found'));
  }

  // Manually delete associated rules first to avoid foreign key constraint errors
  if (ruleset.rules && ruleset.rules.length > 0) {
    const ruleRepository = AppDataSource.getRepository(Rule);
    await ruleRepository.remove(ruleset.rules);
  }

  await rulesetRepository.remove(ruleset);

  res.status(204).json('Deleted Successfully');
};
