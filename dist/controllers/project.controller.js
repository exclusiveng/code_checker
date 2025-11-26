"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjects = exports.createProject = void 0;
const data_source_1 = require("../config/data-source");
const project_entity_1 = require("../entities/project.entity");
const ruleset_entity_1 = require("../entities/ruleset.entity");
const errors_1 = require("../utils/errors");
const typeorm_1 = require("typeorm");
const createProject = async (req, res, next) => {
    const { id: companyId } = req.params;
    const { name, repoUrl, rulesetIds } = req.body;
    if (!req.user)
        return next(new errors_1.BadRequestError('Authenticated user not found'));
    if (req.user.companyId !== companyId)
        return next(new errors_1.ForbiddenError('Cannot create project for another company'));
    if (!name || !repoUrl) {
        return next(new errors_1.BadRequestError('Missing required fields'));
    }
    const projectRepository = data_source_1.AppDataSource.getRepository(project_entity_1.Project);
    const rulesetRepository = data_source_1.AppDataSource.getRepository(ruleset_entity_1.RuleSet);
    let rulesets = [];
    if (rulesetIds && rulesetIds.length > 0) {
        rulesets = await rulesetRepository.findBy({ id: (0, typeorm_1.In)(rulesetIds), companyId });
        if (rulesets.length !== rulesetIds.length) {
            return next(new errors_1.BadRequestError('One or more invalid rulesetIds provided.'));
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
        if (attempt > 5)
            break; // avoid infinite loop
    }
    const project = projectRepository.create({ name, repoUrl, companyId, rulesets, slug });
    await projectRepository.save(project);
    res.status(201).json(project);
};
exports.createProject = createProject;
const getProjects = async (req, res, next) => {
    if (!req.user)
        return next(new errors_1.BadRequestError('Authenticated user not found'));
    const companyId = req.user.companyId;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const projectRepository = data_source_1.AppDataSource.getRepository(project_entity_1.Project);
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
exports.getProjects = getProjects;
