import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  loading?: boolean;
}

export function KPICard({
  title,
  value,
  delta,
  deltaLabel = "vs periodo anterior",
  icon: Icon,
  iconColor = "bg-navy",
  loading = false,
}: KPICardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-5">
          <Skeleton className="h-4 w-24 mb-4" />
          <Skeleton className="h-8 w-32 mb-3" />
          <Skeleton className="h-3 w-28" />
        </CardContent>
      </Card>
    );
  }

  const isPositive = delta !== undefined && delta >= 0;
  const isNeutral = delta === undefined || delta === 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", iconColor)}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>

        <p className="text-2xl font-bold text-foreground tracking-tight mb-2">
          {value}
        </p>

        {delta !== undefined && (
          <div className="flex items-center gap-1">
            {!isNeutral && (
              isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-success shrink-0" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-danger shrink-0" />
              )
            )}
            <span
              className={cn(
                "text-xs font-medium",
                isNeutral ? "text-muted-foreground" :
                isPositive ? "text-success" : "text-danger"
              )}
            >
              {isPositive && "+"}
              {delta}%
            </span>
            <span className="text-xs text-muted-foreground">{deltaLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
