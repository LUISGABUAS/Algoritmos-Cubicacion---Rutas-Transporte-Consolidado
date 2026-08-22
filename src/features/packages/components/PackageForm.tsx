import { useEffect } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormDescription,
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
import { DimensionPreview } from "./DimensionPreview";
import { packageFormSchema, type PackageFormValues } from "./package.schema";
import { useCreatePackage, useUpdatePackage, usePackage } from "../hooks/usePackages";
import { routeService } from "@/services/routeService";
import type { Package } from "@/types";

interface PackageFormProps {
  packageId?: string; // presente = modo edición
}

const DEFAULT_VALUES: PackageFormValues = {
  senderName:    "",
  recipientName: "",
  origin:        "Monterrey, NL",
  destination:   "",
  priority:      "medium",
  status:        "pending",
  fragile:       false,
  stackable:     true,
  requiresInsurance: false,
  allowUpright:  false,
  allowOnSide:   false,
  allowOnEnd:    false,
  length: 0,
  width:  0,
  height: 0,
  weight: 0,
};

function mapPackageToForm(pkg: Package): PackageFormValues {
  return {
    barcode:       pkg.barcode,
    senderName:    pkg.senderName,
    recipientName: pkg.recipientName,
    origin:        pkg.origin,
    destination:   pkg.destination,
    routeId:       pkg.routeId,
    stopOrder:     pkg.stopOrder,
    priority:      pkg.priority,
    serviceType:   pkg.serviceType,
    status:        pkg.status,
    length:        pkg.length,
    width:         pkg.width,
    height:        pkg.height,
    weight:        pkg.weight,
    fragile:       pkg.fragile,
    stackable:     pkg.stackable,
    requiresInsurance: pkg.requiresInsurance,
    declaredValue: pkg.declaredValue,
    allowUpright:  pkg.allowedOrientations?.includes("upright") ?? false,
    allowOnSide:   pkg.allowedOrientations?.includes("on_side") ?? false,
    allowOnEnd:    pkg.allowedOrientations?.includes("on_end") ?? false,
    description:   pkg.description,
    notes:         pkg.notes,
    collectionDate:    pkg.collectionDate?.slice(0, 10),
    estimatedDelivery: pkg.estimatedDelivery?.slice(0, 10),
  };
}

export function PackageForm({ packageId }: PackageFormProps) {
  const navigate = useNavigate();
  const isEdit = !!packageId;

  const { data: existingPkg, isLoading: loadingPkg } = usePackage(packageId ?? "");
  const { data: routes } = useQuery({
    queryKey: ["routes"],
    queryFn: () => routeService.getAll(),
  });

  const createMutation = useCreatePackage();
  const updateMutation = useUpdatePackage();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema) as Resolver<PackageFormValues>,
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (existingPkg) form.reset(mapPackageToForm(existingPkg));
  }, [existingPkg, form]);

  const [length, width, height, requiresInsurance] = useWatch({
    control: form.control,
    name: ["length", "width", "height", "requiresInsurance"],
  });

  async function onSubmit(values: PackageFormValues) {
    const orientations = [
      values.allowUpright ? "upright" as const : null,
      values.allowOnSide  ? "on_side" as const  : null,
      values.allowOnEnd   ? "on_end" as const   : null,
    ].filter(Boolean) as ("upright" | "on_side" | "on_end")[];

    const dto = {
      barcode:       values.barcode,
      senderName:    values.senderName,
      recipientName: values.recipientName,
      origin:        values.origin,
      destination:   values.destination,
      routeId:       values.routeId || undefined,
      stopOrder:     values.stopOrder as number | undefined,
      priority:      values.priority,
      serviceType:   values.serviceType,
      status:        values.status,
      length:        Number(values.length),
      width:         Number(values.width),
      height:        Number(values.height),
      weight:        Number(values.weight),
      fragile:       values.fragile,
      stackable:     values.stackable,
      requiresInsurance: values.requiresInsurance,
      declaredValue: values.declaredValue as number | undefined,
      allowedOrientations: orientations.length > 0 ? orientations : undefined,
      description:   values.description,
      notes:         values.notes,
      collectionDate:    values.collectionDate ? new Date(values.collectionDate).toISOString() : undefined,
      estimatedDelivery: values.estimatedDelivery ? new Date(values.estimatedDelivery).toISOString() : undefined,
    };

    if (isEdit && packageId) {
      await updateMutation.mutateAsync({ id: packageId, data: dto });
    } else {
      await createMutation.mutateAsync(dto);
    }
    navigate("/packages");
  }

  if (isEdit && loadingPkg) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Sección 1: Información general ────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información general</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

            <FormField control={form.control} name="senderName" render={({ field }) => (
              <FormItem>
                <FormLabel>Remitente <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input placeholder="Empresa o persona que envía" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="recipientName" render={({ field }) => (
              <FormItem>
                <FormLabel>Destinatario <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input placeholder="Empresa o persona que recibe" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="barcode" render={({ field }) => (
              <FormItem>
                <FormLabel>Código de barras / QR</FormLabel>
                <FormControl><Input placeholder="BC-20260001" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="origin" render={({ field }) => (
              <FormItem>
                <FormLabel>Origen <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input placeholder="Ciudad de origen" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="destination" render={({ field }) => (
              <FormItem>
                <FormLabel>Destino <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input placeholder="Ciudad de destino" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="priority" render={({ field }) => (
              <FormItem>
                <FormLabel>Prioridad <span className="text-destructive">*</span></FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="routeId" render={({ field }) => (
              <FormItem>
                <FormLabel>Ruta asignada</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                  </FormControl>
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

            <FormField control={form.control} name="stopOrder" render={({ field }) => (
              <FormItem>
                <FormLabel>Parada / Orden de entrega</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="1, 2, 3..."
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription className="text-xs">1 = primera entrega (más cercana a las puertas)</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="serviceType" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de servicio</FormLabel>
                <FormControl><Input placeholder="Estándar, Express, Refrigerado..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="collectionDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de recolección</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="estimatedDelivery" render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha estimada de entrega</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="assigned">Asignado</SelectItem>
                    <SelectItem value="loaded">Cargado</SelectItem>
                    <SelectItem value="in_transit">En tránsito</SelectItem>
                    <SelectItem value="delivered">Entregado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="sm:col-span-2 lg:col-span-3">
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción / Contenido</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción del contenido del paquete..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        {/* ── Sección 2: Dimensiones y peso ─────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dimensiones y peso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Campos numéricos */}
              <div className="grid grid-cols-2 gap-5">
                <FormField control={form.control} name="length" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Largo <span className="text-destructive">*</span> <span className="text-muted-foreground font-normal text-xs">(cm)</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        placeholder="0"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="width" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ancho <span className="text-destructive">*</span> <span className="text-muted-foreground font-normal text-xs">(cm)</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        placeholder="0"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="height" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alto <span className="text-destructive">*</span> <span className="text-muted-foreground font-normal text-xs">(cm)</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        placeholder="0"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="weight" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso <span className="text-destructive">*</span> <span className="text-muted-foreground font-normal text-xs">(kg)</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Preview visual */}
              <div className="flex items-center justify-center rounded-lg border border-dashed bg-muted/30 p-6">
                <DimensionPreview
                  length={Number(length) || 0}
                  width={Number(width) || 0}
                  height={Number(height) || 0}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Sección 3: Características ────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Características</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Switches */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField control={form.control} name="fragile" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel className="text-sm font-medium">Frágil</FormLabel>
                    <FormDescription className="text-xs">Requiere manejo especial</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="stackable" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel className="text-sm font-medium">Apilable</FormLabel>
                    <FormDescription className="text-xs">Puede tener carga encima</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="requiresInsurance" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel className="text-sm font-medium">Requiere seguro</FormLabel>
                    <FormDescription className="text-xs">Mercancía asegurada</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
            </div>

            {/* Valor declarado — solo cuando requiresInsurance */}
            {requiresInsurance && (
              <FormField control={form.control} name="declaredValue" render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel>Valor declarado <span className="text-muted-foreground font-normal text-xs">(MXN)</span></FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="100"
                      placeholder="0.00"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <Separator />

            {/* Orientaciones permitidas */}
            <div>
              <p className="text-sm font-medium mb-1">Orientaciones permitidas</p>
              <p className="text-xs text-muted-foreground mb-3">Deja vacío si puede colocarse en cualquier orientación.</p>
              <div className="flex flex-wrap gap-4">
                {(
                  [
                    { name: "allowUpright" as const, label: "Normal (vertical)" },
                    { name: "allowOnSide"  as const, label: "Recostado (lateral)" },
                    { name: "allowOnEnd"   as const, label: "De punta" },
                  ] as const
                ).map(({ name, label }) => (
                  <FormField key={name} control={form.control} name={name} render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="text-sm font-normal cursor-pointer">{label}</FormLabel>
                    </FormItem>
                  )} />
                ))}
              </div>
            </div>

            <Separator />

            {/* Observaciones */}
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Observaciones</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Instrucciones especiales, notas de manejo..."
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* ── Botones de acción ─────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pb-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/packages")}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-navy hover:bg-navy/90"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? isEdit ? "Guardando..." : "Creando..."
              : isEdit ? "Guardar cambios" : "Crear paquete"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
