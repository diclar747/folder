# ⚙️ Configuración

## Imágenes

Las imágenes se guardan en el propio servidor (carpeta `UPLOAD_DIR`, por defecto `server/uploads`) y se sirven en `/uploads/...`. Ya no se usa ImgBB.
En Docker/Dokploy, montar un **volumen persistente** en `/app/uploads` para no perderlas al redeployar.

---

## Base de datos (PostgreSQL)

La app usa PostgreSQL (ya no Neon). Se configura con `DATABASE_URL`; sin ella usa la BD local.

### Local
1. Crear la base: `CREATE DATABASE ubicar;` (usuario `postgres`, contraseña `postgres`, puerto `5432`).
2. Copiar `server/.env.example` a `server/.env`.
3. Crear tablas y usuarios iniciales: `cd server && node seed.js`
   (`admin@admin` / `user@user.com`, contraseña `1234567`).
4. Levantar: `cd server && node index.js` y `cd client && npx vite` → http://localhost:5173

## Despliegue en Dokploy

Un solo contenedor (API + frontend) construido con el `Dockerfile` de la raíz.

1. Crear un servicio **PostgreSQL** en Dokploy y copiar su *Internal Connection URL*.
2. Crear una **Application** → Provider: GitHub, repo `diclar747/folder`, rama `main`.
3. Build Type: **Dockerfile** (ruta `./Dockerfile`, contexto `.`).
4. Variables de entorno:
   - `DATABASE_URL` = URL interna del Postgres (sin SSL si es interna)
   - `JWT_SECRET` = un secreto largo y aleatorio
5. Storage → agregar un **Volume** (mount path `/app/uploads`) para las imágenes.
6. Domains: dominio → puerto del contenedor **3001** (activar HTTPS/Let's Encrypt).
7. Deploy. Las tablas se crean solas al arrancar.
8. Primera vez, crear usuarios iniciales: pestaña *Terminal* del servicio → `node seed.js`.
   Luego cambiar las contraseñas.
