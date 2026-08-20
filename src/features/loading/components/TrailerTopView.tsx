import { PackageRect } from "./PackageRect";
import type { Package, Trailer } from "@/types";

// Vista superior: eje X = profundidad del tráiler (Z del modelo, puertas → cabina)
//                 eje Y = ancho lateral (X del modelo)
// El origen (0,0) del viewBox = esquina superior-izquierda = puerta izquierda

interface TrailerTopViewProps {
  trailer: Trailer;
  packages: Package[];
  selectedPackageId: string | null;
  onSelect: (id: string) => void;
}

const PAD = 40; // padding en cm para etiquetas

export function TrailerTopView({ trailer, packages, selectedPackageId, onSelect }: TrailerTopViewProps) {
  const { internalLength: L, internalWidth: W } = trailer;
  const vbW = L + PAD * 2;
  const vbH = W + PAD * 2;

  const placed = packages.filter((p) => p.position);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${vbW} ${vbH}`}
      preserveAspectRatio="xMidYMid meet"
      className="max-h-full"
    >
      {/* Fondo del tráiler */}
      <rect x={PAD} y={PAD} width={L} height={W} fill="#F8FAFC" stroke="#475569" strokeWidth="3" rx="4" />

      {/* Cabina (derecha, Z = L) */}
      <rect x={PAD + L} y={PAD + W * 0.1} width={PAD * 0.4} height={W * 0.8}
        fill="#CBD5E1" stroke="#475569" strokeWidth="1.5" rx="3" />
      <text x={PAD + L + PAD * 0.2} y={PAD + W / 2} textAnchor="middle" dominantBaseline="middle"
        fontSize="12" fill="#64748B" transform={`rotate(90, ${PAD + L + PAD * 0.2}, ${PAD + W / 2})`}>
        CABINA
      </text>

      {/* Puertas (izquierda, Z = 0) */}
      <line x1={PAD} y1={PAD} x2={PAD} y2={PAD + W} stroke="#F97316" strokeWidth="4" />
      <text x={PAD - 8} y={PAD + W / 2} textAnchor="middle" dominantBaseline="middle"
        fontSize="11" fill="#F97316" transform={`rotate(-90, ${PAD - 8}, ${PAD + W / 2})`}>
        PUERTAS
      </text>

      {/* Líneas de cuadrícula internas */}
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f}
          x1={PAD + L * f} y1={PAD} x2={PAD + L * f} y2={PAD + W}
          stroke="#E2E8F0" strokeWidth="1" />
      ))}

      {/* Paquetes */}
      {placed.map((pkg) => {
        if (!pkg.position) return null;
        const rotation = pkg.position.rotationY === 90;
        const pkgL = rotation ? pkg.width : pkg.length;
        const pkgW = rotation ? pkg.length : pkg.width;

        return (
          <PackageRect
            key={pkg.id}
            pkg={pkg}
            x={PAD + pkg.position.z}
            y={PAD + pkg.position.x}
            w={pkgL}
            h={pkgW}
            isSelected={selectedPackageId === pkg.id}
            onClick={onSelect}
          />
        );
      })}

      {/* Etiquetas de eje */}
      <text x={PAD + L / 2} y={PAD + W + 26} textAnchor="middle" fontSize="12" fill="#94A3B8">
        {L} cm (largo)
      </text>
      <text x={PAD - 24} y={PAD + W / 2} textAnchor="middle" dominantBaseline="middle"
        fontSize="12" fill="#94A3B8" transform={`rotate(-90, ${PAD - 24}, ${PAD + W / 2})`}>
        {W} cm (ancho)
      </text>
    </svg>
  );
}
