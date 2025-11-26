"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRuleset = exports.updateRuleset = exports.getRuleset = exports.getRulesets = exports.createRuleset = void 0;
const data_source_1 = require("../config/data-source");
const ruleset_entity_1 = require("../entities/ruleset.entity");
const rule_entity_1 = require("../entities/rule.entity");
const errors_1 = require("../utils/errors");
const validator_1 = require("../utils/validator");
const createRuleset = async (req, res, next) => {
    const { name, description, rules, projectId, projectSlug } = req.body;
    // Helpful debug logging for payload issues
    if (process.env.NODE_ENV !== 'production') {
        console.debug('createRuleset payload rules:', JSON.stringify(rules));
    }
    if (!name || !rules) {
        return next(new errors_1.BadRequestError('Missing required fields'));
    }
    const validation = (0, validator_1.validateRulesArray)(rules);
    if (!validation.valid) {
        return next(new errors_1.BadRequestError('Invalid rules: ' + (validation.errors || []).join('; ')));
    }
    const rulesetRepository = data_source_1.AppDataSource.getRepository(ruleset_entity_1.RuleSet);
    const projectRepository = data_source_1.AppDataSource.getRepository(require('../entities/project.entity').Project);
    const companyId = req.user?.companyId;
    if (!companyId)
        return next(new errors_1.BadRequestError('Authenticated user not found'));
    // Resolve project: accept either projectId (UUID) or projectSlug (human id). If projectSlug
    // is provided, resolve it to the project's UUID. Ensures project belongs to the same company.
    let resolvedProjectId = undefined;
    if (projectId) {
        const p = await projectRepository.findOne({ where: { id: projectId, companyId } });
        if (!p)
            return next(new errors_1.BadRequestError('Invalid projectId'));
        resolvedProjectId = p.id;
    }
    else if (projectSlug) {
        const p = await projectRepository.findOne({ where: { slug: projectSlug, companyId } });
        if (!p)
            return next(new errors_1.BadRequestError('Invalid projectSlug'));
        resolvedProjectId = p.id;
    }
    else {
        return next(new errors_1.BadRequestError('projectId or projectSlug is required for a ruleset'));
    }
    const newRuleset = rulesetRepository.create({
        name,
        description,
        rules, // TypeORM will automatically create RuleEntity instances from this raw data
        companyId,
        projectId: resolvedProjectId,
    });
    try {
        await rulesetRepository.save(newRuleset);
        res.status(201).json(newRuleset);
    }
    catch (err) {
        console.error('Failed to save new ruleset:', err?.message || err);
        return next(new errors_1.BadRequestError('Failed to save ruleset: ' + (err?.message || 'unknown error')));
    }
};
exports.createRuleset = createRuleset;
const getRulesets = async (req, res, next) => {
    const rulesetRepository = data_source_1.AppDataSource.getRepository(ruleset_entity_1.RuleSet);
    const companyId = req.user?.companyId;
    if (!companyId)
        return next(new errors_1.BadRequestError('Authenticated user not found'));
    const rulesets = await rulesetRepository.find({
        where: { companyId },
    });
    res.json(rulesets);
};
exports.getRulesets = getRulesets;
const getRuleset = async (req, res, next) => {
    const rulesetRepository = data_source_1.AppDataSource.getRepository(ruleset_entity_1.RuleSet);
    const companyId = req.user?.companyId;
    if (!companyId)
        return next(new errors_1.BadRequestError('Authenticated user not found'));
    const ruleset = await rulesetRepository.findOne({
        where: { id: req.params.id, companyId },
        relations: ['rules'],
    });
    if (!ruleset) {
        return next(new errors_1.BadRequestError('Ruleset not found'));
    }
    res.json(ruleset);
};
exports.getRuleset = getRuleset;
const updateRuleset = async (req, res, next) => {
    const rulesetRepository = data_source_1.AppDataSource.getRepository(ruleset_entity_1.RuleSet);
    const companyId = req.user?.companyId;
    if (!companyId)
        return next(new errors_1.BadRequestError('Authenticated user not found'));
    const ruleset = await rulesetRepository.findOne({
        where: { id: req.params.id, companyId },
        relations: ['rules'],
    });
    if (!ruleset) {
        return next(new errors_1.BadRequestError('Ruleset not found'));
    }
    const { name, description, rules } = req.body;
    if (process.env.NODE_ENV !== 'production') {
        console.debug('updateRuleset payload rules:', JSON.stringify(rules));
    }
    if (rules) {
        const validation = (0, validator_1.validateRulesArray)(rules);
        if (!validation.valid) {
            return next(new errors_1.BadRequestError('Invalid rules: ' + (validation.errors || []).join('; ')));
        }
        // Replace old rules with new ones. Cascade will handle inserts.
        ruleset.rules = rules.map((ruleData) => data_source_1.AppDataSource.getRepository(rule_entity_1.Rule).create(ruleData));
    }
    // Merge other properties
    rulesetRepository.merge(ruleset, { name, description });
    try {
        await rulesetRepository.save(ruleset);
    }
    catch (err) {
        console.error('Failed to update ruleset:', err?.message || err);
        return next(new errors_1.BadRequestError('Failed to update ruleset: ' + (err?.message || 'unknown error')));
    }
    res.json(await rulesetRepository.findOne({ where: { id: ruleset.id }, relations: ['rules'] }));
};
exports.updateRuleset = updateRuleset;
const deleteRuleset = async (req, res, next) => {
    const rulesetRepository = data_source_1.AppDataSource.getRepository(ruleset_entity_1.RuleSet);
    const companyId = req.user?.companyId;
    if (!companyId)
        return next(new errors_1.BadRequestError('Authenticated user not found'));
    const ruleset = await rulesetRepository.findOne({
        where: { id: req.params.id, companyId },
        relations: ['rules'],
    });
    if (!ruleset) {
        return next(new errors_1.BadRequestError('Ruleset not found'));
    }
    await rulesetRepository.remove(ruleset);
    res.status(204).json('Deleted Successfully');
};
exports.deleteRuleset = deleteRuleset;
