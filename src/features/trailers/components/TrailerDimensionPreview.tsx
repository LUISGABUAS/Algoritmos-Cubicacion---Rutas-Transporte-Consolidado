import { trailerTotalVolume } from "@/utils/calculations";
import { formatVolume } from "@/utils/formatters";

interface TrailerDimensionPreviewProps {
  length: number;
  width: number;
  height: number;
}

export function TrailerDimensionPreview({ length, width, height }: TrailerDimensionPreviewProps) {
  const isValid = length > 0 && width > 0 && height > 0;
  const volume = isValid
    ? trailerTotalVolume({ internalLength: length, internalWidth: width, internalHeight: height })
    : 0;

  // Escala la vista lateral para que quepa en ~260 × 110 px
  const maxW = 260;
  const maxH = 110;
  const scale = isValid
    ? Math.min(maxW / length, maxH / height, maxW / 100)
    : 1;

  const W = isValid ? Math.max(length * scale, 80) : maxW;
  const H = isValid ? Math.max(height * scale, 40) : maxH;
  const cabW = Math.min(W * 0.06, 14);

  const svgW = W + 80;
  const svgH = H + 56;
  const ox = 40;
  const oy = 12;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Vista lateral */}
      <div className="w-full">
        <p className="text-xs text-muted-foreground text-center mb-1.5">Vista lateral</p>
        <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} className="overflow-visible">
          {isValid ? (
            <>
              {/* Cuerpo principal */}
              <rect x={ox} y={oy} width={W} height={H} fill="#F1F5F9" stroke="#475569" strokeWidth="1.5" rx="2" />

              {/* Cabina */}
              <rect x={ox - cabW} y={oy + H * 0.2} width={cabW} height={H * 0.8}
                fill="#CBD5E1" stroke="#475569" strokeWidth="1" rx="2" />

              {/* Líneas de estructura interior */}
              {[0.15, 0.85].map((f) => (
                <line key={f} x1={ox + W * f} y1={oy} x2={ox + W * f} y2={oy + H}
                  stroke="#CBD5E1" strokeWidth="0.5" strokeDasharray="4 3" />
              ))}

              {/* Ruedas */}
              {[0.2, 0.25, 0.75, 0.8].map((f) => (
                <circle key={f} cx={ox + W * f} cy={oy + H + 6} r={5} fill="#64748B" />
              ))}

              {/* Etiqueta largo (inferior) */}
              <text x={ox + W / 2} y={oy + H + 22} textAnchor="middle" fontSize="11" fill="#64748B">
                {length} cm
              </text>

              {/* Etiqueta alto (derecha) */}
              <text x={ox + W + 10} y={oy + H / 2} dominantBaseline="middle" fontSize="11" fill="#64748B">
                {height} cm
              </text>

              {/* CAB / PUERTAS */}
              <text x={ox + 6} y={oy + H / 2} dominantBaseline="middle" fontSize="9" fill="#94A3B8">CAB.</text>
              <text x={ox + W - 6} y={oy + H / 2} textAnchor="end" dominantBaseline="middle" fontSize="9" fill="#94A3B8">PUERTAS</text>
            </>
          ) : (
            <rect x={ox} y={oy} width={maxW} height={maxH}
              fill="none" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="5 3" rx="4" />
          )}
        </svg>
      </div>

      {/* Dimensiones en chip */}
      <div className="grid grid-cols-3 gap-2 w-full text-center">
        {[
          { label: "Largo", value: length },
          { label: "Ancho", value: width },
          { label: "Alto",  value: height },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-md bg-muted/50 px-2 py-1.5">
            <p className="text-[10px] text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold text-foreground">{value > 0 ? `${value} cm` : "—"}</p>
          </div>
        ))}
      </div>

      {/* Volumen total */}
      <div className="w-full rounded-lg bg-navy/5 border border-navy/10 px-4 py-2.5 text-center">
        <p className="text-xs text-muted-foreground">Volumen total del tráiler</p>
        <p className="text-xl font-bold text-navy mt-0.5">
          {isValid ? formatVolume(volume) : "—"}
        </p>
      </div>
    </div>
  );
}
