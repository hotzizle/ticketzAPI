# Instalación de Ticketz con Git y Docker

## Requisitos Mínimos
- Windows 10/11 o Ubuntu 20.04
- 4GB de memoria RAM
- Conexión a Internet
- Un dominio (ejemplo: ticketz.tudominio.com)

## Paso 1: Instalar Docker y Git

### En Windows:
1. Ve a [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Descarga e instala Docker Desktop
3. Ve a [Git para Windows](https://git-scm.com/download/win)
4. Descarga e instala Git
5. Reinicia tu computadora

### En Ubuntu:
1. Abre la Terminal
2. Copia y pega estos comandos:
```bash
# Instalar Docker
curl -sSL https://get.docker.com | sh

# Instalar Git
sudo apt-get update
sudo apt-get install git
```

## Paso 2: Obtener Ticketz

1. Abre PowerShell (Windows) o Terminal (Ubuntu)
2. Navega a donde quieres instalar Ticketz:
```bash
cd /ruta/donde/quieres/instalar
```

3. Clona el repositorio:
```bash
git clone https://github.com/ticketz-oss/ticketz.git
cd ticketz
```

## Paso 3: Configurar el Dominio

1. Ve al panel de control de tu dominio
2. Agrega estos registros DNS:
   - `ticketz.tudominio.com` → IP de tu servidor
   - `api.ticketz.tudominio.com` → IP de tu servidor

## Paso 4: Configurar los Archivos

1. En la carpeta de Ticketz, busca el archivo `.env-frontend`
2. Abre con el Bloc de notas y cambia:
```
FRONTEND_HOST=ticketz.tudominio.com
BACKEND_HOST=api.ticketz.tudominio.com
```

3. Busca el archivo `.env-postgrest`
4. Abre con el Bloc de notas y cambia:
```
PGRST_JWT_AUD=api.ticketz.tudominio.com
PGRST_CORS_ALLOW_ORIGIN=https://ticketz.tudominio.com
```

## Paso 5: Iniciar Ticketz

1. En la Terminal/PowerShell, asegúrate de estar en la carpeta de Ticketz
2. Ejecuta:
```bash
docker-compose up -d
```

3. Espera 5 minutos

## Paso 6: Acceder a Ticketz

1. Abre tu navegador
2. Ve a `https://ticketz.tudominio.com`
3. Inicia sesión con:
   - Email: admin@ticketz.host
   - Contraseña: 123456

## Actualizar Ticketz

Para actualizar a la última versión:
```bash
# Detener los servicios
docker-compose down

# Obtener los últimos cambios
git pull

# Reiniciar los servicios
docker-compose up -d
```

## Solución de Problemas

### Si la página no carga:
1. Verifica los registros DNS
2. Espera 24 horas para la propagación
3. Intenta con `http://` en lugar de `https://`

### Si hay errores al actualizar:
1. Guarda tus cambios locales:
```bash
git stash
```

2. Obtén los últimos cambios:
```bash
git pull
```

3. Reinicia los servicios:
```bash
docker-compose down
docker-compose up -d
```

## Mantenimiento

### Para hacer backup:
```bash
docker-compose exec postgres pg_dump -U ticketz ticketz > backup.sql
```

### Para ver los logs:
```bash
docker-compose logs
```

## Notas Importantes
- Cambia la contraseña por defecto
- Haz backups regularmente
- Mantén el sistema actualizado
- No compartas las credenciales
- Si haces cambios, hazlos en una rama separada 