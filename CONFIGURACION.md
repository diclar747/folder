# ⚙️ Configuración

## IMGBB API Key

Para que las imágenes se suban correctamente, necesitas una API key de IMGBB:

### 1. Obtener API Key (Gratis)
1. Ve a https://api.imgbb.com/
2. Regístrate o inicia sesión
3. Copia tu API key

### 2. Configurar en Vercel
1. Ve a tu proyecto en [vercel.com](https://vercel.com)
2. Ve a **Settings** → **Environment Variables**
3. Agrega:
   - **Name**: `IMGBB_API_KEY`
   - **Value**: `tu_api_key_aqui`
4. Haz clic en **Save**
5. Redespliega el proyecto

### 3. Configurar en Local
Crea un archivo `server/.env` con:
```
IMGBB_API_KEY=tu_api_key_aqui
```

---

**Nota**: Sin la API key, solo puedes usar URLs públicas de imágenes (https://...)

## Base de datos (PostgreSQL)

La app usa PostgreSQL (ya no Neon). Se configura con `DATABASE_URL`; sin ella usa la BD local.

### Local
1. Crear la base: `CREATE DATABASE ubicar;` (usuario `postgres`, contraseña `postgres`, puerto `5432`).
2. Copiar `server/.env.example` a `server/.env`.
3. Crear tablas y usuarios iniciales: `cd server && node seed.js`
   (`admin@admin` / `user@user.com`, contraseña `1234567`).
4. Levantar: `cd server && node index.js` y `cd client && npx vite` → http://localhost:5173

### Producción (Vercel)
Definir `DATABASE_URL` (con `?sslmode=require` si el host lo exige) en Settings → Environment Variables.

## Despliegue en Dokploy

Un solo contenedor (API + frontend) construido con el `Dockerfile` de la raíz.

1. Crear un servicio **PostgreSQL** en Dokploy y copiar su *Internal Connection URL*.
2. Crear una **Application** → Provider: GitHub, repo `diclar747/folder`, rama `main`.
3. Build Type: **Dockerfile** (ruta `./Dockerfile`, contexto `.`).
4. Variables de entorno:
   - `DATABASE_URL` = URL interna del Postgres (sin SSL si es interna)
   - `JWT_SECRET` = un secreto largo y aleatorio
   - `IMGBB_API_KEY` = tu key
5. Domains: dominio → puerto del contenedor **3001** (activar HTTPS/Let's Encrypt).
6. Deploy. Las tablas se crean solas al arrancar.
7. Primera vez, crear usuarios iniciales: pestaña *Terminal* del servicio → `node seed.js`.
   Luego cambiar las contraseñas.
