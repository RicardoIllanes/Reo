import express from 'express';
import bcrypt from 'bcrypt';
import session from 'express-session';
import client from './db.js';

const router = express.Router();

// Configurar sesiones
const sessionMiddleware = session({
    secret: 'brass-reology-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        httpOnly: true
    }
});

// Middleware de autenticación
function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ ok: false, error: 'No autenticado' });
    }
    next();
}

// Middleware solo para admin
function requireAdmin(req, res, next) {
    if (!req.session || !req.session.userId || req.session.rol !== 'admin') {
        return res.status(403).json({ ok: false, error: 'Acceso denegado. Se requiere rol de administrador.' });
    }
    next();
}

// POST /api/login - Autenticar usuario
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ ok: false, error: 'Usuario y contraseña requeridos' });
        }

        // Buscar usuario en la base de datos
        const result = await client.query(
            'SELECT * FROM usuarios WHERE username = $1 AND activo = true',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
        }

        const usuario = result.rows[0];

        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, usuario.password);

        if (!passwordMatch) {
            return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
        }

        // Crear sesión
        req.session.userId = usuario.id;
        req.session.username = usuario.username;
        req.session.rol = usuario.rol;
        req.session.nombreCompleto = usuario.nombre_completo;

        res.json({
            ok: true,
            usuario: {
                id: usuario.id,
                username: usuario.username,
                nombreCompleto: usuario.nombre_completo,
                email: usuario.email,
                rol: usuario.rol
            }
        });
    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ ok: false, error: 'Error en el servidor' });
    }
});

// POST /api/logout - Cerrar sesión
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ ok: false, error: 'Error al cerrar sesión' });
        }
        res.json({ ok: true });
    });
});

// GET /api/me - Obtener usuario actual
router.get('/me', requireAuth, async (req, res) => {
    try {
        const result = await client.query(
            'SELECT id, username, nombre_completo, email, rol FROM usuarios WHERE id = $1',
            [req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
        }

        res.json({ ok: true, usuario: result.rows[0] });
    } catch (err) {
        console.error('Error obteniendo usuario:', err);
        res.status(500).json({ ok: false, error: 'Error en el servidor' });
    }
});

// GET /api/users - Listar usuarios (solo admin)
router.get('/users', requireAdmin, async (req, res) => {
    try {
        const result = await client.query(
            'SELECT id, username, nombre_completo, email, rol, activo, created_at FROM usuarios ORDER BY created_at DESC'
        );

        res.json({ ok: true, usuarios: result.rows });
    } catch (err) {
        console.error('Error listando usuarios:', err);
        res.status(500).json({ ok: false, error: 'Error en el servidor' });
    }
});

// POST /api/users - Crear usuario (solo admin)
router.post('/users', requireAdmin, async (req, res) => {
    try {
        const { username, password, nombreCompleto, email, rol } = req.body;

        if (!username || !password) {
            return res.status(400).json({ ok: false, error: 'Usuario y contraseña requeridos' });
        }

        // Verificar si el usuario ya existe
        const existingUser = await client.query(
            'SELECT id FROM usuarios WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ ok: false, error: 'El usuario o email ya existe' });
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar usuario
        const result = await client.query(
            'INSERT INTO usuarios (username, password, nombre_completo, email, rol) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, nombre_completo, email, rol, activo, created_at',
            [username, hashedPassword, nombreCompleto, email, rol || 'usuario']
        );

        res.json({ ok: true, usuario: result.rows[0] });
    } catch (err) {
        console.error('Error creando usuario:', err);
        res.status(500).json({ ok: false, error: 'Error en el servidor' });
    }
});

// PUT /api/users/:id - Actualizar usuario (solo admin)
router.put('/users/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombreCompleto, email, rol, activo, password } = req.body;

        let query = 'UPDATE usuarios SET nombre_completo = $1, email = $2, rol = $3, activo = $4, updated_at = CURRENT_TIMESTAMP';
        let params = [nombreCompleto, email, rol, activo];

        // Si se proporciona nueva contraseña, hashearla
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ', password = $5';
            params.push(hashedPassword);
        }

        query += ` WHERE id = $${params.length + 1} RETURNING id, username, nombre_completo, email, rol, activo`;
        params.push(id);

        const result = await client.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
        }

        res.json({ ok: true, usuario: result.rows[0] });
    } catch (err) {
        console.error('Error actualizando usuario:', err);
        res.status(500).json({ ok: false, error: 'Error en el servidor' });
    }
});

// DELETE /api/users/:id - Eliminar usuario (solo admin)
router.delete('/users/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // No permitir eliminar al propio usuario
        if (parseInt(id) === req.session.userId) {
            return res.status(400).json({ ok: false, error: 'No puedes eliminar tu propio usuario' });
        }

        const result = await client.query(
            'DELETE FROM usuarios WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
        }

        res.json({ ok: true });
    } catch (err) {
        console.error('Error eliminando usuario:', err);
        res.status(500).json({ ok: false, error: 'Error en el servidor' });
    }
});

export { router, sessionMiddleware, requireAuth, requireAdmin };

