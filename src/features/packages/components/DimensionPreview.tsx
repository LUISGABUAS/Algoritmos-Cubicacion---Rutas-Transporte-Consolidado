import { computeVolume } from "@/utils/calculations";
import { formatVolume } from "@/utils/formatters";

interface DimensionPreviewProps {
  length: number;
  width: number;
  height: number;
}

export function DimensionPreview({ length, width, height }: DimensionPreviewProps) {
  const isValid = length > 0 && width > 0 && height > 0;
  const volume = isValid ? computeVolume({ length, width, height }) : 0;

  // Normalizar dimensiones a un cubo de 100px máximo
  const max = Math.max(length, width, height, 1);
  const S = 100 / max;
  const W = Math.max(width  * S, 16);
  const H = Math.max(height * S, 16);
  const L = Math.max(length * S, 16);

  // Proyección oblicua (45°, factor 0.55)
  const DX = L * 0.55;
  const DY = L * 0.32;

  const PAD = 28;
  const svgW = W + DX + PAD * 2;
  const svgH = H + DY + PAD * 2;

  // Esquina inferior-izquierda de la cara frontal
  const ox = PAD;
  const oy = PAD + DY;

  // 8 vértices del paralelepípedo
  const fbl = [ox,          oy + H       ]; // front-bottom-left
  const fbr = [ox + W,      oy + H       ]; // front-bottom-right
  const ftl = [ox,          oy           ]; // front-top-left
  const ftr = [ox + W,      oy           ]; // front-top-right
  const btl = [ox + DX,     oy - DY      ]; // back-top-left
  const btr = [ox + W + DX, oy - DY      ]; // back-top-right
  const bbr = [ox + W + DX, oy + H - DY  ]; // back-bottom-right

  const p = (pt: number[]) => `${pt[0].toFixed(1)},${pt[1].toFixed(1)}`;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="max-w-full overflow-visible"
      >
        {isValid ? (
          <>
            {/* Cara derecha */}
            <polygon
              points={`${p(fbr)} ${p(bbr)} ${p(btr)} ${p(ftr)}`}
              fill="#CBD5E1"
              stroke="#94A3B8"
              strokeWidth="1"
            />
            {/* Cara superior */}
            <polygon
              points={`${p(ftl)} ${p(ftr)} ${p(btr)} ${p(btl)}`}
              fill="#E2E8F0"
              stroke="#94A3B8"
              strokeWidth="1"
            />
            {/* Cara frontal */}
            <polygon
              points={`${p(fbl)} ${p(fbr)} ${p(ftr)} ${p(ftl)}`}
              fill="#F1F5F9"
              stroke="#475569"
              strokeWidth="1.5"
            />

            {/* Etiqueta Ancho (parte inferior) */}
            <text
              x={((fbl[0] + fbr[0]) / 2).toFixed(1)}
              y={(fbl[1] + 16).toFixed(1)}
              textAnchor="middle"
              fontSize="11"
              fill="#64748B"
            >
              {width} cm
            </text>

            {/* Etiqueta Alto (lado izquierdo) */}
            <text
              x={(ftl[0] - 6).toFixed(1)}
              y={((ftl[1] + fbl[1]) / 2).toFixed(1)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="11"
              fill="#64748B"
            >
              {height}
            </text>

            {/* Etiqueta Largo (cara superior diagonal) */}
            <text
              x={((ftl[0] + btl[0]) / 2 - 4).toFixed(1)}
              y={((ftl[1] + btl[1]) / 2 - 5).toFixed(1)}
              textAnchor="middle"
              fontSize="11"
              fill="#64748B"
            >
              {length}
            </text>
          </>
        ) : (
          /* Placeholder cuando no hay dimensiones */
          <rect
            x={PAD}
            y={PAD}
            width={svgW - PAD * 2}
            height={svgH - PAD * 2}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            rx="4"
          />
        )}
      </svg>

      {/* Volumen calculado */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">Volumen calculado</p>
        <p className="text-base font-semibold text-foreground">
          {isValid ? formatVolume(volume) : "—"}
        </p>
      </div>
    </div>
  );
}
