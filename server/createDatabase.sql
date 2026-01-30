-- ============================================
-- Script para crear la base de datos y tablas
-- Ejecutar este script en pgAdmin 4 o psql
-- ============================================

-- Crear la base de datos (ejecutar esto primero en la base de datos 'postgres')
-- CREATE DATABASE reologia;

-- Luego conectarse a la base de datos 'reologia' y ejecutar lo siguiente:

-- ============================================
-- 1. Crear tabla resumen_muestras
-- ============================================
CREATE TABLE IF NOT EXISTS resumen_muestras (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  cp NUMERIC DEFAULT 0,
  m1 NUMERIC DEFAULT 0,
  m2 NUMERIC DEFAULT 0,
  m3 NUMERIC DEFAULT 0,
  promedio_eta NUMERIC DEFAULT 0,
  promedio_tau NUMERIC DEFAULT 0,
  promedio NUMERIC DEFAULT 0,
  tipo VARCHAR(10) CHECK (tipo IN ('Eta', 'Tau')),
  id_campana BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_resumen_id_campana ON resumen_muestras(id_campana);

-- ============================================
-- 2. Crear tabla mediciones_detalle
-- ============================================
CREATE TABLE IF NOT EXISTS mediciones_detalle (
  id SERIAL PRIMARY KEY,
  resumen_id INTEGER REFERENCES resumen_muestras(id) ON DELETE CASCADE,
  shear_rate NUMERIC NOT NULL,
  shear_stress NUMERIC DEFAULT 0,
  viscosity NUMERIC DEFAULT 0,
  nombre_campana TEXT,
  id_campana BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_mediciones_resumen_id ON mediciones_detalle(resumen_id);
CREATE INDEX IF NOT EXISTS idx_mediciones_id_campana ON mediciones_detalle(id_campana);

-- ============================================
-- 3. Crear tabla usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  rol VARCHAR(20) DEFAULT 'usuario' CHECK (rol IN ('admin', 'usuario')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- ============================================
-- 4. Insertar usuarios por defecto
-- ============================================
-- Usuario admin (contraseña: admin123)
INSERT INTO usuarios (username, password, nombre_completo, email, rol)
VALUES (
  'admin',
  '$2b$10$mja6xiqbl2qFdf1s.icMYutKzGE591gjzMznYTXwsQ0NzCqR7JZLe',
  'Administrador',
  'admin@brass.com',
  'admin'
)
ON CONFLICT (username) DO NOTHING;

-- Usuario regular (contraseña: usuario123)
INSERT INTO usuarios (username, password, nombre_completo, email, rol)
VALUES (
  'usuario',
  '$2b$10$ss2tOc0ti1FaNsQuBBUvfuet7kppX1h39RaB9ejtVGzUpjKmlF.PC',
  'Usuario de Prueba',
  'usuario@brass.com',
  'usuario'
)
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- 5. Verificación
-- ============================================
-- Verificar que las tablas se crearon correctamente
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar usuarios creados
SELECT id, username, nombre_completo, email, rol, activo 
FROM usuarios;
