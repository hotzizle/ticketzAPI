FROM node:18-alpine

WORKDIR /app

# Copiar archivos de configuración
COPY docker-compose.yaml /app/
COPY .env* /app/

# Copiar el código fuente
COPY ../backend /app/backend
COPY ../frontend /app/frontend

# Instalar dependencias
RUN cd /app/backend && npm install
RUN cd /app/frontend && npm install

# Exponer puertos principales
EXPOSE 3000 3001 8080 8081

# Comando por defecto
CMD ["docker-compose", "up", "-d"] 
