import { useParams } from "react-router-dom";
export default function LoadingPage() {
  const { trailerId } = useParams();
  return <div className="p-8"><h1 className="text-2xl font-semibold">Acomodación — {trailerId}</h1><p className="text-muted-foreground mt-1">Fase 8 — por construir</p></div>;
}
