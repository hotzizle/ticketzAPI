#!/bin/bash
set -e

# Esperar a que PostgreSQL esté disponible
echo "Esperando a que PostgreSQL esté disponible..."
sleep 10

# Ejecutar el script SQL dentro del contenedor de PostgreSQL
echo "Configurando permisos para PostgREST con operaciones de lectura y escritura..."
docker-compose exec -T postgres psql -U ticketz -d ticketz < init-postgrest-write.sql

echo "Configuración de PostgREST completada exitosamente." 