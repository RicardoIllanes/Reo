import bcrypt from 'bcrypt';

async function generatePasswordHashes() {
    const saltRounds = 10;

    console.log('\n=== Generando Hashes de Contraseñas ===\n');

    // Hash para admin123
    const adminHash = await bcrypt.hash('admin123', saltRounds);
    console.log('Contraseña: admin123');
    console.log('Hash:', adminHash);
    console.log('');

    // Hash para usuario123
    const usuarioHash = await bcrypt.hash('usuario123', saltRounds);
    console.log('Contraseña: usuario123');
    console.log('Hash:', usuarioHash);
    console.log('\n=== SQL para migration.sql ===\n');

    console.log(`INSERT INTO usuarios (username, password, nombre_completo, email, rol)
VALUES (
  'admin',
  '${adminHash}',
  'Administrador',
  'admin@brass.com',
  'admin'
)
ON CONFLICT (username) DO NOTHING;

INSERT INTO usuarios (username, password, nombre_completo, email, rol)
VALUES (
  'usuario',
  '${usuarioHash}',
  'Usuario de Prueba',
  'usuario@brass.com',
  'usuario'
)
ON CONFLICT (username) DO NOTHING;`);

    console.log('\n=======================================\n');
}

generatePasswordHashes();
