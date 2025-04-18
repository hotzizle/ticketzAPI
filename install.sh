#!/bin/bash

# Colores para la salida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para validar entrada
validate_input() {
    if [ -z "$1" ]; then
        echo -e "${RED}Error: Este campo es requerido${NC}"
        return 1
    fi
    return 0
}

# Función para validar email
validate_email() {
    if [[ ! "$1" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        echo -e "${RED}Error: Email inválido${NC}"
        return 1
    fi
    return 0
}

# Función para validar puerto
validate_port() {
    if ! [[ "$1" =~ ^[0-9]+$ ]] || [ "$1" -lt 1 ] || [ "$1" -gt 65535 ]; then
        echo -e "${RED}Error: Puerto inválido (1-65535)${NC}"
        return 1
    fi
    return 0
}

# Función para validar IP
validate_ip() {
    if [[ ! "$1" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        echo -e "${RED}Error: IP inválida${NC}"
        return 1
    fi
    return 0
}

# Función para validar token de Cloudflare
validate_cloudflare_token() {
    if [[ ! "$1" =~ ^[A-Za-z0-9_-]{32,}$ ]]; then
        echo -e "${RED}Error: Token de Cloudflare inválido${NC}"
        return 1
    fi
    return 0
}

echo -e "${GREEN}=== Instalador de Ticketz API ===${NC}\n"

# Configuración de red
echo -e "${YELLOW}Configuración de red:${NC}"
read -p "¿Usarás Cloudflare? (s/n): " USE_CLOUDFLARE
if [[ "$USE_CLOUDFLARE" == "s" ]]; then
    read -p "Token del túnel de Cloudflare: " TUNNEL_TOKEN
    validate_cloudflare_token "$TUNNEL_TOKEN" || exit 1
    
    read -p "Dominio principal (ej: tudominio.com): " DOMAIN
    validate_input "$DOMAIN" || exit 1
    
    read -p "Subdominio para Ticketz (ej: ticketz): " SUBDOMAIN
    validate_input "$SUBDOMAIN" || exit 1
    
    read -p "Subdominio para la API (ej: api): " API_SUBDOMAIN
    validate_input "$API_SUBDOMAIN" || exit 1
    
    FRONTEND_HOST="${SUBDOMAIN}.${DOMAIN}"
    BACKEND_HOST="${API_SUBDOMAIN}.${DOMAIN}"
else
    read -p "IP del servidor (default: localhost): " SERVER_IP
    SERVER_IP=${SERVER_IP:-localhost}
    if [[ "$SERVER_IP" != "localhost" ]]; then
        validate_ip "$SERVER_IP" || exit 1
    fi
    
    FRONTEND_HOST="$SERVER_IP"
    BACKEND_HOST="$SERVER_IP"
fi

# PostgreSQL Configuration
echo -e "\n${YELLOW}Configuración de PostgreSQL:${NC}"
read -p "Usuario de PostgreSQL (default: ticketz): " POSTGRES_USER
POSTGRES_USER=${POSTGRES_USER:-ticketz}

read -p "Nombre de la base de datos (default: ticketz): " POSTGRES_DB
POSTGRES_DB=${POSTGRES_DB:-ticketz}

read -s -p "Contraseña de PostgreSQL: " POSTGRES_PASSWORD
echo
validate_input "$POSTGRES_PASSWORD" || exit 1

read -p "Zona horaria (default: UTC): " TZ
TZ=${TZ:-UTC}

# PostgREST Configuration
echo -e "\n${YELLOW}Configuración de PostgREST:${NC}"
read -p "Puerto de PostgREST (default: 3001): " POSTGREST_PORT
POSTGREST_PORT=${POSTGREST_PORT:-3001}
validate_port "$POSTGREST_PORT" || exit 1

if [[ "$USE_CLOUDFLARE" == "s" ]]; then
    PGRST_JWT_AUD="https://${BACKEND_HOST}"
else
    read -p "Dominio de la API (ej: api.tudominio.com): " PGRST_JWT_AUD
    validate_input "$PGRST_JWT_AUD" || exit 1
fi

read -s -p "Secreto para JWT (mínimo 32 caracteres): " PGRST_JWT_SECRET
echo
if [ ${#PGRST_JWT_SECRET} -lt 32 ]; then
    echo -e "${RED}Error: El secreto JWT debe tener al menos 32 caracteres${NC}"
    exit 1
fi

if [[ "$USE_CLOUDFLARE" == "s" ]]; then
    PGRST_CORS_ALLOW_ORIGIN="https://${FRONTEND_HOST},http://${FRONTEND_HOST}"
else
    read -p "Dominios permitidos para CORS (separados por coma): " PGRST_CORS_ALLOW_ORIGIN
    validate_input "$PGRST_CORS_ALLOW_ORIGIN" || exit 1
fi

# pgAdmin Configuration
echo -e "\n${YELLOW}Configuración de pgAdmin:${NC}"
read -p "Email para pgAdmin: " PGADMIN_EMAIL
validate_email "$PGADMIN_EMAIL" || exit 1

read -s -p "Contraseña para pgAdmin: " PGADMIN_PASSWORD
echo
validate_input "$PGADMIN_PASSWORD" || exit 1

read -p "Puerto para pgAdmin (default: 8081): " PGADMIN_PORT
PGADMIN_PORT=${PGADMIN_PORT:-8081}
validate_port "$PGADMIN_PORT" || exit 1

# Crear archivo .env
echo -e "\n${GREEN}Creando archivos de configuración...${NC}"

# Archivo .env principal
cat > .env << EOF
# PostgreSQL Configuration
POSTGRES_USER=$POSTGRES_USER
POSTGRES_DB=$POSTGRES_DB
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
TZ=$TZ

# PostgREST Configuration
POSTGREST_PORT=$POSTGREST_PORT
PGRST_DB_URI=postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@postgres:5432/$POSTGRES_DB
PGRST_DB_SCHEMA=public
PGRST_DB_ANON_ROLE=web_anon
PGRST_JWT_SECRET=$PGRST_JWT_SECRET
PGRST_JWT_AUD=$PGRST_JWT_AUD
PGRST_CORS_ALLOW_ORIGIN=$PGRST_CORS_ALLOW_ORIGIN

# pgAdmin Configuration
PGADMIN_EMAIL=$PGADMIN_EMAIL
PGADMIN_PASSWORD=$PGADMIN_PASSWORD
PGADMIN_PORT=$PGADMIN_PORT

# Backend Configuration
NODE_ENV=production
BACKEND_URL=http://$BACKEND_HOST:$POSTGREST_PORT
FRONTEND_URL=http://$FRONTEND_HOST:3001
PROXY_PORT=8080
REDIS_URI=redis://redis:6379
DB_CONNECTION=postgres
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=$POSTGRES_DB
DB_USERNAME=$POSTGRES_USER
DB_PASSWORD=$POSTGRES_PASSWORD

# Frontend Configuration
REACT_APP_BACKEND_URL=http://$BACKEND_HOST:$POSTGREST_PORT
REACT_APP_HOURS_CLOSE_TICKETS_AUTO=24
REACT_APP_AUTO_OPEN_TICKET=true
EOF

# Si se usa Cloudflare, crear archivo de configuración
if [[ "$USE_CLOUDFLARE" == "s" ]]; then
    cat > .env-cloudflared << EOF
TUNNEL_TOKEN=$TUNNEL_TOKEN
EOF

    cat > .env-frontend << EOF
FRONTEND_HOST=$FRONTEND_HOST
BACKEND_HOST=$BACKEND_HOST
EOF
fi

echo -e "${GREEN}Archivos de configuración creados exitosamente${NC}"

# Verificar Docker y Docker Compose
echo -e "\n${YELLOW}Verificando requisitos...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker no está instalado. Por favor instala Docker primero.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose no está instalado. Por favor instala Docker Compose primero.${NC}"
    exit 1
fi

# Iniciar los servicios
echo -e "\n${GREEN}Iniciando servicios...${NC}"
if [[ "$USE_CLOUDFLARE" == "s" ]]; then
    docker-compose -f docker-compose.yaml -f docker-compose.cloudflare.yaml up -d
else
    docker-compose up -d
fi

# Verificar que los servicios estén corriendo
echo -e "\n${YELLOW}Verificando servicios...${NC}"
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}Servicios iniciados exitosamente${NC}"
    echo -e "\n${GREEN}Accesos:${NC}"
    if [[ "$USE_CLOUDFLARE" == "s" ]]; then
        echo -e "Frontend: https://$FRONTEND_HOST"
        echo -e "Backend: https://$BACKEND_HOST"
    else
        echo -e "Frontend: http://$FRONTEND_HOST:3001"
        echo -e "Backend: http://$BACKEND_HOST:$POSTGREST_PORT"
    fi
    echo -e "pgAdmin: http://$BACKEND_HOST:$PGADMIN_PORT"
    echo -e "\n${YELLOW}Credenciales pgAdmin:${NC}"
    echo -e "Email: $PGADMIN_EMAIL"
    echo -e "Contraseña: [la que ingresaste]"
    
    if [[ "$USE_CLOUDFLARE" == "s" ]]; then
        echo -e "\n${YELLOW}Configuración de DNS:${NC}"
        echo -e "1. Ve al panel de control de Cloudflare"
        echo -e "2. Agrega los siguientes registros DNS:"
        echo -e "   - $FRONTEND_HOST → IP de tu servidor"
        echo -e "   - $BACKEND_HOST → IP de tu servidor"
        echo -e "3. Espera a que los DNS se propaguen (puede tomar hasta 24 horas)"
    fi
else
    echo -e "${RED}Error al iniciar los servicios${NC}"
    echo -e "Por favor revisa los logs con: docker-compose logs"
fi 