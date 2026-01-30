import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import client from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('========================================');
console.log('DATABASE MIGRATION SCRIPT');
console.log('========================================\n');

async function runMigration() {
    try {
        // Read the migration SQL file
        const migrationPath = join(__dirname, 'migration.sql');
        console.log('Reading migration file:', migrationPath);
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('\nExecuting migration...\n');

        // Execute the migration
        await client.query(sql);

        console.log('✓ Migration completed successfully!\n');

        // Verify the changes
        console.log('Verifying schema changes...\n');

        // Check mediciones_detalle columns
        const medicionesColumns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'mediciones_detalle' 
      ORDER BY ordinal_position
    `);

        console.log('mediciones_detalle columns:');
        medicionesColumns.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });

        // Check resumen_muestras columns
        const resumenColumns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'resumen_muestras' 
      ORDER BY ordinal_position
    `);

        console.log('\nresumen_muestras columns:');
        resumenColumns.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });

        console.log('\n========================================');
        console.log('MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('========================================\n');

        process.exit(0);
    } catch (err) {
        console.error('\n❌ Migration failed:');
        console.error('Error:', err.message);
        console.error('\nStack trace:', err.stack);
        process.exit(1);
    }
}

runMigration();
