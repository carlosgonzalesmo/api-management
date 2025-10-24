# Documentación de Alcance y Funcionalidades - API Integrator

## Descripción General

**API Integrator** es una plataforma para la gestión, ejecución y programación de endpoints HTTP externos. Permite definir endpoints, sus parámetros, ejecutar llamadas manualmente o de forma programada, y almacenar los resultados de cada ejecución. El sistema está construido sobre NestJS, utiliza PostgreSQL como base de datos y soporta autenticación por API Key.

---

## Alcance del Sistema

### 1. Gestión de Endpoints

- **Crear, listar, consultar, actualizar y eliminar endpoints**.
- Cada endpoint incluye:
  - Nombre, método HTTP, base URL, path (con placeholders), headers, body template, autenticación, estado activo/inactivo, configuración de reintentos y timeout.
- Soporte para autenticación tipo `NONE` o `BEARER`.

### 2. Parámetros de Endpoints

- **Definición de parámetros** asociados a cada endpoint.
- Tipos de parámetros soportados:
  - PATH, QUERY, HEADER, BODY.
- Cada parámetro define:
  - Nombre, tipo de dato (string, number, boolean), requerido/opcional, valor por defecto, ejemplo, descripción y reglas de validación.

### 3. Ejecución de Endpoints

- **Ejecución manual** de endpoints con posibilidad de sobrescribir parámetros.
- **Ejecución automática** mediante programación (schedules).
- Almacena cada ejecución con:
  - Tiempos, estado, código HTTP, headers, body, errores, truncamiento de respuesta, etc.

### 4. Schedules (Programación de Ejecuciones)

- **Programación de ejecuciones** de endpoints mediante:
  - CRON (expresión cron estándar)
  - INTERVAL (cada X milisegundos)
  - ONCE (una sola vez)
- Control de habilitación/deshabilitación de schedules.
- Cálculo automático del próximo momento de ejecución (`nextRunAt`).

### 5. Scheduler Interno

- **Servicio interno** que revisa periódicamente los schedules vencidos y dispara las ejecuciones correspondientes.
- Actualiza el schedule tras cada ejecución (nuevo `nextRunAt` o deshabilita si es ONCE).

### 6. Seguridad

- **Autenticación por API Key** en todas las rutas.
- Validación estricta de datos de entrada mediante DTOs y class-validator.

### 7. Configuración y Entorno

- Variables de entorno para base de datos, Redis, API Key, límites de respuesta, cron del scheduler, etc.
- Migraciones automáticas para la estructura de la base de datos.

---

## Funcionalidades Principales

### Endpoints

- `POST /endpoints` - Crear endpoint
- `GET /endpoints` - Listar endpoints
- `GET /endpoints/:id` - Consultar endpoint
- `PATCH /endpoints/:id` - Actualizar endpoint
- `DELETE /endpoints/:id` - Eliminar (soft delete) endpoint

### Parámetros

- `POST /endpoints/:endpointId/parameters` - Crear parámetro
- `GET /endpoints/:endpointId/parameters` - Listar parámetros de un endpoint
- `DELETE /parameters/:paramId` - Eliminar parámetro

### Ejecuciones

- `POST /endpoints/:endpointId/execute` - Ejecutar endpoint manualmente (con overrides)
- Ejecución automática por scheduler (no expuesta por API)

### Schedules

- `POST /endpoints/:endpointId/schedules` - Crear schedule
- `GET /endpoints/:endpointId/schedules` - Listar schedules de un endpoint
- `PATCH /schedules/:id` - Actualizar schedule
- `DELETE /schedules/:id` - Eliminar schedule

---

## Consideraciones Técnicas

- **NestJS** como framework principal.
- **TypeORM** para acceso a base de datos.
- **PostgreSQL** como motor de base de datos.
- **Validación de datos** con class-validator.
- **Autenticación** global por API Key.
- **Scheduler** basado en cron y ejecución periódica.
- **Soporte para migraciones** de base de datos.
- **Logs** de ejecuciones y errores.

---

## Futuras Extensiones (Fuera de alcance actual)

- Gestión de usuarios y permisos.
- Soporte para OAuth u otros tipos de autenticación.
- Interfaz gráfica de administración.
- Métricas y monitoreo avanzado.
- Ejecución concurrente y en clúster.

---

## Resumen

El sistema permite definir endpoints HTTP, sus parámetros, programar y ejecutar llamadas, almacenar resultados y controlar todo el ciclo de vida de las integraciones externas de forma segura y auditable.