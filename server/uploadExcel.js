import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import client from './db.js';
import cors from 'cors';
import { existsSync, mkdirSync } from 'fs';

// Crear directorio de uploads si no existe
const uploadsDir = 'uploads/';
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
  console.log('Directorio uploads/ creado');
}

const app = express();
app.use(cors());
app.use(express.json());
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
    // Usar la HOJA 2 para extraer los datos
    const data = hojas[sheetNames[1]]; // Hoja 2

    if (!data) {
      return res.status(400).json({
        ok: false,
        error: 'No se encontró la hoja 2 en el archivo Excel'
      });
    }

    // Extraer celdas específicas de todas las hojas
    const nombresCeldas = [
      'B7', 'B65', 'B122',
      'T7', 'T65', 'T122',
      'AL7', 'AL65', 'AL122',
      'BC7', 'BC65', 'BC122'
    ];
    const valoresCeldasPorHoja = {};
    sheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      valoresCeldasPorHoja[sheetName] = {};
      nombresCeldas.forEach(ref => {
        valoresCeldasPorHoja[sheetName][ref] = sheet[ref] ? sheet[ref].v : null;
      });
    });


    // --- Extraer datos resumen ---
    // Extraer nombre del archivo desde fila 7 (índice 6)
    const nombreBase = data[6] && data[6][1] ? String(data[6][1]) : '';

    // Extraer Cp desde fila 1, columna D (índice [0][3]) - "Cp = 70%"
    // Extraer solo el número
    let cp = null;
    if (data[0] && data[0][3]) {
      const cpTexto = String(data[0][3]); // "Cp = 70%"
      const match = cpTexto.match(/\d+/); // Buscar el número
      if (match) {
        cp = parseFloat(match[0]);
      }
    }

    // Extraer valores de Eta desde fila 3 (índice 2)
    // Columnas: B=M1, C=M2, D=M3, E=Promedio
    const eta_m1 = parseNumeroExcel(data[2] && data[2][1]);
    const eta_m2 = parseNumeroExcel(data[2] && data[2][2]);
    const eta_m3 = parseNumeroExcel(data[2] && data[2][3]);
    const eta_promedio = parseNumeroExcel(data[2] && data[2][4]);

    // Extraer valores de Tau desde fila 4 (índice 3)
    const tau_m1 = parseNumeroExcel(data[3] && data[3][1]);
    const tau_m2 = parseNumeroExcel(data[3] && data[3][2]);
    const tau_m3 = parseNumeroExcel(data[3] && data[3][3]);
    const tau_promedio = parseNumeroExcel(data[3] && data[3][4]);

    // Generar ID único de campaña (compartido entre Eta y Tau)
    const id_campana = Date.now();

    // Insertar FILA 1: Eta con nuevo esquema
    const resumenEta = await client.query(
      'INSERT INTO resumen_muestras (nombre, cp, m1, m2, m3, promedio_eta, promedio_tau, promedio, tipo, id_campana) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
      [nombreBase, cp || 0, eta_m1 || 0, eta_m2 || 0, eta_m3 || 0, eta_promedio || 0, 0, eta_promedio || 0, 'Eta', id_campana]
    );
    const resumen_id_eta = resumenEta.rows[0].id;

    // Insertar FILA 2: Tau con nuevo esquema
    const resumenTau = await client.query(
      'INSERT INTO resumen_muestras (nombre, cp, m1, m2, m3, promedio_eta, promedio_tau, promedio, tipo, id_campana) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
      [nombreBase, cp || 0, tau_m1 || 0, tau_m2 || 0, tau_m3 || 0, 0, tau_promedio || 0, tau_promedio || 0, 'Tau', id_campana]
    );
    const resumen_id_tau = resumenTau.rows[0].id;

    // Usar el ID de Eta para las mediciones (o puedes usar Tau, según prefieras)
    const resumen_id_base = resumen_id_eta;

    // --- Extraer y guardar mediciones detalle ---
    // Estructura:
    // A10 = Meas. Pts. (columna 0) -> se guarda en resumen_id
    // B10 = Shear Rate (columna 1) -> shear_rate
    // C10 = Shear Stress (columna 2) -> shear_stress
    // D10 = Viscosity (columna 3) -> viscosity

    // Recolectar todas las mediciones en un array
    const mediciones = [];

    // Empezar desde índice 9 (fila 10 del Excel)
    for (let i = 9; i < data.length; i++) {
      const row = data[i];

      // Verificar si la fila tiene datos válidos
      if (!row || row.length < 4) {
        continue;
      }

      // Extraer valores según la estructura especificada
      const shear_rate = parseNumeroExcel(row[1]);
      const shear_stress = parseNumeroExcel(row[2]);
      const viscosity = parseNumeroExcel(row[3]);

      // Si no hay shear_rate válido, detener (fin de los datos)
      if (shear_rate === null || shear_rate === undefined || isNaN(shear_rate)) {
        break; // Salir del loop cuando no hay más datos
      }

      mediciones.push({
        shear_rate,
        shear_stress: shear_stress || 0,
        viscosity: viscosity || 0
      });
    }

    // Insertar todas las mediciones en una sola query (batch insert)
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
    console.log('=================================');

    // Enviar los datos de todas las hojas y los valores de celdas específicas de todas las hojas al frontend
    res.json({ ok: true, resumen_id_eta, resumen_id_tau, hojas, valoresCeldasPorHoja });
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


