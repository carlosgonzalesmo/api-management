# Funcionalidades - API Integrator

Este documento describe todas las funcionalidades implementadas en la aplicación API Integrator (backend NestJS + frontend React).

---

## 1. Gestión de Endpoints

- **Crear endpoint:** Permite registrar un nuevo endpoint HTTP con nombre, método, base URL, path, headers, body template, autenticación, estado activo/inactivo, configuración de reintentos y timeout.
- **Listar endpoints:** Visualiza todos los endpoints registrados.
- **Consultar endpoint:** Muestra el detalle completo de un endpoint específico.
- **Actualizar endpoint:** Permite modificar cualquier campo de un endpoint existente.
- **Eliminar endpoint:** Realiza un borrado lógico (soft delete) del endpoint.

## 2. Parámetros de Endpoints

- **Crear parámetro:** Asocia parámetros a un endpoint, definiendo ubicación (PATH, QUERY, HEADER, BODY), tipo de dato, requerido/opcional, valor por defecto, ejemplo, descripción y reglas de validación.
- **Listar parámetros:** Visualiza todos los parámetros asociados a un endpoint.
- **Eliminar parámetro:** Permite borrar parámetros individuales de un endpoint.

## 3. Ejecución de Endpoints

- **Ejecución manual:** Permite ejecutar un endpoint de forma manual, con posibilidad de sobrescribir valores de parámetros.
- **Almacenamiento de ejecuciones:** Guarda cada ejecución con información de tiempos, estado, código HTTP, headers, body, errores y truncamiento de respuesta.
- **Visualización de ejecuciones:** Permite consultar el historial de ejecuciones recientes por endpoint.

## 4. Programación de Ejecuciones (Schedules)

- **Crear schedule:** Permite programar la ejecución automática de un endpoint mediante:
  - CRON (expresión cron estándar)
  - INTERVAL (cada X milisegundos)
  - ONCE (una sola vez)
- **Listar schedules:** Visualiza todas las programaciones asociadas a un endpoint.
- **Actualizar schedule:** Permite modificar la configuración de un schedule existente.
- **Eliminar schedule:** Permite borrar programaciones individuales.

## 5. Scheduler Interno

- **Ejecución automática:** Un servicio interno revisa periódicamente los schedules vencidos y dispara las ejecuciones correspondientes.
- **Actualización de schedule:** Tras cada ejecución, el sistema calcula el próximo momento de ejecución (`nextRunAt`) o deshabilita el schedule si es de tipo ONCE.

## 6. Seguridad

- **Autenticación por API Key:** Todas las rutas del backend requieren una API Key válida en el header `x-api-key`.
- **Validación estricta:** Uso de DTOs y class-validator para asegurar la integridad de los datos recibidos.

## 7. Configuración y Entorno

- **Variables de entorno:** Configuración flexible para base de datos, Redis, API Key, límites de respuesta, cron del scheduler, etc.
- **Migraciones automáticas:** Scripts para crear y actualizar la estructura de la base de datos.

## 8. Frontend React + Vite

- **Interfaz gráfica:** Permite gestionar endpoints, parámetros, ejecuciones y schedules desde el navegador.
- **Log de acciones:** Muestra un historial de acciones y errores recientes.
- **Validación de configuración:** Verifica la existencia de variables de entorno necesarias para el funcionamiento del frontend.

---

## Resumen de rutas principales

- **Endpoints:**  
  - `POST /endpoints`  
  - `GET /endpoints`  
  - `GET /endpoints/:id`  
  - `PATCH /endpoints/:id`  
  - `DELETE /endpoints/:id`

- **Parámetros:**  
  - `POST /endpoints/:endpointId/parameters`  
  - `GET /endpoints/:endpointId/parameters`  
  - `DELETE /parameters/:paramId`

- **Ejecuciones:**  
  - `POST /endpoints/:endpointId/execute`  
  - `GET /endpoints/:endpointId/executions?limit=20`

- **Schedules:**  
  - `POST /endpoints/:endpointId/schedules`  
  - `GET /endpoints/:endpointId/schedules`  
  - `PATCH /schedules/:id`  
  - `DELETE /schedules/:id`

---

## Futuras extensiones (no implementadas)

- Gestión de usuarios y permisos.
- Soporte para OAuth u otros tipos de autenticación.
- Métricas y monitoreo avanzado.
- Ejecución concurrente y en clúster.
- Edición avanzada de endpoints y parámetros.

---

**Última actualización:** Junio 2024