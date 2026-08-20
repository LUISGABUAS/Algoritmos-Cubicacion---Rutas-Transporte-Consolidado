import { Outlet } from "react-router-dom";

// Layout principal — se construirá en Fase 2
// Por ahora renderiza las páginas directamente para validar el routing
export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
}
