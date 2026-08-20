import { useLocation } from "react-router-dom";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface RouteInfo {
  title: string;
  breadcrumbs: Breadcrumb[];
}

const routeMap: RouteInfo[] = [
  // Orden importa: las rutas más específicas van primero
  { title: "Nuevo Paquete",       breadcrumbs: [{ label: "Paquetes", href: "/packages" }, { label: "Nuevo paquete" }] },
  { title: "Editar Paquete",      breadcrumbs: [{ label: "Paquetes", href: "/packages" }, { label: "Editar" }] },
  { title: "Nuevo Tráiler",       breadcrumbs: [{ label: "Tráileres", href: "/trailers" }, { label: "Nuevo tráiler" }] },
  { title: "Editar Tráiler",      breadcrumbs: [{ label: "Tráileres", href: "/trailers" }, { label: "Editar" }] },
  { title: "Acomodación",         breadcrumbs: [{ label: "Acomodación", href: "/loading" }, { label: "Tráiler" }] },
  { title: "Detalle de Ruta",     breadcrumbs: [{ label: "Rutas", href: "/routes" }, { label: "Detalle" }] },
  { title: "Dashboard",           breadcrumbs: [] },
  { title: "Paquetes",            breadcrumbs: [{ label: "Paquetes" }] },
  { title: "Tráileres",           breadcrumbs: [{ label: "Tráileres" }] },
  { title: "Acomodación",         breadcrumbs: [{ label: "Acomodación" }] },
  { title: "Rutas",               breadcrumbs: [{ label: "Rutas" }] },
  { title: "Operaciones",         breadcrumbs: [{ label: "Operaciones" }] },
  { title: "Conductores",         breadcrumbs: [{ label: "Conductores" }] },
  { title: "Clientes",            breadcrumbs: [{ label: "Clientes" }] },
  { title: "Reportes",            breadcrumbs: [{ label: "Reportes" }] },
  { title: "Configuración",       breadcrumbs: [{ label: "Configuración" }] },
];

const pathToIndex: Record<string, number> = {
  "/packages/new":      0,
  "/packages/:id/edit": 1,
  "/trailers/new":      2,
  "/trailers/:id/edit": 3,
  "/loading/:id":       4,
  "/routes/:id":        5,
  "/dashboard":         6,
  "/packages":          7,
  "/trailers":          8,
  "/loading":           9,
  "/routes":           10,
  "/operations":       11,
  "/drivers":          12,
  "/clients":          13,
  "/reports":          14,
  "/settings":         15,
};

function matchRoute(pathname: string): RouteInfo {
  const segments = pathname.split("/").filter(Boolean);

  // Orden de matching: de más específico a más general
  if (segments[0] === "packages" && segments[1] === "new")    return routeMap[pathToIndex["/packages/new"]];
  if (segments[0] === "packages" && segments[2] === "edit")   return routeMap[pathToIndex["/packages/:id/edit"]];
  if (segments[0] === "trailers" && segments[1] === "new")    return routeMap[pathToIndex["/trailers/new"]];
  if (segments[0] === "trailers" && segments[2] === "edit")   return routeMap[pathToIndex["/trailers/:id/edit"]];
  if (segments[0] === "loading" && segments[1])               return routeMap[pathToIndex["/loading/:id"]];
  if (segments[0] === "routes" && segments[1])                return routeMap[pathToIndex["/routes/:id"]];

  const key = `/${segments[0] ?? "dashboard"}`;
  const idx = pathToIndex[key];
  return idx !== undefined ? routeMap[idx] : { title: "Dashboard", breadcrumbs: [] };
}

export function useCurrentRoute(): RouteInfo {
  const { pathname } = useLocation();
  return matchRoute(pathname);
}
