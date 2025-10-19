import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/data-source';
import { RuleSet } from '../entities/ruleset.entity';
import { Rule } from '../entities/rule.entity';
import { BadRequestError } from '../utils/errors';
import { validateRulesArray } from '../utils/validator';

export const createRuleset = async (req: Request, res: Response, next: NextFunction) => {
  const { name, description, rules, projectId } = req.body;

  if (!name || !rules) {
    return next(new BadRequestError('Missing required fields'));
  }

  const validation = validateRulesArray(rules);
  if (!validation.valid) {
    return next(new BadRequestError('Invalid rules: ' + (validation.errors || []).join('; ')));
  }

  const rulesetRepository = AppDataSource.getRepository(RuleSet);

  const companyId = req.user?.companyId;
  if (!companyId) return next(new BadRequestError('Authenticated user not found'));

  const newRuleset = rulesetRepository.create({
    name,
    description,
    rules, // TypeORM will automatically create RuleEntity instances from this raw data
    companyId,
    projectId
  });

  await rulesetRepository.save(newRuleset);

  res.status(201).json(newRuleset);
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
  await rulesetRepository.save(ruleset);

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

  await rulesetRepository.remove(ruleset);

  res.status(204).json('Deleted Successfully');
};
