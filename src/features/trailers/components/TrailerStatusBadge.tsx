import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TrailerStatus } from "@/types";

const CONFIG: Record<TrailerStatus, { label: string; className: string }> = {
  available:   { label: "Disponible",   className: "bg-success/10 text-success border-0" },
  loading:     { label: "Cargando",     className: "bg-brand-blue/10 text-brand-blue border-0" },
  in_transit:  { label: "En ruta",      className: "bg-navy/10 text-navy border-0" },
  unloading:   { label: "Descargando",  className: "bg-brand-orange/10 text-brand-orange border-0" },
  maintenance: { label: "Mantenimiento",className: "bg-warning/10 text-warning border-0" },
};

interface TrailerStatusBadgeProps {
  status: TrailerStatus;
  className?: string;
}

export function TrailerStatusBadge({ status, className }: TrailerStatusBadgeProps) {
  const { label, className: badgeClass } = CONFIG[status];
  return <Badge className={cn(badgeClass, className)}>{label}</Badge>;
}
