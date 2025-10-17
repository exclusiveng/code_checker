import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/data-source';
import { RuleSet } from '../entities/ruleset.entity';
import { Rule } from '../entities/rule.entity';
import { BadRequestError } from '../utils/errors';
import { validateRulesArray } from '../utils/validator';

export const createRuleset = async (req: Request, res: Response, next: NextFunction) => {
  const { name, description, rules } = req.body;

  if (!name || !description || !rules) {
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
  });

  await rulesetRepository.save(newRuleset);

  res.status(201).json(newRuleset);
};

export const getRulesets = async (req: Request, res: Response, next: NextFunction) => {
  const rulesetRepository = AppDataSource.getRepository(RuleSet);
  const companyId = req.user?.companyId;
  if (!companyId) return next(new BadRequestError('Authenticated user not found'));

  const rulesets = await rulesetRepository.find({ where: { companyId } });
  res.json(rulesets);
};

export const getRuleset = async (req: Request, res: Response, next: NextFunction) => {
  const rulesetRepository = AppDataSource.getRepository(RuleSet);
  const companyId = req.user?.companyId;
  if (!companyId) return next(new BadRequestError('Authenticated user not found'));

  const ruleset = await rulesetRepository.findOne({ where: { id: req.params.id, companyId } });
  if (!ruleset) {
    return next(new BadRequestError('Ruleset not found'));
  }
  res.json(ruleset);
};

export const updateRuleset = async (req: Request, res: Response, next: NextFunction) => {
  const rulesetRepository = AppDataSource.getRepository(RuleSet);
  const ruleRepository = AppDataSource.getRepository(Rule);
  const companyId = req.user?.companyId;
  if (!companyId) return next(new BadRequestError('Authenticated user not found'));

  const ruleset = await rulesetRepository.findOne({ where: { id: req.params.id, companyId } });
  if (!ruleset) {
    return next(new BadRequestError('Ruleset not found'));
  }

  const { name, description, rules } = req.body;
  if (rules) {
    const validation = validateRulesArray(rules);
    if (!validation.valid) {
      return next(new BadRequestError('Invalid rules: ' + (validation.errors || []).join('; ')));
    }
    // To handle updates correctly, we remove old rules and add new ones.
    // A more sophisticated approach might diff them, but this is robust.
    if (ruleset.rules) {
      await ruleRepository.remove(ruleset.rules);
    }
    const newRuleEntities = rules.map((ruleData: any) => ruleRepository.create(ruleData));
    ruleset.rules = newRuleEntities;
  }
  rulesetRepository.merge(ruleset, { name, description, rules });

  // Merge other properties
  rulesetRepository.merge(ruleset, { name, description });
  await rulesetRepository.save(ruleset);

  res.json(ruleset);
};

export const deleteRuleset = async (req: Request, res: Response, next: NextFunction) => {
  const rulesetRepository = AppDataSource.getRepository(RuleSet);
  const ruleRepository = AppDataSource.getRepository(Rule);
  const companyId = req.user?.companyId;
  if (!companyId) return next(new BadRequestError('Authenticated user not found'));

  const ruleset = await rulesetRepository.findOne({ where: { id: req.params.id, companyId } });
  if (!ruleset) {
    return next(new BadRequestError('Ruleset not found'));
  }

  await rulesetRepository.remove(ruleset);

  res.status(204).json('Deleted Successfully');
};
