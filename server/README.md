# Mock backend para integración con frontend

Este servidor es un mock mínimo que expone los endpoints que el frontend espera:

- `GET /api/v1/scenarios` → lista de escenarios (busca `Algoritmos/data/escenarios/*.json` o devuelve mock)
- `GET /api/v1/scenarios/:id` → escenario completo JSON
- `GET /api/v1/scenarios/:id/geojson` → geojson del escenario (si existe)
- `GET /api/v1/scenarios/:id/png` → imagen PNG (si existe)
- `POST /api/v1/optimization/run` → endpoint de optimización (mock)

Uso:

```bash
cd server
npm install
npm start
```

Luego configurar en el frontend `.env.local`:

```
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:8000/api/v1
```
