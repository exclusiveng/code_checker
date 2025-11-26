"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backfillProjectSlugs = backfillProjectSlugs;
const data_source_1 = require("../config/data-source");
const project_entity_1 = require("../entities/project.entity");
function generateSlug(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
async function backfillProjectSlugs() {
    const projectRepo = data_source_1.AppDataSource.getRepository(project_entity_1.Project);
    const projects = await projectRepo.find();
    for (const p of projects) {
        if (!p.slug || p.slug.trim() === '') {
            const base = generateSlug(p.name || `project-${p.id.slice(0, 6)}`);
            let slug = base;
            let attempt = 0;
            while (await projectRepo.findOne({ where: { slug, companyId: p.companyId } })) {
                attempt++;
                slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
                if (attempt > 5)
                    break;
            }
            p.slug = slug;
            try {
                await projectRepo.save(p);
                console.log(`Backfilled slug for project ${p.id}: ${p.slug}`);
            }
            catch (e) {
                console.error('Failed to backfill slug for project', p.id, e);
            }
        }
    }
}
