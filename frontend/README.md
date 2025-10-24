# API Management Frontend

Frontend React + Vite para interactuar con el backend NestJS de gestión de endpoints, parámetros, ejecuciones y schedules.

## Requisitos
* Node.js 18+
* Backend NestJS corriendo (`npm run start:dev`) con CORS permitido para `http://localhost:5173` y guardia de API Key habilitado.

## Variables de entorno
Crear `.env.local` (parte de Vite, no se commitea). Puedes basarte en `.env.example`:
```
VITE_API_BASE_URL=http://localhost:3000
VITE_API_KEY=TU_API_KEY
```
El módulo `src/env.ts` valida su existencia al cargar.

## Scripts
```bash
npm install          # instala dependencias
npm run dev          # modo desarrollo (http://localhost:5173)
npm run build        # build producción (dist/)
npm run preview      # sirve build de dist
npm run lint         # lint ts/tsx
npm run typecheck    # verificación de tipos (tsc --noEmit)
npm run format       # formatea con prettier (si se añade)
```

## Estructura
```
frontend/
  package.json
  tsconfig.json
  vite.config.ts
  index.html
  .env.example
  src/
    env.ts                # validación de variables
    api/
      types.ts            # tipos alineados con entidades Nest
      client.ts           # wrapper fetch con headers API Key
    App.tsx               # UI principal (endpoints, parámetros, schedules, ejecución)
    main.tsx              # arranque React
```

## Funcionalidades actuales
* Listar endpoints y refrescar manualmente.
* Crear endpoint básico (name, method, baseUrl, path).
* Crear y borrar parámetros asociados (location, tipo, requerido, default).
* Crear y borrar schedules (CRON / INTERVAL / ONCE).
* Ejecutar endpoint manualmente con retry automático si TIMEOUT (1 reintento).
* Log estilo consola con marcas de tiempo y banner de error temporal (5s) para errores recientes.

## Flujo de uso
1. Inicia backend NestJS y verifica CORS (ver consola backend).
2. Ajusta `.env.local` con API key válida.
3. `npm run dev` en `frontend/`.
4. Crea un endpoint (ej: GET https://jsonplaceholder.typicode.com /posts/{id}).
5. Agrega parámetro PATH `id` (string, requerido) y ejecuta.
6. Crea un schedule INTERVAL con `intervalMs=60000` para ejecución automática.

## Troubleshooting
| Problema | Causa probable | Solución |
|----------|----------------|----------|
| Banner error "listEndpoints" | Backend caído / API Key inválida | Verifica backend y `VITE_API_KEY` |
| CORS bloqueado | Falta `origin` en `app.enableCors` | Agregar `http://localhost:5173` y reiniciar backend |
| Tiempo de ejecución muy alto | Timeout backend o red | Ajusta `timeoutMs` del endpoint en backend |
| No se ve duración | Backend no envía `durationMs` | Confirmar lógica de ejecución en servicio de executions |

## Build producción
```bash
npm run build
npm run preview
```
Sirve `dist/` con cualquier servidor estático (Nginx, Express, etc.).

## Próximas mejoras sugeridas
* Listado histórico de ejecuciones (requiere endpoint backend adicional).
* Edición completa de endpoint (headers, body template, auth bearer token).
* Validación avanzada de parámetros (usar `validationRulesJson`).
* Estilos con Tailwind o Mantine.
* Tests de componentes y de cliente API (Vitest + React Testing Library).

## Notas
Este frontend es minimal para validar flujos. Ajustar seguridad (no exponer API Key pública en producción; usar proxy / auth). Añadir manejo offline y loading states más ricos según necesidad.
