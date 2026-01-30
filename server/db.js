// Configuración de conexión a PostgreSQL
// Las credenciales se cargan desde variables de entorno

import pkg from 'pg';
import dotenv from 'dotenv';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

const { Client } = pkg;

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'reologia'
});

client.connect()
  .then(() => console.log('Conectado a PostgreSQL!'))
  .catch(err => console.error('Error de conexión', err));

export default client;
