# Configuración de PostgREST para Ticketz

Este documento explica cómo configurar PostgREST para crear una API REST completa (con operaciones CRUD) para la base de datos de Ticketz.

## Requisitos previos

- Docker y Docker Compose instalados
- Servidor UNRAID configurado en la IP 10.0.0.250
- Aplicación Ticketz funcionando con PostgreSQL

## Archivos incluidos

- `.env-postgrest`: Configuración de conexión y JWT para PostgREST
- `init-postgrest-write.sql`: Script SQL con roles y permisos de lectura/escritura
- `setup-postgrest.sh`: Script para aplicar los permisos en PostgreSQL
- `generate-jwt.js`: Generador de tokens JWT para autenticación
- `package.json`: Administrador de dependencias para el generador JWT
- `test-api.sh`: Script con ejemplos para probar la API

## Pasos para la instalación

### 1. Preparar archivos

Asegúrate de que todos los archivos estén en la misma carpeta que tu archivo `docker-compose.yaml`.

### 2. Modificar el archivo `docker-compose.yaml`

Añade el servicio de PostgREST a tu archivo `docker-compose.yaml` actual:

```yaml
postgrest:
  image: postgrest/postgrest:v12.2.0
  env_file:
    - .env-postgrest
  depends_on:
    - postgres
  ports:
    - "8001:8000"
  restart: always
  networks:
    - ticketz
```

### 3. Dar permisos de ejecución a los scripts

```bash
chmod +x setup-postgrest.sh
chmod +x test-api.sh
```

### 4. Iniciar los servicios

```bash
docker-compose down
docker-compose up -d
```

### 5. Configurar los permisos en la base de datos

```bash
./setup-postgrest.sh
```

### 6. Generar tokens JWT para autenticación

```bash
npm install
npm run generate
```

Guarda los tokens generados para usarlos en las solicitudes de API.

### 7. Actualizar el script de prueba

Edita el archivo `test-api.sh` y reemplaza las variables `READ_TOKEN` y `WRITE_TOKEN` con los tokens JWT generados.

### 8. Probar la API

```bash
./test-api.sh
```

## Endpoints disponibles

La API estará disponible en: `http://10.0.0.250:8001/`

### Principales endpoints:

- `/Tickets`: Gestión de tickets
- `/Users`: Gestión de usuarios
- `/Contacts`: Gestión de contactos
- `/Messages`: Gestión de mensajes
- `/Whatsapps`: Configuración de WhatsApp
- `/Queues`: Gestión de colas

## Operaciones soportadas

- `GET`: Leer datos (con o sin filtros)
- `POST`: Crear nuevos registros
- `PATCH`: Actualizar registros existentes
- `DELETE`: Eliminar registros

## Ejemplos de uso

### Leer datos (GET)

```bash
# Obtener todos los tickets (limitado a 100)
curl -s "http://10.0.0.250:8001/Tickets?limit=100" | json_pp

# Filtrar tickets por estado
curl -s "http://10.0.0.250:8001/Tickets?status=eq.open" | json_pp

# Ordenar resultados
curl -s "http://10.0.0.250:8001/Users?order=name.asc" | json_pp
```

### Crear datos (POST)

```bash
curl -X POST "http://10.0.0.250:8001/Tickets" \
  -H "Authorization: Bearer TU_TOKEN_JWT_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"status":"open", "contactId":1, "queueId":1, "userId":1, "title":"Nuevo ticket"}'
```

### Actualizar datos (PATCH)

```bash
curl -X PATCH "http://10.0.0.250:8001/Tickets?id=eq.5" \
  -H "Authorization: Bearer TU_TOKEN_JWT_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"status":"closed"}'
```

### Eliminar datos (DELETE)

```bash
curl -X DELETE "http://10.0.0.250:8001/Tickets?id=eq.5" \
  -H "Authorization: Bearer TU_TOKEN_JWT_AQUI"
```

## Seguridad

- Asegúrate de cambiar la clave JWT en `.env-postgrest` por una segura
- Controla cuidadosamente quién tiene acceso a los tokens con permisos de escritura
- Considera usar HTTPS si expones la API a internet

Para más información, consulta la [documentación oficial de PostgREST](https://postgrest.org/en/v12/). 