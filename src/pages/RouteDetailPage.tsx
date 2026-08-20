import { useParams } from "react-router-dom";
export default function RouteDetailPage() {
  const { id } = useParams();
  return <div className="p-8"><h1 className="text-2xl font-semibold">Detalle de Ruta — {id}</h1><p className="text-muted-foreground mt-1">Fase 11 — por construir</p></div>;
}
