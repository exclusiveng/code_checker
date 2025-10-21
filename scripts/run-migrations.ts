import 'reflect-metadata';
import { AppDataSource } from '../src/config/data-source';

async function run() {
  try {
    await AppDataSource.initialize();
    console.log('DataSource initialized for migrations');
    await AppDataSource.runMigrations();
    console.log('Migrations executed');
    await AppDataSource.destroy();
  } catch (e) {
    console.error('Migration run failed', e);
    process.exit(1);
  }
}

run();
