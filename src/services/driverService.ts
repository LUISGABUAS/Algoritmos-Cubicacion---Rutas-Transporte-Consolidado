import type { Driver } from "@/types";
import { mockDrivers } from "@/mocks/drivers";

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export const driverService = {
  async getAll(): Promise<Driver[]> {
    await delay();
    return [...mockDrivers];
  },

  async getById(id: string): Promise<Driver> {
    await delay();
    const driver = mockDrivers.find((d) => d.id === id);
    if (!driver) throw new Error(`Conductor ${id} no encontrado`);
    return { ...driver };
  },
};
