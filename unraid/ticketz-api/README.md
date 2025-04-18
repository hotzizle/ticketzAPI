# Ticketz API para Unraid

Ticketz es un sistema de gestión de tickets basado en WhatsApp, construido con Node.js, React y PostgreSQL.

## Características

- Gestión de tickets vía WhatsApp
- Interfaz de usuario moderna y responsive
- API RESTful con PostgREST
- Autenticación JWT
- Base de datos PostgreSQL con RLS
- Panel de administración con pgAdmin

## Requisitos

- Unraid 6.9.0 o superior
- Docker y Docker Compose instalados
- Mínimo 2GB de RAM
- Mínimo 10GB de espacio en disco

## Instalación

1. Descarga el template desde Community Applications
2. Configura las variables de entorno:
   - PostgreSQL User: Usuario para la base de datos (por defecto: ticketz)
   - PostgreSQL Database: Nombre de la base de datos (por defecto: ticketz)
   - PostgreSQL Password: Contraseña para PostgreSQL
   - Time Zone: Zona horaria (por defecto: UTC)
   - JWT Secret: Secreto para JWT
   - JWT Audience: Dominio de la API (por defecto: http://localhost:3001)
   - CORS Origins: Dominios permitidos para CORS
   - pgAdmin Email: Email para acceder a pgAdmin
   - pgAdmin Password: Contraseña para pgAdmin

3. Inicia el contenedor

## Acceso

- Frontend: http://[IP]:8080
- API: http://[IP]:3001
- pgAdmin: http://[IP]:8081

## Volúmenes

- `/mnt/user/appdata/ticketz/postgres`: Datos de PostgreSQL
- `/mnt/user/appdata/ticketz/redis`: Datos de Redis
- `/mnt/user/appdata/ticketz/config`: Archivos de configuración

## Actualización

Para actualizar a una nueva versión:

1. Detén el contenedor
2. Descarga la nueva versión
3. Inicia el contenedor

## Soporte

Para reportar problemas o solicitar ayuda, visita:
https://github.com/hotzizle/ticketzAPI/issues