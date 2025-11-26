"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRuleset = exports.updateRuleset = exports.getRuleset = exports.getRulesets = exports.createRuleset = void 0;
const data_source_1 = require("../config/data-source");
const ruleset_entity_1 = require("../entities/ruleset.entity");
const rule_entity_1 = require("../entities/rule.entity");
const errors_1 = require("../utils/errors");
const validator_1 = require("../utils/validator");
const createRuleset = async (req, res, next) => {
    const { name, description, rules } = req.body;
    if (!name || !description || !rules) {
        return next(new errors_1.BadRequestError('Missing required fields'));
    }
    const validation = (0, validator_1.validateRulesArray)(rules);
    if (!validation.valid) {
        return next(new errors_1.BadRequestError('Invalid rules: ' + (validation.errors || []).join('; ')));
    }
    const rulesetRepository = data_source_1.AppDataSource.getRepository(ruleset_entity_1.RuleSet);
    const companyId = req.user?.companyId;
    if (!companyId)
        return next(new errors_1.BadRequestError('Authenticated user not found'));
    const newRuleset = rulesetRepository.create({
        name,
        description,
        rules, // TypeORM will automatically create RuleEntity instances from this raw data
        companyId,
    });
    await rulesetRepository.save(newRuleset);
    res.status(201).json(newRuleset);
};
exports.createRuleset = createRuleset;
const getRulesets = async (req, res, next) => {
    const rulesetRepository = data_source_1.AppDataSource.getRepository(ruleset_entity_1.RuleSet);
    const companyId = req.user?.companyId;
    if (!companyId)
        return next(new errors_1.BadRequestError('Authenticated user not found'));
    const rulesets = await rulesetRepository.find({ where: { companyId } });
    res.json(rulesets);
};
exports.getRulesets = getRulesets;
const getRuleset = async (req, res, next) => {
    const rulesetRepository = data_source_1.AppDataSource.getRepository(ruleset_entity_1.RuleSet);
    const companyId = req.user?.companyId;
    if (!companyId)
        return next(new errors_1.BadRequestError('Authenticated user not found'));
    const ruleset = await rulesetRepository.findOne({ where: { id: req.params.id, companyId } });
    if (!ruleset) {
        return next(new errors_1.BadRequestError('Ruleset not found'));
    }
    res.json(ruleset);
};
exports.getRuleset = getRuleset;
const updateRuleset = async (req, res, next) => {
    const rulesetRepository = data_source_1.AppDataSource.getRepository(ruleset_entity_1.RuleSet);
    const ruleRepository = data_source_1.AppDataSource.getRepository(rule_entity_1.Rule);
    const companyId = req.user?.companyId;
    if (!companyId)
        return next(new errors_1.BadRequestError('Authenticated user not found'));
    const ruleset = await rulesetRepository.findOne({ where: { id: req.params.id, companyId } });
    if (!ruleset) {
        return next(new errors_1.BadRequestError('Ruleset not found'));
    }
    const { name, description, rules } = req.body;
    if (rules) {
        const validation = (0, validator_1.validateRulesArray)(rules);
        if (!validation.valid) {
            return next(new errors_1.BadRequestError('Invalid rules: ' + (validation.errors || []).join('; ')));
        }
        // To handle updates correctly, we remove old rules and add new ones.
        // A more sophisticated approach might diff them, but this is robust.
        if (ruleset.rules) {
            await ruleRepository.remove(ruleset.rules);
        }
        const newRuleEntities = rules.map((ruleData) => ruleRepository.create(ruleData));
        ruleset.rules = newRuleEntities;
    }
    rulesetRepository.merge(ruleset, { name, description, rules });
    // Merge other properties
    rulesetRepository.merge(ruleset, { name, description });
    await rulesetRepository.save(ruleset);
    res.json(ruleset);
};
exports.updateRuleset = updateRuleset;
const deleteRuleset = async (req, res, next) => {
    const rulesetRepository = data_source_1.AppDataSource.getRepository(ruleset_entity_1.RuleSet);
    const ruleRepository = data_source_1.AppDataSource.getRepository(rule_entity_1.Rule);
    const companyId = req.user?.companyId;
    if (!companyId)
        return next(new errors_1.BadRequestError('Authenticated user not found'));
    const ruleset = await rulesetRepository.findOne({ where: { id: req.params.id, companyId } });
    if (!ruleset) {
        return next(new errors_1.BadRequestError('Ruleset not found'));
    }
    await rulesetRepository.remove(ruleset);
    res.status(204).json('Deleted Successfully');
};
exports.deleteRuleset = deleteRuleset;
