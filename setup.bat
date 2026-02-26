@echo off
setlocal

echo ==========================================
echo    INICIANDO CONFIGURACION DEL SISTEMA
echo ==========================================

:: 1. Verificar dependencias
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker no esta instalado o no esta en el PATH.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ADVERTENCIA] Node.js/npm no encontrado. Saltando instalacion local de dependencias.
) else (
    echo [1/4] Instalando dependencias locales del Backend...
    cd backend
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Fallo al instalar dependencias del backend.
        cd ..
        pause
        exit /b 1
    )
    cd ..
)

:: 2. Limpieza de Docker
echo [2/4] Limpiando contenedores e imagenes anteriores...
echo Deteniendo servicios...
docker-compose down --volumes --remove-orphans

echo Eliminando imagenes antiguas del proyecto...
:: Intenta eliminar la imagen construida localmente si existe
docker rmi proyecto-certificados-backend:latest 2>nul
docker rmi backend_app 2>nul

echo Eliminando contenedores huerfanos o detenidos...
docker container prune -f

:: 3. Reconstruccion y Despliegue
echo [3/4] Construyendo e iniciando servicios...
docker-compose up -d --build --force-recreate

if %errorlevel% neq 0 (
    echo [ERROR] Fallo al iniciar los contenedores.
    pause
    exit /b 1
)

:: 4. Verificacion
echo [4/4] Verificando estado del sistema...
timeout /t 5 /nobreak >nul
docker-compose ps

echo ==========================================
echo    INSTALACION COMPLETADA CON EXITO
echo ==========================================
echo.
echo    Backend: http://localhost:3000
echo    Frontend: http://localhost:80 (o http://localhost)
echo.
pause
