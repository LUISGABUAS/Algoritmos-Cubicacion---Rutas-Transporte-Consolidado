import { PackageRect } from "./PackageRect";
import type { Package, Trailer } from "@/types";

// Vista lateral: eje X = profundidad (Z, puertas → cabina)
//                eje Y = altura (Y del modelo, piso → techo)
// Y está invertido: y_svg = internalHeight - (pkg.y + pkg.height)

interface TrailerSideViewProps {
  trailer: Trailer;
  packages: Package[];
  selectedPackageId: string | null;
  onSelect: (id: string) => void;
  activeLayer?: { yMin: number; yMax: number } | null;
  activeLayerIds?: Set<string> | null;
}

const PAD = 40;

export function TrailerSideView({ trailer, packages, selectedPackageId, onSelect, activeLayer, activeLayerIds }: TrailerSideViewProps) {
  const { internalLength: L, internalHeight: H } = trailer;
  const vbW = L + PAD * 2;
  const vbH = H + PAD * 2;

  const placed = packages.filter((p) => p.position);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${vbW} ${vbH}`}
      preserveAspectRatio="xMidYMid meet"
      className="max-h-full"
    >
      {/* Fondo del tráiler */}
      <rect x={PAD} y={PAD} width={L} height={H} fill="#F8FAFC" stroke="#475569" strokeWidth="3" rx="4" />

      {/* Cabina */}
      <rect x={PAD + L} y={PAD + H * 0.15} width={PAD * 0.4} height={H * 0.85}
        fill="#CBD5E1" stroke="#475569" strokeWidth="1.5" rx="3" />

      {/* Puertas */}
      <line x1={PAD} y1={PAD} x2={PAD} y2={PAD + H} stroke="#F97316" strokeWidth="4" />

      {/* Piso */}
      <line x1={PAD} y1={PAD + H} x2={PAD + L} y2={PAD + H} stroke="#475569" strokeWidth="3" />

      {/* Cuadrícula */}
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f}
          x1={PAD + L * f} y1={PAD} x2={PAD + L * f} y2={PAD + H}
          stroke="#E2E8F0" strokeWidth="1" />
      ))}
      {[0.33, 0.66].map((f) => (
        <line key={f}
          x1={PAD} y1={PAD + H * f} x2={PAD + L} y2={PAD + H * f}
          stroke="#E2E8F0" strokeWidth="1" />
      ))}

      {/* Banda de capa activa en la vista lateral */}
      {activeLayer && (
        <rect
          x={PAD}
          y={PAD + H - activeLayer.yMax}
          width={L}
          height={activeLayer.yMax - activeLayer.yMin}
          fill="#F9731614"
          stroke="#F97316"
          strokeWidth="1.5"
          strokeDasharray="6 3"
        />
      )}

      {/* Paquetes */}
      {placed.map((pkg) => {
        if (!pkg.position) return null;
        const rotation = pkg.position.rotationY === 90;
        const pkgL = rotation ? pkg.width : pkg.length;
        const svgY = PAD + H - pkg.position.y - pkg.height;
        const isInLayer = !activeLayerIds || activeLayerIds.has(pkg.id);

        return (
          <g key={pkg.id} opacity={isInLayer ? 1 : 0.12}>
            <PackageRect
              pkg={pkg}
              x={PAD + pkg.position.z}
              y={svgY}
              w={pkgL}
              h={pkg.height}
              isSelected={selectedPackageId === pkg.id}
              onClick={onSelect}
            />
          </g>
        );
      })}

      {/* Etiquetas */}
      <text x={PAD + L / 2} y={PAD + H + 26} textAnchor="middle" fontSize="12" fill="#94A3B8">
        {L} cm (largo)
      </text>
      <text x={PAD - 24} y={PAD + H / 2} textAnchor="middle" dominantBaseline="middle"
        fontSize="12" fill="#94A3B8" transform={`rotate(-90, ${PAD - 24}, ${PAD + H / 2})`}>
        {H} cm (alto)
      </text>
    </svg>
  );
}
