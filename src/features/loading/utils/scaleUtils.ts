// Colores por parada — stop 1 naranja (más cerca de puertas, primero en descargar)
export const STOP_COLORS = [
  "#F97316", // 1
  "#1D4ED8", // 2
  "#16A34A", // 3
  "#7C3AED", // 4
  "#EF4444", // 5
  "#06B6D4", // 6
  "#F59E0B", // 7
];

export function getStopColor(stopOrder?: number | null): string {
  if (!stopOrder) return "#94A3B8";
  return STOP_COLORS[(stopOrder - 1) % STOP_COLORS.length];
}

export function getStopColorFill(stopOrder?: number | null): string {
  return getStopColor(stopOrder) + "28"; // ~16% opacidad
}
