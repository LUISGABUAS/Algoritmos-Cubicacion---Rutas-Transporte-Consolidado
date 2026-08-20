import { z } from "zod";

export const packageFormSchema = z.object({
  barcode:      z.string().optional(),
  senderName:   z.string().min(1, "El remitente es requerido"),
  recipientName:z.string().min(1, "El destinatario es requerido"),
  origin:       z.string().min(1, "El origen es requerido"),
  destination:  z.string().min(1, "El destino es requerido"),
  routeId:      z.string().optional(),
  stopOrder:    z.coerce.number().int().positive().optional(),
  priority:     z.enum(["low", "medium", "high"]),
  serviceType:  z.string().optional(),

  length: z.coerce.number().positive("Debe ser mayor a 0"),
  width:  z.coerce.number().positive("Debe ser mayor a 0"),
  height: z.coerce.number().positive("Debe ser mayor a 0"),
  weight: z.coerce.number().positive("Debe ser mayor a 0"),

  fragile:          z.boolean().default(false),
  stackable:        z.boolean().default(true),
  requiresInsurance:z.boolean().default(false),
  declaredValue:    z.coerce.number().nonnegative().optional(),

  allowUpright: z.boolean().default(false),
  allowOnSide:  z.boolean().default(false),
  allowOnEnd:   z.boolean().default(false),

  description:      z.string().optional(),
  notes:            z.string().optional(),
  collectionDate:   z.string().optional(),
  estimatedDelivery:z.string().optional(),

  status: z.enum(["pending", "assigned", "loaded", "in_transit", "delivered"]).default("pending"),
});

export type PackageFormValues = z.infer<typeof packageFormSchema>;
