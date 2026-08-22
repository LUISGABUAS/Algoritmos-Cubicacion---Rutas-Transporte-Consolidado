import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrailerStatusSummary } from "../hooks/useDashboardData";

const STATUS_CONFIG = [
  { key: "in_transit", label: "En ruta",      color: "#0B1F33" },
  { key: "loading",    label: "Cargando",     color: "#1D4ED8" },
  { key: "unloading",  label: "Descargando",  color: "#F97316" },
  { key: "available",  label: "En patio",     color: "#16A34A" },
  { key: "maintenance",label: "Mantenimiento",color: "#EAB308" },
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md text-sm">
      <p className="font-medium" style={{ color: payload[0].payload.color }}>{payload[0].name}</p>
      <p className="text-muted-foreground">{payload[0].value} tráiler{payload[0].value !== 1 ? "es" : ""}</p>
    </div>
  );
}

export function TrailerStatusChart() {
  const { data, isLoading } = useTrailerStatusSummary();

  const chartData = STATUS_CONFIG.map((s) => ({
    name: s.label,
    value: data?.[s.key] ?? 0,
    color: s.color,
  })).filter((d) => d.value > 0);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Estado de flota</CardTitle>
        <CardDescription>Distribución actual de tráileres</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-52 w-full" />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Centro del donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-foreground">{total}</span>
                <span className="text-xs text-muted-foreground">total</span>
              </div>
            </div>

            {/* Leyenda */}
            <div className="w-full space-y-1.5">
              {STATUS_CONFIG.map((s) => {
                const value = data?.[s.key] ?? 0;
                return (
                  <div key={s.key} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-muted-foreground">{s.label}</span>
                    </div>
                    <span className="font-medium text-foreground">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
