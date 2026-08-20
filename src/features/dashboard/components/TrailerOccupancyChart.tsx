import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrailerOccupancy } from "../hooks/useDashboardData";

function barColor(occupancy: number): string {
  if (occupancy >= 85) return "#16A34A";
  if (occupancy >= 70) return "#1D4ED8";
  if (occupancy > 0)   return "#EAB308";
  return "#94A3B8";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, occupancy } = payload[0].payload;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md text-sm">
      <p className="font-medium text-foreground">{name}</p>
      <p className="text-muted-foreground">Ocupación: <span className="font-semibold text-foreground">{occupancy}%</span></p>
    </div>
  );
}

export function TrailerOccupancyChart() {
  const { data, isLoading } = useTrailerOccupancy();

  const average =
    data && data.length > 0
      ? Math.round(data.filter((t) => t.occupancy > 0).reduce((s, t) => s + t.occupancy, 0) /
          data.filter((t) => t.occupancy > 0).length)
      : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Ocupación de tráileres</CardTitle>
            <CardDescription>Porcentaje de volumen utilizado por unidad</CardDescription>
          </div>
          {!isLoading && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Promedio</p>
              <p className="text-lg font-bold text-foreground">{average}%</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-52 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F8FAFC" }} />
              <ReferenceLine
                y={average}
                stroke="#F97316"
                strokeDasharray="4 4"
                label={{ value: `Prom. ${average}%`, position: "right", fontSize: 11, fill: "#F97316" }}
              />
              <Bar dataKey="occupancy" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {data?.map((entry) => (
                  <Cell key={entry.trailerId} fill={barColor(entry.occupancy)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Leyenda */}
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-success" />≥ 85% óptimo</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-brand-blue" />70–84% normal</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-warning" />&lt; 70% bajo</span>
        </div>
      </CardContent>
    </Card>
  );
}
