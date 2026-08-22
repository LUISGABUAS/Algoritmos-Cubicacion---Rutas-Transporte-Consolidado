import type { Package, PackageFilters, CreatePackageDto, UpdatePackageDto } from "@/types";
import { mockPackages } from "@/mocks/packages";
import { apiClient } from "./apiClient";

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

// ─── Implementación mock ──────────────────────────────────────────────────────

function applyFilters(packages: Package[], filters?: PackageFilters): Package[] {
  if (!filters) return packages;
  return packages.filter((p) => {
    if (filters.status      && p.status !== filters.status)           return false;
    if (filters.routeId     && p.routeId !== filters.routeId)         return false;
    if (filters.priority    && p.priority !== filters.priority)        return false;
    if (filters.destination && !p.destination.toLowerCase().includes(filters.destination.toLowerCase())) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !p.id.toLowerCase().includes(q) &&
        !p.recipientName.toLowerCase().includes(q) &&
        !p.destination.toLowerCase().includes(q) &&
        !(p.barcode?.toLowerCase().includes(q))
      ) return false;
    }
    return true;
  });
}

const mockService = {
  async getAll(filters?: PackageFilters): Promise<Package[]> {
    await delay();
    return applyFilters([...mockPackages], filters);
  },
  async getById(id: string): Promise<Package> {
    await delay();
    const pkg = mockPackages.find((p) => p.id === id);
    if (!pkg) throw new Error(`Paquete ${id} no encontrado`);
    return { ...pkg };
  },
  async getByTrailer(trailerId: string): Promise<Package[]> {
    await delay();
    return mockPackages.filter((p) => p.trailerId === trailerId).map((p) => ({ ...p }));
  },
  async getByRoute(routeId: string): Promise<Package[]> {
    await delay();
    return mockPackages.filter((p) => p.routeId === routeId).map((p) => ({ ...p }));
  },
  async create(data: CreatePackageDto): Promise<Package> {
    await delay(600);
    const newPkg: Package = {
      ...data,
      id: `PKG-${String(mockPackages.length + 1).padStart(3, "0")}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockPackages.push(newPkg);
    return { ...newPkg };
  },
  async update(id: string, data: UpdatePackageDto): Promise<Package> {
    await delay(600);
    const idx = mockPackages.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Paquete ${id} no encontrado`);
    mockPackages[idx] = { ...mockPackages[idx], ...data, updatedAt: new Date().toISOString() };
    return { ...mockPackages[idx] };
  },
  async delete(id: string): Promise<void> {
    await delay(400);
    const idx = mockPackages.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Paquete ${id} no encontrado`);
    mockPackages.splice(idx, 1);
  },
};

// ─── Implementación API real ──────────────────────────────────────────────────
// Endpoints esperados del backend:
//   GET    /packages              → Package[]
//   GET    /packages/:id          → Package
//   GET    /packages?trailerId=X  → Package[]
//   GET    /packages?routeId=X    → Package[]
//   POST   /packages              → Package
//   PUT    /packages/:id          → Package
//   DELETE /packages/:id          → 204

const apiService = {
  getAll:       (filters?: PackageFilters) => apiClient.get<Package[]>(`/packages${buildQuery(filters)}`),
  getById:      (id: string)               => apiClient.get<Package>(`/packages/${id}`),
  getByTrailer: (trailerId: string)        => apiClient.get<Package[]>(`/packages?trailerId=${trailerId}`),
  getByRoute:   (routeId: string)          => apiClient.get<Package[]>(`/packages?routeId=${routeId}`),
  create:       (data: CreatePackageDto)   => apiClient.post<Package>("/packages", data),
  update:       (id: string, data: UpdatePackageDto) => apiClient.put<Package>(`/packages/${id}`, data),
  delete:       (id: string)               => apiClient.delete<void>(`/packages/${id}`),
};

function buildQuery(filters?: PackageFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
  const str = params.toString();
  return str ? `?${str}` : "";
}

// ─── Export unificado ─────────────────────────────────────────────────────────
export const packageService = USE_MOCK ? mockService : apiService;
