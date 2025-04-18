# Instalación de Ticketz con Cloudflared y Docker

## Requisitos Mínimos
- Windows 10/11 o Ubuntu 20.04
- 4GB de memoria RAM
- Conexión a Internet
- Una cuenta en Cloudflare
- Un dominio registrado en Cloudflare

## Paso 1: Instalar Docker y Git

### En Windows:
1. Ve a [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Descarga e instala Docker Desktop
3. Ve a [Git para Windows](https://git-scm.com/download/win)
4. Descarga e instala Git
5. Reinicia tu computadora

### En Ubuntu:
```bash
# Instalar Docker y Git
curl -sSL https://get.docker.com | sh
sudo apt-get update && sudo apt-get install -y git
```

## Paso 2: Configurar Cloudflare

1. Inicia sesión en [Cloudflare](https://dash.cloudflare.com/)
2. Ve a "Zero Trust" en el menú lateral
3. Selecciona "Networks" → "Tunnels"
4. Haz clic en "+ Create a tunnel"
5. Dale un nombre a tu túnel (ejemplo: "ticketz-tunnel")
6. En la siguiente pantalla, haz clic en "Docker"
7. Copia el token que aparece

## Paso 3: Configurar el Dominio en Cloudflare

1. En el mismo túnel, ve a "Public Hostname"
2. Configura tres entradas exactamente así (reemplaza ejemplo.com con tu dominio):

   **Frontend:**
   - Subdomain: ticketz
   - Domain: ejemplo.com
   - Path: (vacío)
   - Service: https://frontend

   **Backend:**
   - Subdomain: ticketz
   - Domain: ejemplo.com
   - Path: /backend/*
   - Service: https://backend:3000

   **API:**
   - Subdomain: api
   - Domain: ejemplo.com
   - Path: (vacío)
   - Service: https://postgrest:3000

## Paso 4: Instalar Ticketz

```bash
# Clonar el repositorio
git clone https://github.com/ticketz-oss/ticketz.git
cd ticketz

# Crear archivo de token de Cloudflare
echo "TUNNEL_TOKEN=tu_token_de_cloudflare" > .env-cloudflared

# Crear configuración del frontend
cat << EOF > .env-frontend-cloudflare
FRONTEND_HOST=ticketz.ejemplo.com
BACKEND_PATH=/backend
BACKEND_HOST=ticketz.ejemplo.com
BACKEND_PROTOCOL=https
BACKEND_PORT=
EMAIL_ADDRESS=admin@ticketz.host
EOF

# Crear configuración del backend
cat << EOF > .env-backend-cloudflare
BACKEND_HOST=ticketz.ejemplo.com
API_HOST=api.ejemplo.com
API_PROTOCOL=https
API_PORT=
EOF

# Crear configuración de PostgREST
cat << EOF > .env-postgrest
PGRST_DB_URI=postgres://ticketz:ticketz@postgres:5432/ticketz
PGRST_DB_SCHEMA=public
PGRST_DB_ANON_ROLE=web_anon
PGRST_JWT_SECRET=tu_jwt_secret
PGRST_JWT_AUD=api.ejemplo.com
PGRST_SERVER_PORT=3000
PGRST_SERVER_HOST=0.0.0.0
EOF

# Iniciar los servicios
docker-compose -f docker-compose-cloudflare.yaml up -d
```

## Paso 5: Verificar la Instalación

1. Espera aproximadamente 5 minutos
2. Verifica que el túnel está activo:
```bash
docker-compose -f docker-compose-cloudflare.yaml logs cloudflared
```

3. Accede a través del navegador (reemplaza ejemplo.com con tu dominio):
   - Frontend: https://ticketz.ejemplo.com
   - API: https://api.ejemplo.com

4. Inicia sesión con:
   - Email: admin@ticketz.host
   - Contraseña: 123456

## Comandos Útiles

### Ver estado de los servicios:
```bash
docker-compose -f docker-compose-cloudflare.yaml ps
```

### Ver logs de un servicio específico:
```bash
# Logs de frontend
docker-compose -f docker-compose-cloudflare.yaml logs frontend

# Logs de backend
docker-compose -f docker-compose-cloudflare.yaml logs backend

# Logs de cloudflared
docker-compose -f docker-compose-cloudflare.yaml logs cloudflared
```

### Reiniciar servicios:
```bash
docker-compose -f docker-compose-cloudflare.yaml restart
```

### Actualizar Ticketz:
```bash
# Detener servicios
docker-compose -f docker-compose-cloudflare.yaml down

# Obtener última versión
git pull

# Reiniciar servicios
docker-compose -f docker-compose-cloudflare.yaml up -d
```

### Backup de la base de datos:
```bash
docker-compose -f docker-compose-cloudflare.yaml exec postgres pg_dump -U ticketz ticketz > backup.sql
```

## Solución de Problemas

### Si el túnel no conecta:
```bash
# Reiniciar cloudflared
docker-compose -f docker-compose-cloudflare.yaml restart cloudflared

# Ver logs de cloudflared
docker-compose -f docker-compose-cloudflare.yaml logs -f cloudflared
```

### Si la API no responde:
```bash
# Reiniciar postgrest
docker-compose -f docker-compose-cloudflare.yaml restart postgrest

# Ver logs de postgrest
docker-compose -f docker-compose-cloudflare.yaml logs -f postgrest
```

## Notas Importantes
- Cambia la contraseña por defecto inmediatamente
- Guarda el token de Cloudflare de forma segura
- Realiza backups periódicamente
- Mantén el sistema actualizado
- IMPORTANTE: Reemplaza "ejemplo.com" con tu dominio en todos los comandos y configuraciones 