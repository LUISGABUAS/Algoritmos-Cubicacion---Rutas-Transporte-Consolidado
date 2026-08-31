import { apiClient } from "./apiClient";

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

// Estructuras mínimas que el frontend podría necesitar. En modo mock devolvemos
// un resumen pequeño; en modo real usamos los endpoints del backend.

type ScenarioSummary = {
  id: string;
  meta: { semilla?: number; ciudad?: string };
  zona?: { nombre?: string };
  resumen?: Record<string, any>;
};

const mockScenarios: ScenarioSummary[] = [
  { id: "sc-001", meta: { semilla: 42, ciudad: "Monterrey" }, zona: { nombre: "Centro" } },
];

const mockService = {
  async getAll(): Promise<ScenarioSummary[]> {
    await new Promise((r) => setTimeout(r, 200));
    return [...mockScenarios];
  },
  async getById(id: string): Promise<any> {
    await new Promise((r) => setTimeout(r, 200));
    const s = mockScenarios.find((x) => x.id === id);
    if (!s) throw new Error(`Scenario ${id} not found`);
    // Devolvemos una forma simplificada del JSON del generador.
    return {
      ...s,
      grafo: { nodos: [], aristas: [] },
      entregas: [],
      deposito: null,
      matriz_tiempos: null,
    };
  },
  async getGeojson(_id: string): Promise<any> {
    await new Promise((r) => setTimeout(r, 100));
    return { type: "FeatureCollection", features: [] };
  },
  async getPngUrl(_id: string): Promise<string> {
    // En mock devolvemos una data URL vacía (1x1 PNG).
    return (
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwC" +
      "AAAAAXRSTlMAQObYZgAAAA1JREFUeJxjYAAAAAIAAeIhvDMAAAAASUVORK5CYII="
    );
  },
};

// API real: endpoints esperados
// GET  /scenarios                -> ScenarioSummary[]
// GET  /scenarios/:id            -> Scenario JSON completo
// GET  /scenarios/:id/geojson    -> GeoJSON
// GET  /scenarios/:id/png        -> image/png

const apiService = {
  getAll: () => apiClient.get<ScenarioSummary[]>("/scenarios"),
  getById: (id: string) => apiClient.get<any>(`/scenarios/${id}`),
  getGeojson: (id: string) => apiClient.get<any>(`/scenarios/${id}/geojson`),
  async getPngUrl(id: string): Promise<string> {
    const res = await fetch(`${(import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1")}/scenarios/${id}/png`);
    if (!res.ok) throw new Error(`Failed to fetch png: ${res.statusText}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
};

export const scenarioService = USE_MOCK ? mockService : apiService;

export type { ScenarioSummary };
