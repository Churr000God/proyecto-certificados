#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}   INICIANDO CONFIGURACION DEL SISTEMA    ${NC}"
echo -e "${GREEN}==========================================${NC}"

# Función para manejar errores
handle_error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# 1. Verificar Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker no está instalado o no está en el PATH.${NC}"
    exit 1
fi

# Determinar comando docker compose
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}Docker Compose no encontrado.${NC}"
    exit 1
fi

# 2. Instalar dependencias locales
if command -v npm &> /dev/null; then
    echo "[1/4] Instalando dependencias locales del Backend..."
    cd backend || { echo -e "${RED}No se encuentra el directorio backend${NC}"; exit 1; }
    npm install || { echo -e "${RED}Fallo al instalar dependencias del backend${NC}"; exit 1; }
    cd ..
else
    echo -e "${RED}[ADVERTENCIA] Node.js/npm no encontrado. Saltando instalación local.${NC}"
fi

# 3. Limpieza de Docker
echo "[2/4] Limpiando contenedores e imágenes anteriores..."
$DOCKER_COMPOSE_CMD down --volumes --remove-orphans || { echo -e "${RED}Fallo al detener contenedores${NC}"; exit 1; }

# Limpieza agresiva de contenedores detenidos y redes no usadas
echo "Eliminando contenedores detenidos y recursos no usados..."
docker container prune -f
docker network prune -f
docker image prune -f

# 4. Reconstrucción y Despliegue
echo "[3/4] Construyendo e iniciando servicios..."
$DOCKER_COMPOSE_CMD up -d --build --force-recreate || { echo -e "${RED}Fallo al iniciar contenedores${NC}"; exit 1; }

# 5. Verificación
echo "[4/4] Verificando estado del sistema..."
sleep 5
$DOCKER_COMPOSE_CMD ps

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}   INSTALACION COMPLETADA CON EXITO       ${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo "   Backend: http://localhost:3000"
echo "   Frontend: http://localhost:80 (o http://localhost)"
echo ""
