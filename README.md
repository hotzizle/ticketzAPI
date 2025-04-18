# Ticketz API

Sistema de gestión de tickets y atención al cliente con integración de WhatsApp.

## Requisitos Previos

- Docker
- Docker Compose
- Git
- Si usas Cloudflare:
  - Cuenta en Cloudflare
  - Token de túnel de Cloudflare
  - Dominio configurado en Cloudflare

## Instalación Automática

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/ticketzAPI.git
cd ticketzAPI
```

2. Ejecuta el script de instalación:
```bash
chmod +x install.sh
./install.sh
```

3. Sigue las instrucciones en pantalla:
   - Selecciona si usarás Cloudflare
   - Ingresa los datos de configuración solicitados
   - El script creará los archivos de configuración necesarios

## Instalación Manual

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/ticketzAPI.git
cd ticketzAPI
```

2. Crea los archivos de configuración:

### Sin Cloudflare

Crea el archivo `.env`:
```bash
# PostgreSQL Configuration
POSTGRES_USER=ticketz
POSTGRES_DB=ticketz
POSTGRES_PASSWORD=tu_contraseña
TZ=UTC

# PostgREST Configuration
POSTGREST_PORT=3001
PGRST_DB_URI=postgres://ticketz:tu_contraseña@postgres:5432/ticketz
PGRST_DB_SCHEMA=public
PGRST_DB_ANON_ROLE=web_anon
PGRST_JWT_SECRET=tu_secreto_jwt_min_32_caracteres
PGRST_JWT_AUD=tu_dominio_api
PGRST_CORS_ALLOW_ORIGIN=tu_dominio_frontend

# pgAdmin Configuration
PGADMIN_EMAIL=tu_email
PGADMIN_PASSWORD=tu_contraseña
PGADMIN_PORT=8081

# Backend Configuration
NODE_ENV=production
BACKEND_URL=http://tu_ip:3001
FRONTEND_URL=http://tu_ip:3001
PROXY_PORT=8080
REDIS_URI=redis://redis:6379
DB_CONNECTION=postgres
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=ticketz
DB_USERNAME=ticketz
DB_PASSWORD=tu_contraseña

# Frontend Configuration
REACT_APP_BACKEND_URL=http://tu_ip:3001
REACT_APP_HOURS_CLOSE_TICKETS_AUTO=24
REACT_APP_AUTO_OPEN_TICKET=true
```

### Con Cloudflare

Crea los archivos `.env`, `.env-cloudflared` y `.env-frontend`:

`.env-cloudflared`:
```bash
TUNNEL_TOKEN=tu_token_cloudflare
```

`.env-frontend`:
```bash
FRONTEND_HOST=tu_subdominio.tu_dominio.com
BACKEND_HOST=tu_subdominio_api.tu_dominio.com
```

3. Inicia los servicios:
```bash
# Sin Cloudflare
docker-compose up -d

# Con Cloudflare
docker-compose -f docker-compose.yaml -f docker-compose.cloudflare.yaml up -d
```

## Configuración de Cloudflare

Si usas Cloudflare, sigue estos pasos:

1. Ve al panel de control de Cloudflare
2. Agrega los siguientes registros DNS:
   - `tu_subdominio.tu_dominio.com` → IP de tu servidor
   - `tu_subdominio_api.tu_dominio.com` → IP de tu servidor
3. Espera a que los DNS se propaguen (puede tomar hasta 24 horas)

## Acceso a los Servicios

### Sin Cloudflare
- Frontend: http://tu_ip:3001
- Backend: http://tu_ip:3001
- pgAdmin: http://tu_ip:8081

### Con Cloudflare
- Frontend: https://tu_subdominio.tu_dominio.com
- Backend: https://tu_subdominio_api.tu_dominio.com
- pgAdmin: http://tu_ip:8081

## Credenciales pgAdmin
- Email: el que configuraste
- Contraseña: la que configuraste

## Solución de Problemas

Si encuentras algún error:

1. Revisa los logs:
```bash
docker-compose logs
```

2. Verifica que los puertos estén disponibles:
```bash
netstat -tuln | grep LISTEN
```

3. Verifica que los contenedores estén corriendo:
```bash
docker-compose ps
```

## Actualización

Para actualizar el sistema:

1. Detén los contenedores:
```bash
docker-compose down
```

2. Actualiza el código:
```bash
git pull
```

3. Reconstruye las imágenes:
```bash
docker-compose build
```

4. Inicia los servicios:
```bash
# Sin Cloudflare
docker-compose up -d

# Con Cloudflare
docker-compose -f docker-compose.yaml -f docker-compose.cloudflare.yaml up -d
```

## Contribución

Las contribuciones son bienvenidas. Por favor, sigue estos pasos:

1. Haz un fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
