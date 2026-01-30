-- Migration script for database schema refactoring
-- Adds campaign identification fields to support better data organization

-- ============================================
-- 1. ALTER mediciones_detalle table
-- ============================================
-- Add campaign identification columns
ALTER TABLE mediciones_detalle 
ADD COLUMN IF NOT EXISTS nombre_campana TEXT,
ADD COLUMN IF NOT EXISTS id_campana BIGINT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_mediciones_id_campana ON mediciones_detalle(id_campana);

-- ============================================
-- 2. ALTER resumen_muestras table
-- ============================================
-- Add shared campaign ID and consolidated promedio column
ALTER TABLE resumen_muestras 
ADD COLUMN IF NOT EXISTS id_campana BIGINT,
ADD COLUMN IF NOT EXISTS promedio NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_resumen_id_campana ON resumen_muestras(id_campana);

-- ============================================
-- 3. Data Migration (Optional)
-- ============================================
-- Migrate existing data to populate new promedio column
-- This copies promedio_eta to promedio for Eta rows
UPDATE resumen_muestras 
SET promedio = promedio_eta 
WHERE tipo = 'Eta' AND (promedio IS NULL OR promedio = 0);

-- This copies promedio_tau to promedio for Tau rows
UPDATE resumen_muestras 
SET promedio = promedio_tau 
WHERE tipo = 'Tau' AND (promedio IS NULL OR promedio = 0);

-- ============================================
-- 4. Verification Queries
-- ============================================
-- Check the schema changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'mediciones_detalle' 
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'resumen_muestras' 
ORDER BY ordinal_position;

-- Check data migration
SELECT id, nombre, tipo, promedio, promedio_eta, promedio_tau, id_campana 
FROM resumen_muestras 
LIMIT 10;
