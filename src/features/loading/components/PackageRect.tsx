import { getStopColor, getStopColorFill } from "../utils/scaleUtils";
import type { Package } from "@/types";

interface PackageRectProps {
  pkg: Package;
  // Coordenadas y dimensiones ya en el sistema del SVG (cm del trailer)
  x: number;
  y: number;
  w: number;
  h: number;
  isSelected: boolean;
  onClick: (id: string) => void;
}

export function PackageRect({ pkg, x, y, w, h, isSelected, onClick }: PackageRectProps) {
  const borderColor = isSelected ? "#F97316" : getStopColor(pkg.stopOrder);
  const fillColor   = isSelected ? "#F9731620" : getStopColorFill(pkg.stopOrder);

  // Umbral mínimo para mostrar texto (en cm del viewBox)
  const showText = w > 40 && h > 20;
  const fontSize = Math.min(w / 6, h / 2.5, 14);

  return (
    <g
      onClick={() => onClick(pkg.id)}
      style={{ cursor: "pointer" }}
      role="button"
      aria-label={`Paquete ${pkg.id}`}
    >
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={isSelected ? 4 : 2}
        rx={3}
      />
      {showText && (
        <>
          <text
            x={x + w / 2}
            y={y + h / 2 - fontSize * 0.3}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={fontSize}
            fontWeight={isSelected ? "700" : "600"}
            fill={borderColor}
          >
            {pkg.id.replace("PKG-", "")}
          </text>
          {pkg.stopOrder && h > 30 && (
            <text
              x={x + w / 2}
              y={y + h / 2 + fontSize * 1.1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={fontSize * 0.75}
              fill={borderColor}
              opacity={0.8}
            >
              P{pkg.stopOrder}
            </text>
          )}
        </>
      )}
    </g>
  );
}
