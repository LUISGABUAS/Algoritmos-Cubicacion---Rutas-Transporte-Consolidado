import type { Package, PackageFilters, CreatePackageDto, UpdatePackageDto } from "@/types";
import { mockPackages } from "@/mocks/packages";

// Simula latencia de red en desarrollo con mocks
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

function applyFilters(packages: Package[], filters?: PackageFilters): Package[] {
  if (!filters) return packages;
  return packages.filter((p) => {
    if (filters.status && p.status !== filters.status) return false;
    if (filters.routeId && p.routeId !== filters.routeId) return false;
    if (filters.priority && p.priority !== filters.priority) return false;
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

// ─── Stubs listos para conectar al backend ────────────────────────────────────
// Cuando llegue la API real: reemplaza el cuerpo de cada función con
// return apiClient.get/post/put/delete(...) y elimina el delay + lógica mock.

export const packageService = {
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
