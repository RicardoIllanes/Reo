# BRASS Reology Analysis Application

Aplicación web para análisis de datos reológicos con carga de archivos Excel y visualización interactiva de datos.

## 🚀 Características

- ✅ **Carga de archivos Excel** - Sube archivos Excel con datos de mediciones reológicas
- 📊 **Visualización de datos** - Gráficos interactivos de Shear Rate vs Shear Stress
- 🗄️ **Base de datos PostgreSQL** - Almacenamiento persistente de campañas y mediciones
- 🔐 **Sistema de login** - Autenticación de usuarios
- 📱 **Interfaz responsive** - Diseño moderno con Bootstrap 5
- 🎨 **Tema BRASS** - Colores corporativos y logo integrado

## 🛠️ Tecnologías

### Frontend
- **React** + **TypeScript**
- **Vite** - Build tool
- **Recharts** - Gráficos interactivos
- **Bootstrap 5** - UI Framework
- **Lucide React** - Iconos

### Backend
- **Node.js** + **Express**
- **PostgreSQL** - Base de datos
- **Multer** - Upload de archivos
- **xlsx** - Procesamiento de Excel

## 📋 Requisitos Previos

- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/RicardoIllanes/Reo.git
cd Reo
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:3001
```

Crea un archivo `server/.env`:

```env
DB_USER=tu_usuario
DB_HOST=localhost
DB_NAME=brass_reology
DB_PASSWORD=tu_contraseña
DB_PORT=5432
```

### 4. Configurar la base de datos

```bash
# Crear la base de datos
createdb brass_reology

# Ejecutar migraciones
cd server
node runMigration.js
```

### 5. Iniciar la aplicación

```bash
npm run start:all
```

La aplicación estará disponible en:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 📁 Estructura del Proyecto

```
Reo/
├── components/          # Componentes React
│   ├── LandingPage.tsx  # Página principal con gráficos
│   ├── LoginForm.tsx    # Formulario de login
│   └── Dashboard.tsx    # Dashboard (legacy)
├── server/              # Backend Node.js
│   ├── uploadExcel.js   # Servidor Express y endpoints
│   ├── migration.sql    # Schema de base de datos
│   ├── runMigration.js  # Script de migración
│   └── db.js           # Configuración de PostgreSQL
├── assets/             # Recursos estáticos
├── data/               # Datos mock
├── types.ts            # Definiciones TypeScript
├── index.tsx           # Punto de entrada React
└── package.json        # Dependencias
```

## 🔑 Credenciales de Prueba

```
Usuario: admin
Contraseña: admin123

Usuario: usuario
Contraseña: usuario123
```

## 📊 Uso

### 1. Iniciar Sesión
- Usa las credenciales de prueba para acceder

### 2. Subir Archivo Excel
- Click en "Subir Excel" en el header
- Selecciona un archivo Excel con el formato correcto
- El sistema extraerá automáticamente:
  - Nombre de campaña (celda B7)
  - Concentración Cp (celda D1)
  - Valores de η (Eta) y τ (Tau)
  - Mediciones detalladas (Shear Rate, Shear Stress, Viscosity)

### 3. Visualizar Datos
- La lista de campañas aparece en el panel lateral
- Click en cualquier campaña para ver su gráfico
- El gráfico muestra Shear Rate vs Shear Stress

## 🗄️ Estructura de la Base de Datos

### Tabla: `resumen_muestras`
- Almacena resúmenes de campañas (Eta y Tau)
- Campos: nombre, cp, m1, m2, m3, promedio_eta, promedio_tau, tipo, id_campana

### Tabla: `mediciones_detalle`
- Almacena mediciones individuales
- Campos: resumen_id, shear_rate, shear_stress, viscosity, nombre_campana, id_campana

## 🚀 Despliegue

### Producción

1. Build del frontend:
```bash
npm run build
```

2. Configurar variables de entorno de producción

3. Desplegar en tu plataforma preferida:
   - Frontend: Vercel, Netlify, etc.
   - Backend: Railway, Render, Heroku, etc.
   - Base de datos: Neon, Supabase, AWS RDS, etc.

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es privado y pertenece a BRASS.

## 👤 Autor

**Ricardo Illanes**
- GitHub: [@RicardoIllanes](https://github.com/RicardoIllanes)

## 🙏 Agradecimientos

- BRASS por el diseño y requerimientos
- Equipo de desarrollo por las contribuciones

---

**Nota:** Este proyecto está en desarrollo activo. Algunas características pueden cambiar.
