FROM hotzizle/ticketz:latest

# Copiar archivos de configuración
COPY docker-compose.yaml /app/
COPY .env* /app/

# Exponer puertos principales
EXPOSE 3000 3001 8080 8081

# Comando por defecto
CMD ["docker-compose", "up", "-d"] 