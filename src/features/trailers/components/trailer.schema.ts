import { z } from "zod";

export const trailerFormSchema = z.object({
  name:          z.string().min(1, "El nombre es requerido"),
  type:          z.string().optional(),
  licensePlate:  z.string().optional(),
  internalLength:z.coerce.number().positive("Debe ser mayor a 0"),
  internalWidth: z.coerce.number().positive("Debe ser mayor a 0"),
  internalHeight:z.coerce.number().positive("Debe ser mayor a 0"),
  maxWeight:     z.coerce.number().positive("Debe ser mayor a 0"),
  status:        z.enum(["available", "loading", "in_transit", "unloading", "maintenance"]),
  routeId:       z.string().optional(),
  driverId:      z.string().optional(),
});

export type TrailerFormValues = z.infer<typeof trailerFormSchema>;
