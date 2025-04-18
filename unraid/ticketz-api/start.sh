#!/bin/sh

# Iniciar PostgreSQL
docker-entrypoint.sh postgres &

# Esperar a que PostgreSQL esté listo
until pg_isready -U ticketz -d ticketz; do
    echo "Waiting for PostgreSQL to be ready..."
    sleep 2
done

# Iniciar PostgREST
postgrest /etc/postgrest.conf &

# Mantener el contenedor corriendo
tail -f /dev/null 