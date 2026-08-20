import { Zap, CheckCircle2, AlertTriangle, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OptimizationStatus } from "@/types";

interface OptimizeButtonProps {
  status: OptimizationStatus;
  onOptimize: () => void;
  onReset?: () => void;
}

const CONFIG: Record<OptimizationStatus, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  disabled: boolean;
}> = {
  idle: {
    label: "Optimizar acomodo",
    icon: Zap,
    className: "bg-navy hover:bg-navy/90 text-white",
    disabled: false,
  },
  optimizing: {
    label: "Optimizando...",
    icon: Zap,
    className: "bg-navy/70 text-white cursor-not-allowed",
    disabled: true,
  },
  optimized: {
    label: "Acomodo optimizado",
    icon: CheckCircle2,
    className: "bg-success hover:bg-success/90 text-white",
    disabled: false,
  },
  optimized_with_warnings: {
    label: "Optimizado con advertencias",
    icon: AlertTriangle,
    className: "bg-warning hover:bg-warning/90 text-white",
    disabled: false,
  },
  error: {
    label: "Error — Reintentar",
    icon: XCircle,
    className: "bg-destructive hover:bg-destructive/90 text-white",
    disabled: false,
  },
};

export function OptimizeButton({ status, onOptimize, onReset }: OptimizeButtonProps) {
  const cfg = CONFIG[status];
  const Icon = cfg.icon;
  const showReset = (status === "optimized" || status === "optimized_with_warnings") && onReset;

  return (
    <div className="flex items-center gap-2">
      <Button
        className={cn("gap-2 font-medium", cfg.className)}
        disabled={cfg.disabled}
        onClick={onOptimize}
      >
        {status === "optimizing" ? (
          <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
        {cfg.label}
      </Button>

      {showReset && (
        <Button variant="outline" size="icon" onClick={onReset} className="h-9 w-9">
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
