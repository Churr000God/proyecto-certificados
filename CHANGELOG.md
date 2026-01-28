# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.0.0] - 2026-01-28

### Agregado
- **Infraestructura**:
    - Configuración inicial de `docker-compose.yml` con servicios `backend` y `nginx`.
    - `Dockerfile` optimizado para Node.js (Multi-stage build) compatible con ARM64 (Raspberry Pi 4).
    - Configuración de Nginx como proxy reverso y servidor de archivos estáticos.
- **Backend**:
    - Estructura base de carpetas (`models`, `controllers`, `routes`, `services`).
    - Servidor Express básico en `src/index.js`.
    - Dependencias iniciales: `express`, `cors`, `dotenv`.
- **Frontend**:
    - Página de inicio (`index.html`) con diseño básico.
    - Script de verificación de estado (`script.js`) para probar conexión con backend.
    - Estilos básicos (`style.css`).
- **Documentación**:
    - README.md con instrucciones de instalación, arquitectura y comandos operativos.

### Seguridad
- Configuración de usuario no-root en el contenedor de Backend.
- Aislamiento de red: El backend no expone puertos públicos, solo es accesible a través de Nginx.
