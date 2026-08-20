import { useEffect } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrailerDimensionPreview } from "./TrailerDimensionPreview";
import { TrailerCapacityBar } from "./TrailerCapacityBar";
import { trailerFormSchema, type TrailerFormValues } from "./trailer.schema";
import { useTrailer, useCreateTrailer, useUpdateTrailer } from "../hooks/useTrailers";
import { routeService } from "@/services/routeService";
import { driverService } from "@/services/driverService";
import { packageService } from "@/services/packageService";
import { totalVolume, totalWeight, trailerTotalVolume } from "@/utils/calculations";
import type { Trailer } from "@/types";

interface TrailerFormProps {
  trailerId?: string;
}

const DEFAULT_VALUES: TrailerFormValues = {
  name:           "",
  type:           "",
  licensePlate:   "",
  internalLength: 1360,
  internalWidth:  240,
  internalHeight: 270,
  maxWeight:      25000,
  status:         "available",
};

function mapTrailerToForm(t: Trailer): TrailerFormValues {
  return {
    name:           t.name,
    type:           t.type ?? "",
    licensePlate:   t.licensePlate ?? "",
    internalLength: t.internalLength,
    internalWidth:  t.internalWidth,
    internalHeight: t.internalHeight,
    maxWeight:      t.maxWeight,
    status:         t.status,
    routeId:        t.routeId,
    driverId:       t.driverId,
  };
}

export function TrailerForm({ trailerId }: TrailerFormProps) {
  const navigate = useNavigate();
  const isEdit = !!trailerId;

  const { data: existingTrailer, isLoading: loadingTrailer } = useTrailer(trailerId ?? "");
  const { data: routes } = useQuery({ queryKey: ["routes"], queryFn: () => routeService.getAll() });
  const { data: drivers } = useQuery({ queryKey: ["drivers"], queryFn: () => driverService.getAll() });
  const { data: packages } = useQuery({
    queryKey: ["packages", { trailerId }],
    queryFn: () => packageService.getByTrailer(trailerId!),
    enabled: isEdit && !!trailerId,
  });

  const createMutation = useCreateTrailer();
  const updateMutation = useUpdateTrailer();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<TrailerFormValues>({
    resolver: zodResolver(trailerFormSchema) as Resolver<TrailerFormValues>,
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (existingTrailer) form.reset(mapTrailerToForm(existingTrailer));
  }, [existingTrailer, form]);

  const [length, width, height, maxWeight] = useWatch({
    control: form.control,
    name: ["internalLength", "internalWidth", "internalHeight", "maxWeight"],
  });

  // Métricas actuales cuando hay paquetes cargados
  const pkgs = packages ?? [];
  const usedVol = totalVolume(pkgs);
  const usedWgt = totalWeight(pkgs);
  const capVol = trailerTotalVolume({
    internalLength: Number(length) || 0,
    internalWidth:  Number(width)  || 0,
    internalHeight: Number(height) || 0,
  });
  const volPct = capVol > 0 ? Math.round((usedVol / capVol) * 100) : 0;
  const wgtPct = Number(maxWeight) > 0 ? Math.round((usedWgt / Number(maxWeight)) * 100) : 0;

  async function onSubmit(values: TrailerFormValues) {
    const dto = {
      ...values,
      type:         values.type || undefined,
      licensePlate: values.licensePlate || undefined,
      routeId:      values.routeId || undefined,
      driverId:     values.driverId || undefined,
    };

    if (isEdit && trailerId) {
      await updateMutation.mutateAsync({ id: trailerId, data: dto });
    } else {
      await createMutation.mutateAsync(dto);
    }
    navigate("/trailers");
  }

  if (isEdit && loadingTrailer) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Sección 1: Información básica ─────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información del tráiler</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input placeholder="Tráiler Norte 1" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <FormControl><Input placeholder="Semirremolque 53', Caja seca..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="licensePlate" render={({ field }) => (
              <FormItem>
                <FormLabel>Placa</FormLabel>
                <FormControl><Input placeholder="NL-847-A" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>Estado <span className="text-destructive">*</span></FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="loading">Cargando</SelectItem>
                    <SelectItem value="in_transit">En ruta</SelectItem>
                    <SelectItem value="unloading">Descargando</SelectItem>
                    <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="routeId" render={({ field }) => (
              <FormItem>
                <FormLabel>Ruta asignada</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="">Sin asignar</SelectItem>
                    {routes?.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.id} — {r.origin} → {r.stops.at(-1)?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="driverId" render={({ field }) => (
              <FormItem>
                <FormLabel>Conductor</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="">Sin asignar</SelectItem>
                    {drivers?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* ── Sección 2: Dimensiones ─────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dimensiones internas y capacidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Campos */}
              <div className="grid grid-cols-2 gap-5">
                <FormField control={form.control} name="internalLength" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Largo interno <span className="text-destructive">*</span> <span className="text-muted-foreground font-normal text-xs">(cm)</span></FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="1360"
                        {...field} value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="internalWidth" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ancho interno <span className="text-destructive">*</span> <span className="text-muted-foreground font-normal text-xs">(cm)</span></FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="240"
                        {...field} value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="internalHeight" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alto interno <span className="text-destructive">*</span> <span className="text-muted-foreground font-normal text-xs">(cm)</span></FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="270"
                        {...field} value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="maxWeight" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso máximo <span className="text-destructive">*</span> <span className="text-muted-foreground font-normal text-xs">(kg)</span></FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="25000"
                        {...field} value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Ocupación actual — solo en edición con paquetes */}
                {isEdit && pkgs.length > 0 && (
                  <div className="col-span-2 pt-2">
                    <p className="text-sm font-medium text-foreground mb-3">
                      Ocupación actual · {pkgs.length} paquete{pkgs.length !== 1 ? "s" : ""} cargado{pkgs.length !== 1 ? "s" : ""}
                    </p>
                    <TrailerCapacityBar
                      volumePct={volPct}
                      weightPct={wgtPct}
                      usedVolume={usedVol}
                      totalCapacityVolume={capVol}
                      usedWeight={usedWgt}
                      maxWeight={Number(maxWeight) || 1}
                    />
                  </div>
                )}
              </div>

              {/* Preview visual */}
              <div className="flex items-center justify-center rounded-lg border border-dashed bg-muted/30 p-6">
                <TrailerDimensionPreview
                  length={Number(length) || 0}
                  width={Number(width) || 0}
                  height={Number(height) || 0}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Botones ────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pb-4">
          <Button type="button" variant="outline" onClick={() => navigate("/trailers")} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-navy hover:bg-navy/90" disabled={isSubmitting}>
            {isSubmitting
              ? isEdit ? "Guardando..." : "Creando..."
              : isEdit ? "Guardar cambios" : "Crear tráiler"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
