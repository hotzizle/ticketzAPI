# Instalación Simple de Ticketz con Docker

## Requisitos Mínimos
- Windows 10/11 o Ubuntu 20.04
- 4GB de memoria RAM
- Conexión a Internet
- Un dominio (ejemplo: ticketz.tudominio.com)

## Paso 1: Instalar Docker Desktop

### En Windows:
1. Ve a [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Descarga e instala Docker Desktop
3. Reinicia tu computadora

### En Ubuntu:
1. Abre la Terminal
2. Copia y pega este comando:
```bash
curl -sSL https://get.docker.com | sh
```

## Paso 2: Descargar Ticketz

1. Ve a [https://github.com/ticketz-oss/ticketz](https://github.com/ticketz-oss/ticketz)
2. Haz clic en el botón verde "Code"
3. Selecciona "Download ZIP"
4. Descomprime el archivo en una carpeta

## Paso 3: Configurar el Dominio

1. Ve al panel de control de tu dominio
2. Agrega estos registros DNS:
   - `ticketz.tudominio.com` → IP de tu servidor
   - `api.ticketz.tudominio.com` → IP de tu servidor

## Paso 4: Configurar los Archivos

1. Abre la carpeta de Ticketz
2. Busca el archivo `.env-frontend`
3. Abre con el Bloc de notas y cambia:
```
FRONTEND_HOST=ticketz.tudominio.com
BACKEND_HOST=api.ticketz.tudominio.com
```

4. Busca el archivo `.env-postgrest`
5. Abre con el Bloc de notas y cambia:
```
PGRST_JWT_AUD=api.ticketz.tudominio.com
PGRST_CORS_ALLOW_ORIGIN=https://ticketz.tudominio.com
```

## Paso 5: Iniciar Ticketz

1. Abre PowerShell (Windows) o Terminal (Ubuntu)
2. Navega a la carpeta de Ticketz:
```bash
cd ruta/a/tu/carpeta/ticketz
```

3. Ejecuta:
```bash
docker-compose up -d
```

4. Espera 5 minutos

## Paso 6: Acceder a Ticketz

1. Abre tu navegador
2. Ve a `https://ticketz.tudominio.com`
3. Inicia sesión con:
   - Email: admin@ticketz.host
   - Contraseña: 123456

## Solución de Problemas

### Si la página no carga:
1. Verifica los registros DNS
2. Espera 24 horas para la propagación
3. Intenta con `http://` en lugar de `https://`

### Si no funciona:
1. Reinicia los servicios:
```bash
docker-compose down
docker-compose up -d
```

2. Verifica los logs:
```bash
docker-compose logs
```

## Mantenimiento

### Para actualizar:
```bash
docker-compose pull
docker-compose up -d
```

### Para hacer backup:
```bash
docker-compose exec postgres pg_dump -U ticketz ticketz > backup.sql
```

## Notas Importantes
- Cambia la contraseña por defecto
- Haz backups regularmente
- Mantén el sistema actualizado
- No compartas las credenciales 