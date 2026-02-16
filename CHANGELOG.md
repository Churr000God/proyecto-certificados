# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.2.0] - 2026-02-16

### Agregado
- **Frontend (Landing):** Sección hero en `views/index.html` con:
  - Título y copy principal.
  - Botón CTA “Regala un Certificado”.
  - Banda de beneficios (Deducible, Entrega Digital, Impacto Real).

### Cambiado
- **Estilos:** Ampliación de `assets/style.css` para soportar el hero (layout grid, CTA, banda de beneficios y responsivo).

### Notas
- La imagen del hero se referencia como `frontend/assets/hero-estudiante.jpg`. Si no existe, se mostrará únicamente el degradado.

## [1.1.1] - 2026-01-28

### Documentación
- Agregado `CONTRIBUTING.md` con:
    - Guía de flujo de trabajo (Git Flow simplificado).
    - Convenciones de nomenclatura de ramas y commits (Semantic Commits).
    - Instrucciones para reporte de bugs y Pull Requests.

## [1.1.0] - 2026-01-28

### Mejoras
- **Frontend**:
    - Optimización completa del componente `nav_bar.html`:
        - Estructura semántica mejorada y soporte para accesibilidad.
        - Implementación de lógica de logo híbrido (imagen/texto).
        - Centrado inteligente del título de marca.
    - Actualización de estilos en `nav_bar.css`:
        - Diseño totalmente responsive con menú hamburguesa (preparado).
        - Estilos modernos para el título y botón CTA.
        - Ajustes de Flexbox para una distribución equilibrada en móviles y escritorio.

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
