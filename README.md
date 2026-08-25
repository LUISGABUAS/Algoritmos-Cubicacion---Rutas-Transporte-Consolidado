# Algoritmos de Cubicación — Rutas y Transporte Consolidado

> **Aportación de Luis** — Frontend completo: arquitectura, pantallas, visualización 2D/3D y capa de conexión al backend.

Frontend del sistema de optimización de carga y rutas para transporte consolidado. Permite registrar paquetes, asignar tráileres, ejecutar el algoritmo de acomodo óptimo y gestionar rutas de entrega con visualización 2D y 3D.

## Stack

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19 | UI |
| TypeScript | 6 | Tipado estático |
| Vite | 8 | Build tool |
| TailwindCSS | 4 | Estilos |
| TanStack Query | 5 | Server state |
| React Router | 7 | Navegación |
| Three.js + R3F | 0.185 / 9.7 | Visualización 3D |
| Recharts | 3 | Gráficas |
| React Hook Form + Zod | 7 / 4 | Formularios |
| Zustand | — | Client state |

## Módulos implementados

| Módulo | Pantallas | Estado |
|---|---|---|
| Dashboard | KPIs, gráficas, tabla de tráileres activos | ✅ Listo |
| Paquetes | Listado con filtros, formulario crear/editar | ✅ Listo |
| Tráileres | Listado, formulario con preview SVG | ✅ Listo |
| Acomodación | Vista superior / lateral / **3D interactiva** + capas + accesibilidad | ✅ Listo |
| Rutas | Listado, detalle con paradas y mapa placeholder | ✅ Listo |
| Conexión backend | apiClient, toggle mock/real por env var | ✅ Listo |
| Clientes | — | Pendiente |
| Conductores | — | Pendiente |
| Operaciones | — | Pendiente |
| Reportes | — | Pendiente |

## Correr en local

```bash
npm install
npm run dev
```

La app corre en `http://localhost:5173` con datos mock por defecto.

## Variables de entorno

Copia `.env.example` a `.env.local` y ajusta:

```env
# URL base de la API REST del backend
VITE_API_URL=http://localhost:8000/api/v1

# true  → usa datos mock (default para desarrollo)
# false → conecta al backend real
VITE_USE_MOCK=true
```

Con `VITE_USE_MOCK=false` el frontend consume la API real sin cambiar ningún componente.

## Endpoints esperados del backend

```
GET    /packages              → Package[]
GET    /packages/:id          → Package
POST   /packages              → Package
PUT    /packages/:id          → Package
DELETE /packages/:id          → 204

GET    /trailers              → Trailer[]
GET    /trailers/:id          → Trailer
POST   /trailers              → Trailer
PUT    /trailers/:id          → Trailer
DELETE /trailers/:id          → 204

GET    /routes                → Route[]
GET    /routes/:id            → Route (incluye stops con packageIds)

GET    /drivers               → Driver[]
GET    /drivers/:id           → Driver

POST   /optimization/run      → OptimizationResult
```

Ver `src/services/` para el contrato completo de tipos de entrada/salida.

## Algoritmo de optimización

El frontend llama a `POST /optimization/run` con:

```ts
{
  trailerId: string;
  packageIds: string[];
}
```

Y espera recibir posiciones 3D para cada paquete:

```ts
{
  trailerId: string;
  placements: { packageId, x, y, z, rotationY }[];
  unplacedPackageIds: string[];
  metrics: { volumeUtilization, weightUtilization, ... };
}
```

El sistema de coordenadas usa `(0,0,0)` = esquina inferior trasera izquierda (puertas). Unidades en centímetros.

## Visualización 3D

La vista 3D (`Trailer3DView`) usa Three.js vía `@react-three/fiber`:

- Arrastra para rotar
- Scroll para zoom
- Clic en paquete para seleccionarlo
- Paquetes coloreados por parada de entrega
- Cara naranja = puertas del tráiler (lado de descarga)

## Estructura del proyecto

```
src/
├── app/            # Router y providers
├── components/
│   ├── layout/     # Sidebar, Header, navegación
│   ├── shared/     # EmptyState, Pagination, RouteMap
│   └── ui/         # Componentes base (shadcn/ui)
├── features/
│   ├── dashboard/  # KPIs y gráficas
│   ├── loading/    # Acomodación 2D/3D + accesibilidad
│   ├── packages/   # CRUD de paquetes
│   ├── routes/     # Listado y detalle de rutas
│   └── trailers/   # CRUD de tráileres
├── mocks/          # Datos de prueba
├── pages/          # Páginas ensambladas
├── services/       # Capa HTTP (mock + API real)
├── types/          # Tipos TypeScript compartidos
└── utils/          # Formatters, cálculos
```

## Ramas

| Rama | Descripción |
|---|---|
| `main` | Código estable |
| `develop` | Integración continua de features |
| `feat/fase-N-*` | Feature branch por fase |
