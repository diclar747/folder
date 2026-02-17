# 🚀 Guía de Despliegue - Ubicar en Hosting Compartido (cPanel)

## 📋 Requisitos del Servidor

- **Node.js** 18.x o superior (verificar con tu hosting)
- **MySQL** 5.7 o superior
- **cPanel** con acceso a:
  - File Manager
  - MySQL Database Wizard
  - Terminal (opcional) o FTP

---

## 🗄️ Paso 1: Crear la Base de Datos MySQL

### En cPanel:

1. Ve a **"MySQL Database Wizard"**
2. **Crear Base de Datos:**
   - Nombre: `ubicar_db` (o el que prefieras)
3. **Crear Usuario:**
   - Username: `ubicar_user`
   - Password: Genera uno seguro y guárdalo
4. **Asignar Privilegios:**
   - Marca **"ALL PRIVILEGES"**
   - Click en "Next Step"

### 📌 Guarda estos datos:
```
Database: ubicar_db
Username: ubicar_user
Password: [tu_password]
Host: localhost
Port: 3306
```

---

## 📤 Paso 2: Subir los Archivos

### Opción A: FTP (FileZilla, Cyberduck)

1. Conecta a tu hosting vía FTP
2. Sube la carpeta `server/` al directorio deseado (ej: `/ubicar/`)

### Opción B: cPanel File Manager

1. Ve a **"File Manager"** en cPanel
2. Navega a `public_html/` o el directorio deseado
3. Click en **"Upload"** y sube un ZIP del proyecto
4. Descomprime el archivo

---

## ⚙️ Paso 3: Configurar Variables de Entorno

1. En el directorio del servidor, renombra:
   ```
   .env.example → .env
   ```

2. Edita el archivo `.env` con tus datos:
   ```env
   NODE_ENV=production
   PORT=3001
   
   # Base de datos MySQL
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=ubicar_db
   DB_USER=ubicar_user
   DB_PASSWORD=tu_password_aqui
   
   # JWT Secret (genera uno aleatorio fuerte)
   JWT_SECRET=tu_secreto_super_seguro_123456789
   ```

---

## 📦 Paso 4: Instalar Dependencias

### Si tienes acceso a Terminal en cPanel:

```bash
cd /ruta/a/tu/proyecto/server
npm install
```

### Si NO tienes Terminal:

1. En tu computadora local, ejecuta:
   ```bash
   cd server
   npm install
   ```

2. Sube toda la carpeta `node_modules/` junto con los archivos

---

## 🏗️ Paso 5: Inicializar la Base de Datos

### Opción A: Con Terminal

```bash
cd /ruta/a/tu/proyecto/server
node seed.js
```

### Opción B: Crear tablas automáticamente

Al primer inicio del servidor, las tablas se crearán automáticamente con:
```javascript
sequelize.sync({ alter: true })
```

---

## ▶️ Paso 6: Iniciar el Servidor

### Opción A: Node.js en cPanel (Setup Node.js App)

1. Ve a **"Setup Node.js App"** en cPanel
2. Click en **"Create Application"**
3. Configura:
   - **Node.js version:** 18.x o superior
   - **Application mode:** Production
   - **Application root:** `/ubicar/server`
   - **Application startup file:** `index.js`
4. Click en **"Create"**

### Opción B: PM2 (si está disponible)

```bash
pm2 start server/index.js --name ubicar
```

### Opción C: Forever (alternativa a PM2)

```bash
npm install -g forever
forever start server/index.js
```

---

## 🌐 Paso 7: Configurar el Frontend (React)

### Compilar el frontend:

```bash
cd client
npm install
npm run build
```

### Subir el build:

1. Copia la carpeta `client/dist/` a tu hosting
2. Configura el dominio para apuntar a esta carpeta

### Configurar API URL:

En `client/.env.production`:
```env
VITE_API_URL=https://tudominio.com/api
```

---

## 🔒 Paso 8: Configurar SSL (HTTPS)

1. Ve a **"SSL/TLS"** en cPanel
2. Instala un certificado SSL (Let's Encrypt es gratis)
3. Fuerza HTTPS redirigiendo HTTP a HTTPS

---

## 🔄 Paso 9: Configurar Reinicio Automático (Opcional)

Crea un archivo `restart.sh`:

```bash
#!/bin/bash
cd /ruta/a/tu/proyecto/server
if pgrep -f "node index.js" > /dev/null
then
    pkill -f "node index.js"
fi
node index.js > app.log 2>&1 &
```

Configura un **Cron Job** en cPanel para verificar que el servidor esté corriendo cada 5 minutos.

---

## ✅ Verificación Final

1. **Verificar base de datos:**
   ```bash
   node -e "require('./server/models').sequelize.authenticate().then(() => console.log('✅ OK'))"
   ```

2. **Verificar servidor:**
   - Abre: `https://tudominio.com/api/health`
   - Debe mostrar: `{"status":"online","database":"connected"}`

3. **Login de prueba:**
   - Admin: `admin@admin.com` / `1234567`
   - Usuario: `user@user.com` / `1234567`

---

## 🐛 Solución de Problemas

### Error: "Cannot find module"
```bash
rm -rf node_modules
npm install
```

### Error de conexión a MySQL
- Verifica que el usuario tenga privilegios
- Confirma que DB_HOST sea `localhost`
- Revisa el firewall del servidor

### Error de puerto en uso
Cambia el puerto en `.env`:
```env
PORT=3002
```

### Permisos de archivos
```bash
chmod -R 755 /ruta/a/tu/proyecto
```

---

## 📞 Soporte

Si tienes problemas, verifica:
1. Logs de errores en cPanel
2. Archivo `server.log` si existe
3. Consola del navegador (F12)

---

## 📝 Notas Importantes

- **Cambia las contraseñas por defecto** después del primer login
- **Genera un JWT_SECRET fuerte** en producción
- **Habilita SSL/HTTPS** obligatoriamente
- **Realiza backups** periódicos de la base de datos
