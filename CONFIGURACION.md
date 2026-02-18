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
