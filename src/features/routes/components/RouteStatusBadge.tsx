import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RouteStatus } from "@/types";

const CONFIG: Record<RouteStatus, { label: string; className: string }> = {
  planned:   { label: "Planificada", className: "bg-muted text-muted-foreground border-0" },
  active:    { label: "Activa",      className: "bg-success/10 text-success border-0" },
  completed: { label: "Completada",  className: "bg-navy/10 text-navy border-0" },
  delayed:   { label: "Retrasada",   className: "bg-warning/10 text-warning border-0" },
};

interface RouteStatusBadgeProps {
  status: RouteStatus;
  className?: string;
}

export function RouteStatusBadge({ status, className }: RouteStatusBadgeProps) {
  const { label, className: badgeClass } = CONFIG[status];
  return <Badge className={cn(badgeClass, className)}>{label}</Badge>;
}
