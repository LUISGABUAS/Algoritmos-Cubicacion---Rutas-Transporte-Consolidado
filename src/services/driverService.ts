import type { Driver } from "@/types";
import { mockDrivers } from "@/mocks/drivers";
import { apiClient } from "./apiClient";

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

const mockService = {
  async getAll(): Promise<Driver[]> {
    await delay();
    return [...mockDrivers];
  },
  async getById(id: string): Promise<Driver> {
    await delay();
    const d = mockDrivers.find((d) => d.id === id);
    if (!d) throw new Error(`Conductor ${id} no encontrado`);
    return { ...d };
  },
};

// ─── Endpoints esperados del backend ─────────────────────────────────────────
//   GET  /drivers      → Driver[]
//   GET  /drivers/:id  → Driver

const apiService = {
  getAll:  ()           => apiClient.get<Driver[]>("/drivers"),
  getById: (id: string) => apiClient.get<Driver>(`/drivers/${id}`),
};

export const driverService = USE_MOCK ? mockService : apiService;
