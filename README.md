# 🌍 Ubicar - Sistema de Geolocalización

Sistema de geolocalización en tiempo real con panel de administración completo.

## ✨ Características

- 📍 **Rastreo en Tiempo Real** - Visualiza ubicaciones en mapa interactivo
- 🔗 **Enlaces de Rastreo** - Genera enlaces personalizados para compartir
- 👥 **Gestión de Usuarios** - Panel admin completo con CRUD de usuarios
- 🔒 **Autenticación JWT** - Sistema seguro de login
- 📊 **Dashboard Analítico** - Estadísticas y métricas
- 🗺️ **Google Maps** - Integración completa con Google Maps API
- 🌙 **Modo Oscuro** - Interfaz moderna con soporte dark mode

## 🚀 Tecnologías

**Backend:**
- Node.js + Express
- MySQL + Sequelize ORM
- Socket.IO (tiempo real)
- JWT Authentication

**Frontend:**
- React + Vite
- Tailwind CSS
- React Router
- Axios

## 📋 Requisitos

- Node.js 18.x o superior
- MySQL 5.7 o superior
- Cuenta de Google Maps API (opcional)

## 🛠️ Instalación Local

### 1. Clonar repositorio
```bash
git clone https://github.com/diclar747/folder.git
cd folder
```

### 2. Configurar Backend
```bash
cd server

# Crear archivo de configuración
cp .env.example .env

# Editar .env con tus datos de MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ubicar_db
DB_USER=root
DB_PASSWORD=tu_password
JWT_SECRET=tu_secreto_jwt

# Instalar dependencias
npm install

# Crear base de datos y usuario inicial
node seed.js

# Iniciar servidor
node index.js
```

### 3. Configurar Frontend
```bash
cd client

# Instalar dependencias
npm install

# Configurar Google Maps API (opcional)
echo "VITE_GOOGLE_MAPS_API_KEY=tu_api_key" > .env

# Iniciar en modo desarrollo
npm run dev

# O compilar para producción
npm run build
```

## 🌐 Despliegue en Hosting

Ver guía completa en **[DEPLOY.md](DEPLOY.md)**

### Resumen Rápido (cPanel):

1. **Crear Base de Datos MySQL** en cPanel
2. **Subir archivos** vía FTP o File Manager
3. **Configurar `.env`** con datos de la base de datos
4. **Instalar dependencias:** `npm install`
5. **Inicializar datos:** `node seed.js`
6. **Configurar Node.js App** en cPanel
7. **Subir build del frontend** a `public_html/`

### Credenciales por Defecto:
```
Admin:    admin@admin.com / 1234567
Usuario:  user@user.com / 1234567
```

## 📁 Estructura del Proyecto

```
ubicar/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas principales
│   │   ├── contexts/      # Contextos de React
│   │   └── services/      # Servicios API
│   └── dist/              # Build de producción
├── server/                # Backend Node.js
│   ├── config/            # Configuraciones
│   ├── models/            # Modelos Sequelize
│   ├── app.js             # Express app
│   ├── index.js           # Entry point
│   └── seed.js            # Datos iniciales
├── DEPLOY.md              # Guía de despliegue
└── README.md              # Este archivo
```

## 🔧 Variables de Entorno

### Backend (`server/.env`)
```env
NODE_ENV=production
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ubicar_db
DB_USER=usuario
DB_PASSWORD=password

# JWT
JWT_SECRET=secreto_super_seguro

# Opcional
CLIENT_URL=https://tudominio.com
```

### Frontend (`client/.env`)
```env
VITE_GOOGLE_MAPS_API_KEY=tu_api_key_de_google_maps
```

## 🐛 Solución de Problemas

### Error de conexión a MySQL
- Verificar credenciales en `.env`
- Confirmar que MySQL está corriendo
- Verificar permisos del usuario MySQL

### Error "Cannot find module"
```bash
cd server
rm -rf node_modules
npm install
```

### Socket.IO no funciona en producción
- Asegurar que el hosting soporte WebSockets
- O usar polling como fallback (ya configurado)

## 📞 Soporte

Para reportar problemas o sugerencias, crear un issue en el repositorio.

## 📄 Licencia

Proyecto privado. Todos los derechos reservados.

---

**Desarrollado con ❤️ por el equipo de Ubicar**
