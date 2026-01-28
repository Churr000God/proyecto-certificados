# Proyecto Certificados

Sistema integral para la gestión y emisión de certificados, diseñado con una arquitectura de microservicios contenerizada y optimizada para ejecutarse en entornos ligeros como **Raspberry Pi 4**.

## 📋 Tabla de Contenidos
- [Arquitectura](#arquitectura)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Requisitos](#requisitos)
- [Instalación y Despliegue](#instalación-y-despliegue)
- [Uso y Comandos](#uso-y-comandos)
- [Desarrollo](#desarrollo)
- [Configuración de Producción](#configuración-de-producción)

## 🏗 Arquitectura

El sistema utiliza una arquitectura de contenedores orquestada por Docker Compose:

*   **Nginx (Proxy Reverso)**:
    *   Puerto expuesto: `80`
    *   Función: Servidor de archivos estáticos (Frontend) y enrutamiento de peticiones API hacia el backend.
    *   Optimización: Manejo eficiente de caché y conexiones.
*   **Backend (Node.js)**:
    *   Puerto interno: `3000` (No expuesto directamente a internet).
    *   Framework: Express.js.
    *   Seguridad: Ejecución como usuario no-root (`node`).
*   **Frontend**:
    *   HTML5, CSS3, JavaScript Vanilla.
    *   Servido estáticamente por Nginx.

## 📂 Estructura del Proyecto

```bash
proyecto-certificados/
├── backend/                # Lógica del servidor
│   ├── src/
│   │   ├── controllers/    # Controladores de lógica de negocio
│   │   ├── models/         # Modelos de datos
│   │   ├── routes/         # Definiciones de rutas API
│   │   ├── services/       # Integraciones externas
│   │   └── index.js        # Punto de entrada
│   ├── Dockerfile          # Definición de imagen Docker (Multi-stage)
│   └── package.json        # Dependencias
├── frontend/               # Interfaz de usuario
│   ├── assets/             # Estilos y recursos
│   ├── js/                 # Lógica cliente
│   └── views/              # Archivos HTML
├── nginx/                  # Configuración del servidor web
│   └── default.conf        # Reglas de proxy reverso
├── docker-compose.yml      # Orquestación de servicios
└── README.md               # Documentación
```

## ⚙️ Requisitos

*   **Docker** y **Docker Compose** instalados.
*   **Hardware**: Compatible con Raspberry Pi 4 (ARM64) o cualquier sistema x86_64.

## 🚀 Instalación y Despliegue

### 1. Clonar el repositorio
```bash
git clone https://github.com/Churr000God/proyecto-certificados.git
cd proyecto-certificados
```

### 2. Iniciar la aplicación
El siguiente comando construirá las imágenes y levantará los contenedores en segundo plano:

```bash
docker-compose up -d --build
```

### 3. Verificar el estado
```bash
docker-compose ps
```

Accede a la aplicación en: **http://localhost** (o la IP de tu servidor).

## 🛠 Uso y Comandos

| Acción | Comando |
|--------|---------|
| **Iniciar todo** | `docker-compose up -d` |
| **Reiniciar y reconstruir** | `docker-compose up -d --build` |
| **Detener servicios** | `docker-compose down` |
| **Ver logs (Backend)** | `docker-compose logs -f backend` |
| **Ver logs (Nginx)** | `docker-compose logs -f nginx` |

## 💻 Desarrollo

### Notas sobre el Backend
El backend utiliza `nodemon` en entorno de desarrollo (aunque el Dockerfile actual está optimizado para producción). Para cambios rápidos en desarrollo local sin reconstruir, se recomienda montar volúmenes o ejecutar el backend localmente si se tiene Node.js instalado.

### Notas sobre el Frontend
Los archivos del frontend se encuentran en `frontend/`. Cualquier cambio en HTML/CSS/JS requiere reiniciar el contenedor de Nginx o esperar la recarga si se configuran volúmenes de desarrollo.

## 🔒 Configuración de Producción (Raspberry Pi)

Para asegurar que el servicio arranque automáticamente tras un reinicio de la Raspberry Pi:

1.  Habilitar el servicio de Docker:
    ```bash
    sudo systemctl enable docker
    ```
2.  La política `restart: always` ya está configurada en `docker-compose.yml`.

---
**Autor:** DevOps Team
**Licencia:** ISC
