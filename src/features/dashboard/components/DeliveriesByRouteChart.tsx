import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeliveriesByRoute } from "../hooks/useDashboardData";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md text-sm space-y-1">
      <p className="font-medium text-foreground">{label}</p>
      {payload.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (entry: any) => (
          <p key={entry.dataKey} style={{ color: entry.fill }} className="text-xs">
            {entry.name}: <span className="font-semibold">{entry.value}</span>
          </p>
        )
      )}
    </div>
  );
}

export function DeliveriesByRouteChart() {
  const { data, isLoading } = useDeliveriesByRoute();

  const chartData = data?.map((r) => ({
    name: r.routeId,
    label: r.label,
    Completadas: r.completed,
    Pendientes: r.deliveries - r.completed,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Entregas por ruta</CardTitle>
        <CardDescription>Completadas vs pendientes en rutas activas</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-52 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F8FAFC" }} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(value) => <span className="text-muted-foreground">{value}</span>}
              />
              <Bar dataKey="Completadas" stackId="a" fill="#16A34A" radius={[0, 0, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Pendientes" stackId="a" fill="#E2E8F0" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
