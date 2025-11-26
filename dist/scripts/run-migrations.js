"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const data_source_1 = require("../src/config/data-source");
async function run() {
    try {
        await data_source_1.AppDataSource.initialize();
        console.log('DataSource initialized for migrations');
        await data_source_1.AppDataSource.runMigrations();
        console.log('Migrations executed');
        await data_source_1.AppDataSource.destroy();
    }
    catch (e) {
        console.error('Migration run failed', e);
        process.exit(1);
    }
}
run();
