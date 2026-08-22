import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PackageStatus } from "@/types";

const CONFIG: Record<PackageStatus, { label: string; className: string }> = {
  pending:    { label: "Pendiente",    className: "bg-muted text-muted-foreground border-0" },
  assigned:   { label: "Asignado",     className: "bg-brand-blue/10 text-brand-blue border-0" },
  loaded:     { label: "Cargado",      className: "bg-navy/10 text-navy border-0" },
  in_transit: { label: "En tránsito",  className: "bg-brand-orange/10 text-brand-orange border-0" },
  delivered:  { label: "Entregado",    className: "bg-success/10 text-success border-0" },
};

interface PackageStatusBadgeProps {
  status: PackageStatus;
  className?: string;
}

export function PackageStatusBadge({ status, className }: PackageStatusBadgeProps) {
  const { label, className: badgeClass } = CONFIG[status];
  return (
    <Badge className={cn(badgeClass, className)}>
      {label}
    </Badge>
  );
}
