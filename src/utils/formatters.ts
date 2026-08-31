import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

/** Formatea un número como peso en kg */
export function formatWeight(kg: number): string {
  if (kg === null || kg === undefined || Number.isNaN(Number(kg))) return "—";
  return `${Number(kg).toLocaleString("es-MX")} kg`;
}

/** Formatea un volumen en m³ con 2 decimales */
export function formatVolume(m3: number): string {
  return `${m3.toFixed(2)} m³`;
}

/** Formatea dimensiones como "largo × ancho × alto cm" */
export function formatDimensions(length: number, width: number, height: number): string {
  return `${length} × ${width} × ${height} cm`;
}

/** Formatea un porcentaje con 1 decimal */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** Formatea una distancia en km */
export function formatDistance(km: number): string {
  return `${km.toLocaleString("es-MX")} km`;
}

/** Formatea duración en minutos a "Xh Ym" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Formatea una fecha ISO a "DD MMM YYYY" */
export function formatDate(isoDate: string): string {
  return format(new Date(isoDate), "dd MMM yyyy", { locale: es });
}

/** Formatea una fecha ISO a "DD MMM YYYY HH:mm" */
export function formatDateTime(isoDate: string): string {
  return format(new Date(isoDate), "dd MMM yyyy HH:mm", { locale: es });
}

/** Formatea una fecha ISO como "hace X tiempo" */
export function formatRelativeTime(isoDate: string): string {
  return formatDistanceToNow(new Date(isoDate), { addSuffix: true, locale: es });
}

/** Capitaliza la primera letra de un string */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
