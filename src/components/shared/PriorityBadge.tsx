import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Priority } from "@/types";

const CONFIG: Record<Priority, { label: string; className: string }> = {
  high:   { label: "Alta",   className: "bg-danger/10 text-danger border-0" },
  medium: { label: "Media",  className: "bg-warning/10 text-warning border-0" },
  low:    { label: "Baja",   className: "bg-muted text-muted-foreground border-0" },
};

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const { label, className: badgeClass } = CONFIG[priority];
  return (
    <Badge className={cn(badgeClass, className)}>
      {label}
    </Badge>
  );
}
