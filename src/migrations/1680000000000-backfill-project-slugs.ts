import { MigrationInterface, QueryRunner } from 'typeorm';

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class BackfillProjectSlugs1680000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Backfill slugs for rows that have null or empty slug
    const projects: Array<{ id: string; name: string; company_id: string }> = await queryRunner.query(
      `SELECT id, name, company_id FROM projects WHERE slug IS NULL OR slug = ''`
    );

    for (const p of projects) {
      let base = generateSlug(p.name || `project-${p.id.slice(0, 6)}`);
      let slug = base;
      let attempt = 0;
      // check uniqueness within company
      while (
        (
          await queryRunner.query(`SELECT 1 FROM projects WHERE slug = $1 AND company_id = $2`, [slug, p.company_id])
        ).length > 0
      ) {
        attempt++;
        slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
        if (attempt > 5) break;
      }
      await queryRunner.query(`UPDATE projects SET slug = $1 WHERE id = $2`, [slug, p.id]);
    }

    // Finally alter the column to set NOT NULL constraint
    await queryRunner.query(`ALTER TABLE projects ALTER COLUMN slug SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: allow nulls (we don't remove generated slugs)
    await queryRunner.query(`ALTER TABLE projects ALTER COLUMN slug DROP NOT NULL`);
  }
}
