import { AppDataSource } from '../config/data-source';
import { Project } from '../entities/project.entity';

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function backfillProjectSlugs() {
  const projectRepo = AppDataSource.getRepository(Project);
  const projects = await projectRepo.find();
  for (const p of projects) {
    if (!p.slug || p.slug.trim() === '') {
      const base = generateSlug(p.name || `project-${p.id.slice(0, 6)}`);
      let slug = base;
      let attempt = 0;
      while (await projectRepo.findOne({ where: { slug, companyId: p.companyId } })) {
        attempt++;
        slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
        if (attempt > 5) break;
      }
      p.slug = slug;
      try {
        await projectRepo.save(p);
        console.log(`Backfilled slug for project ${p.id}: ${p.slug}`);
      } catch (e) {
        console.error('Failed to backfill slug for project', p.id, e);
      }
    }
  }
}
