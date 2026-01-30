import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import client from './db.js';
import cors from 'cors';
import { existsSync, mkdirSync } from 'fs';
import { router as authRouter, sessionMiddleware } from './auth.js';

// Crear directorio de uploads si no existe
const uploadsDir = 'uploads/';
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
  console.log('Directorio uploads/ creado');
}

const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(sessionMiddleware); // Agregar middleware de sesiones
app.use('/api', authRouter); // Agregar rutas de autenticación
const upload = multer({ dest: uploadsDir });

// Endpoint de salud para verificar que el servidor está corriendo
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    message: 'Servidor corriendo correctamente',
    timestamp: new Date().toISOString(),
    port: 3001
  });
});

// Endpoint para verificar la conexión a la base de datos
app.get('/db-status', async (req, res) => {
  try {
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    res.json({
      ok: true,
      message: 'Conexión a PostgreSQL exitosa',
      timestamp: result.rows[0].current_time,
      version: result.rows[0].version
    });
  } catch (err) {
    console.error('Error al conectar con la base de datos:', err);
    res.status(500).json({
      ok: false,
      error: 'Error de conexión a la base de datos',
      details: err.message
    });
  }
});

// Endpoint para obtener todas las campañas (agrupadas por id_campana)
app.get('/api/campaigns', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT 
        id_campana,
        nombre,
        cp,
        MAX(CASE WHEN tipo = 'Eta' THEN id END) as eta_id,
        MAX(CASE WHEN tipo = 'Tau' THEN id END) as tau_id,
        MAX(CASE WHEN tipo = 'Eta' THEN promedio END) as eta_promedio,
        MAX(CASE WHEN tipo = 'Tau' THEN promedio END) as tau_promedio,
        MIN(created_at) as fecha_creacion
      FROM resumen_muestras
      WHERE id_campana IS NOT NULL
      GROUP BY id_campana, nombre, cp
      ORDER BY id_campana DESC
    `);

    res.json({
      ok: true,
      campaigns: result.rows
    });
  } catch (err) {
    console.error('Error al obtener campañas:', err);
    res.status(500).json({
      ok: false,
      error: 'Error al obtener campañas',
      details: err.message
    });
  }
});

// Endpoint para obtener detalles de una campaña específica
app.get('/api/campaign/:id_campana', async (req, res) => {
  try {
    const { id_campana } = req.params;

    // Obtener resumen
    const resumen = await client.query(`
      SELECT * FROM resumen_muestras 
      WHERE id_campana = $1 
      ORDER BY tipo
    `, [id_campana]);

    // Obtener mediciones detalle
    const mediciones = await client.query(`
      SELECT * FROM mediciones_detalle 
      WHERE id_campana = $1 
      ORDER BY id
    `, [id_campana]);

    res.json({
      ok: true,
      resumen: resumen.rows,
      mediciones: mediciones.rows
    });
  } catch (err) {
    console.error('Error al obtener detalles de campaña:', err);
    res.status(500).json({
      ok: false,
      error: 'Error al obtener detalles de campaña',
      details: err.message
    });
  }
});


// Función auxiliar para convertir valores a números con formato europeo/latinoamericano
// Punto (.) = separador de miles → se elimina
// Coma (,) = separador decimal → se convierte a punto
function parseNumeroExcel(valor) {
  if (valor === null || valor === undefined || valor === '') return null;

  // Si ya es un número, retornarlo
  if (typeof valor === 'number') return valor;

  // Si es string, limpiar y convertir
  if (typeof valor === 'string') {
    // 1. Eliminar puntos (separador de miles): "1.000" → "1000"
    // 2. Reemplazar coma por punto (decimal): "4,16" → "4.16"
    const limpio = valor.trim().replace(/\./g, '').replace(',', '.');
    const numero = parseFloat(limpio);
    return isNaN(numero) ? null : numero;
  }

  return null;
}

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    // Leer el archivo Excel
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;

    console.log('\n========================================');
    console.log('INICIANDO LECTURA DE EXCEL');
    console.log('Archivo:', filePath);
    console.log('Hojas encontradas:', sheetNames);
    console.log('========================================\n');

    const hojas = {};
    sheetNames.forEach(name => {
      hojas[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], {
        header: 1,
        raw: true,  // Obtener valores sin formato
        defval: null
      });
    });
    // Procesar TODAS las hojas del Excel
    console.log(`Procesando ${sheetNames.length} hojas...`);

    const campanasCreadas = [];

    for (let sheetIndex = 0; sheetIndex < sheetNames.length; sheetIndex++) {
      const sheetName = sheetNames[sheetIndex];
      const data = hojas[sheetName];

      console.log(`\n--- Procesando hoja ${sheetIndex + 1}/${sheetNames.length}: "${sheetName}" ---`);

      if (!data || data.length < 10) {
        console.log(`⚠ Hoja "${sheetName}" vacía o sin datos suficientes, omitiendo...`);
        continue;
      }

      try {
        // --- Extraer datos resumen ---
        // Extraer nombre del archivo desde fila 7 (índice 6)
        const nombreBase = data[6] && data[6][1] ? String(data[6][1]) : `Campaña ${sheetName}`;

        // Extraer Cp desde fila 1, columna D (índice [0][3]) - "Cp = 70%"
        let cp = null;
        if (data[0] && data[0][3]) {
          const cpTexto = String(data[0][3]);
          const match = cpTexto.match(/\d+/);
          if (match) {
            cp = parseFloat(match[0]);
          }
        }

        // Extraer valores de Eta desde fila 3 (índice 2)
        const eta_m1 = parseNumeroExcel(data[2] && data[2][1]);
        const eta_m2 = parseNumeroExcel(data[2] && data[2][2]);
        const eta_m3 = parseNumeroExcel(data[2] && data[2][3]);
        const eta_promedio = parseNumeroExcel(data[2] && data[2][4]);

        // Extraer valores de Tau desde fila 4 (índice 3)
        const tau_m1 = parseNumeroExcel(data[3] && data[3][1]);
        const tau_m2 = parseNumeroExcel(data[3] && data[3][2]);
        const tau_m3 = parseNumeroExcel(data[3] && data[3][3]);
        const tau_promedio = parseNumeroExcel(data[3] && data[3][4]);

        // Generar ID único de campaña (timestamp + índice de hoja)
        const id_campana = Date.now() + sheetIndex;

        // Insertar FILA 1: Eta
        const resumenEta = await client.query(
          'INSERT INTO resumen_muestras (nombre, cp, m1, m2, m3, promedio_eta, promedio_tau, promedio, tipo, id_campana) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
          [nombreBase, cp || 0, eta_m1 || 0, eta_m2 || 0, eta_m3 || 0, eta_promedio || 0, 0, eta_promedio || 0, 'Eta', id_campana]
        );
        const resumen_id_eta = resumenEta.rows[0].id;

        // Insertar FILA 2: Tau
        const resumenTau = await client.query(
          'INSERT INTO resumen_muestras (nombre, cp, m1, m2, m3, promedio_eta, promedio_tau, promedio, tipo, id_campana) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
          [nombreBase, cp || 0, tau_m1 || 0, tau_m2 || 0, tau_m3 || 0, 0, tau_promedio || 0, tau_promedio || 0, 'Tau', id_campana]
        );
        const resumen_id_tau = resumenTau.rows[0].id;

        const resumen_id_base = resumen_id_eta;

        // --- Extraer y guardar mediciones detalle ---
        const mediciones = [];

        // Empezar desde índice 9 (fila 10 del Excel)
        for (let i = 9; i < data.length; i++) {
          const row = data[i];

          if (!row || row.length < 4) {
            continue;
          }

          const shear_rate = parseNumeroExcel(row[1]);
          const shear_stress = parseNumeroExcel(row[2]);
          const viscosity = parseNumeroExcel(row[3]);

          if (shear_rate === null || shear_rate === undefined || isNaN(shear_rate)) {
            break;
          }

          mediciones.push({
            shear_rate,
            shear_stress: shear_stress || 0,
            viscosity: viscosity || 0
          });
        }

        // Insertar todas las mediciones en batch
        if (mediciones.length > 0) {
          const values = mediciones.map((m, idx) =>
            `($1, $${idx * 3 + 2}, $${idx * 3 + 3}, $${idx * 3 + 4}, $5, $6)`
          ).join(', ');

          const params = [resumen_id_base];
          mediciones.forEach(m => {
            params.push(m.shear_rate, m.shear_stress, m.viscosity);
          });
          params.push(nombreBase, id_campana);

          await client.query(
            `INSERT INTO mediciones_detalle (resumen_id, shear_rate, shear_stress, viscosity, nombre_campana, id_campana) VALUES ${values}`,
            params
          );
        }

        console.log(`✓ Campaña "${nombreBase}" guardada con ${mediciones.length} mediciones`);

        campanasCreadas.push({
          nombre: nombreBase,
          id_campana,
          mediciones: mediciones.length,
          hoja: sheetName
        });

      } catch (err) {
        console.error(`✗ Error procesando hoja "${sheetName}":`, err.message);
        // Continuar con la siguiente hoja
      }
    }

    console.log('\n=================================');
    console.log(`✓ Procesamiento completado: ${campanasCreadas.length} campañas creadas`);
    console.log('=================================');

    // Enviar respuesta con todas las campañas creadas
    res.json({
      ok: true,
      campanasCreadas,
      totalCampanas: campanasCreadas.length,
      hojas: sheetNames
    });
  } catch (err) {
    console.error('Error al procesar el archivo:', err);
    res.status(500).json({
      ok: false,
      error: 'Error al procesar el archivo',
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

app.listen(3001, () => {
  console.log('Servidor escuchando en puerto 3001');
});


