# Database Migration Guide

## Overview

This guide explains how to apply the database schema changes to support campaign identification in your reología application.

## What Changed

### Database Schema

#### `mediciones_detalle` table
- **Added**: `nombre_campana` (TEXT) - Campaign name
- **Added**: `id_campana` (BIGINT) - Campaign ID

#### `resumen_muestras` table
- **Added**: `id_campana` (BIGINT) - Shared campaign identifier
- **Added**: `promedio` (NUMERIC) - Consolidated average column
- **Kept**: `promedio_eta` and `promedio_tau` for backward compatibility

### Code Changes

#### `uploadExcel.js`
- Generates unique `id_campana` using `Date.now()` for each Excel upload
- Both Eta and Tau rows share the same `id_campana`
- Stores averages in the new `promedio` column
- All detail measurements include `nombre_campana` and `id_campana`

## Migration Steps

### Step 1: Run the Migration Script

You need to execute the SQL migration script against your PostgreSQL database.

**Option A: Using psql command line**
```bash
psql -h <host> -U <username> -d reologia -f server/migration.sql
```

**Option B: Using a PostgreSQL client (pgAdmin, DBeaver, etc.)**
1. Open `server/migration.sql`
2. Connect to your `reologia` database
3. Execute the entire script

**Option C: Using Node.js script**
Create a temporary migration runner:

```javascript
// server/runMigration.js
import fs from 'fs';
import client from './db.js';

const sql = fs.readFileSync('./server/migration.sql', 'utf8');

client.query(sql)
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
```

Then run:
```bash
node server/runMigration.js
```

### Step 2: Verify the Migration

After running the migration, verify the changes:

```sql
-- Check mediciones_detalle schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'mediciones_detalle' 
ORDER BY ordinal_position;

-- Check resumen_muestras schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'resumen_muestras' 
ORDER BY ordinal_position;
```

### Step 3: Test with Excel Upload

1. Start your server:
   ```bash
   node server/uploadExcel.js
   ```

2. Upload a test Excel file through your application

3. Check the console logs - you should see:
   ```
   --- DATOS RESUMEN EXTRAÍDOS ---
     - Nombre Base: [campaign name]
     - CP: [value]
     - Eta M1: ... | M2: ... | M3: ... | Promedio: ...
     - Tau M1: ... | M2: ... | M3: ... | Promedio: ...
     - ID Campaña: [timestamp]
   ```

### Step 4: Verify Data in Database

Query the database to confirm data is being stored correctly:

```sql
-- Check resumen_muestras - both Eta and Tau should have same id_campana
SELECT id, nombre, tipo, promedio, id_campana 
FROM resumen_muestras 
ORDER BY id_campana DESC, tipo 
LIMIT 10;

-- Check mediciones_detalle - should have nombre_campana and id_campana
SELECT id, nombre_campana, id_campana, shear_rate, viscosity 
FROM mediciones_detalle 
ORDER BY id DESC 
LIMIT 10;

-- Verify campaign grouping
SELECT 
  id_campana,
  COUNT(*) as total_rows,
  COUNT(DISTINCT tipo) as tipos_count
FROM resumen_muestras 
WHERE id_campana IS NOT NULL
GROUP BY id_campana
ORDER BY id_campana DESC;
-- Should show 2 rows per campaign (Eta and Tau)
```

## Expected Results

After successful migration and upload:

1. **`resumen_muestras`** table will have:
   - Two rows per campaign (one Eta, one Tau)
   - Same `id_campana` for both rows
   - `promedio` column populated with the appropriate average
   - Old `promedio_eta` and `promedio_tau` columns still present

2. **`mediciones_detalle`** table will have:
   - `nombre_campana` populated with campaign name
   - `id_campana` matching the corresponding `resumen_muestras` entry

## Rollback (if needed)

If you need to rollback the changes:

```sql
-- Remove new columns from mediciones_detalle
ALTER TABLE mediciones_detalle 
DROP COLUMN IF EXISTS nombre_campana,
DROP COLUMN IF EXISTS id_campana;

-- Remove new columns from resumen_muestras
ALTER TABLE resumen_muestras 
DROP COLUMN IF EXISTS id_campana,
DROP COLUMN IF EXISTS promedio;

-- Drop indexes
DROP INDEX IF EXISTS idx_mediciones_id_campana;
DROP INDEX IF EXISTS idx_resumen_id_campana;
```

## Troubleshooting

### Error: "column already exists"
- The migration script uses `IF NOT EXISTS`, so this shouldn't happen
- If it does, the column was already added - you can skip that part

### Error: "relation does not exist"
- Make sure you're connected to the correct database (`reologia`)
- Verify the tables exist: `\dt` in psql

### Data not appearing in new columns
- Check that you're using the updated `uploadExcel.js` code
- Restart your Node.js server after making code changes
- Check console logs for any errors during upload

## Next Steps

After successful migration:
1. Test with multiple Excel uploads to ensure `id_campana` is unique
2. Update any frontend queries that rely on the old schema
3. Consider creating views or helper functions for common queries
