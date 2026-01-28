# Guía de Contribución para Proyecto Certificados

¡Gracias por tu interés en contribuir a este proyecto! Este documento establece los lineamientos para trabajar en equipo de manera ordenada y eficiente.

## 🚀 Flujo de Trabajo (Workflow)

Utilizamos un modelo de ramas simplificado basado en **GitHub Flow**.

### Ramas Principales
- **`main`**: Contiene el código en producción. **NUNCA** se hace commit directo aquí. Todo cambio entra vía Pull Request (PR).

### Ramas de Trabajo
Para cada tarea, crea una rama nueva desde `main` con la siguiente nomenclatura:

- `feature/nombre-funcionalidad` (ej: `feature/login-page`, `feature/generacion-pdf`)
- `fix/nombre-error` (ej: `fix/alineacion-navbar`, `fix/api-timeout`)
- `docs/nombre-documentacion` (ej: `docs/actualizar-readme`)
- `chore/mantenimiento` (ej: `chore/actualizar-dependencias`)

## 🛠️ Pasos para Contribuir

1.  **Sincroniza tu repositorio local:**
    ```bash
    git checkout main
    git pull origin main
    ```

2.  **Crea tu rama de trabajo:**
    ```bash
    git checkout -b feature/mi-nueva-funcionalidad
    ```

3.  **Desarrolla y guarda cambios:**
    Haz commits pequeños y frecuentes. No esperes a terminar todo para guardar.

4.  **Escribe mensajes de commit semánticos:**
    Seguimos la convención de [Conventional Commits](https://www.conventionalcommits.org/). Estructura: `<tipo>: <descripción breve>`

    - `feat`: Nueva funcionalidad.
    - `fix`: Corrección de errores.
    - `docs`: Cambios en documentación.
    - `style`: Cambios de formato (espacios, puntos y comas) que no afectan el código.
    - `refactor`: Cambio de código que no arregla bugs ni añade funcionalidades (limpieza).
    - `test`: Añadir o corregir tests.
    - `chore`: Tareas de construcción, herramientas, etc.

    **Ejemplos:**
    - `feat: agregar endpoint de login`
    - `fix: corregir color del botón en móvil`
    - `docs: agregar guia de contribucion`

5.  **Sube tus cambios:**
    ```bash
    git push -u origin feature/mi-nueva-funcionalidad
    ```

6.  **Crea un Pull Request (PR):**
    - Ve a GitHub y abre un PR comparando tu rama contra `main`.
    - Describe qué cambios hiciste y por qué.
    - Solicita revisión de un compañero.

## 🐛 Reporte de Errores (Bugs)

Si encuentras un error, por favor abre un **Issue** en GitHub incluyendo:
- Pasos para reproducir el error.
- Comportamiento esperado vs. real.
- Capturas de pantalla (si aplica).
- Entorno (Navegador, SO, etc.).

## 📝 Estilo de Código

- **Frontend**: Mantener estructura HTML semántica y CSS organizado.
- **Backend**: Seguir principios de código limpio en Node.js/Express.
- **Comentarios**: Documentar funciones complejas.

---
*Este proyecto busca ser un espacio de aprendizaje y colaboración profesional. ¡Gracias por tu aporte!*
