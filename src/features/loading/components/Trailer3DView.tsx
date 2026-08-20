import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Edges } from "@react-three/drei";
import * as THREE from "three";
import { getStopColor } from "../utils/scaleUtils";
import type { Package, Trailer } from "@/types";

const CM = 0.01; // cm → Three.js units (metres)

// ─── Package box ──────────────────────────────────────────────────────────────

interface PkgBoxProps {
  pkg: Package;
  halfW: number;
  halfH: number;
  halfL: number;
  selected: boolean;
  active: boolean;
  onSelect: (id: string) => void;
}

function PkgBox({ pkg, halfW, halfH, halfL, selected, active, onSelect }: PkgBoxProps) {
  if (!pkg.position) return null;

  const rot90 = pkg.position.rotationY === 90;
  // rotationY=90 swaps length↔width in the XZ plane
  const dimX = (rot90 ? pkg.length : pkg.width) * CM;
  const dimY = pkg.height * CM;
  const dimZ = (rot90 ? pkg.width : pkg.length) * CM;

  // position.{x,y,z} is the bottom-left-back corner; convert to THREE center
  const cx = pkg.position.x * CM + dimX / 2 - halfW;
  const cy = pkg.position.y * CM + dimY / 2 - halfH;
  const cz = pkg.position.z * CM + dimZ / 2 - halfL;

  const color = getStopColor(pkg.stopOrder);
  const opacity = active ? (selected ? 0.92 : 0.7) : 0.1;

  return (
    <group position={[cx, cy, cz]}>
      <mesh onClick={(e) => { e.stopPropagation(); onSelect(pkg.id); }}>
        <boxGeometry args={[dimX, dimY, dimZ]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} />
        {active && <Edges color={color} />}
      </mesh>

      {/* Selection outline: slightly larger back-face mesh */}
      {selected && (
        <mesh scale={1.05}>
          <boxGeometry args={[dimX, dimY, dimZ]} />
          <meshBasicMaterial
            color="#FF6600"
            transparent
            opacity={0.4}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

// ─── Trailer shell ────────────────────────────────────────────────────────────

function TrailerShell({ W, H, L }: { W: number; H: number; L: number }) {
  return (
    <>
      {/* Semi-transparent walls */}
      <mesh>
        <boxGeometry args={[W, H, L]} />
        <meshBasicMaterial
          color="#CBD5E1"
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
        <Edges color="#64748B" />
      </mesh>

      {/* Orange door face (z = −L/2) */}
      <mesh position={[0, 0, -L / 2]}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial color="#F97316" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

// ─── Full scene (inside Canvas) ───────────────────────────────────────────────

interface SceneProps {
  trailer: Trailer;
  packages: Package[];
  selectedPackageId: string | null;
  activeLayerIds: Set<string> | null;
  onSelect: (id: string) => void;
}

function Scene({ trailer, packages, selectedPackageId, activeLayerIds, onSelect }: SceneProps) {
  const W = trailer.internalWidth * CM;
  const H = trailer.internalHeight * CM;
  const L = trailer.internalLength * CM;

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[W * 2, H * 3, L * 2]} intensity={0.75} />
      <directionalLight position={[-W * 2, H, -L]} intensity={0.3} />

      <TrailerShell W={W} H={H} L={L} />

      {packages.map((pkg) =>
        pkg.position ? (
          <PkgBox
            key={pkg.id}
            pkg={pkg}
            halfW={W / 2}
            halfH={H / 2}
            halfL={L / 2}
            selected={selectedPackageId === pkg.id}
            active={!activeLayerIds || activeLayerIds.has(pkg.id)}
            onSelect={onSelect}
          />
        ) : null
      )}

      <OrbitControls target={[0, 0, 0]} minDistance={W * 0.5} maxDistance={L * 3} />
    </>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

interface Trailer3DViewProps {
  trailer: Trailer;
  packages: Package[];
  selectedPackageId: string | null;
  onSelect: (id: string) => void;
  activeLayerIds: Set<string> | null;
}

export function Trailer3DView({
  trailer,
  packages,
  selectedPackageId,
  onSelect,
  activeLayerIds,
}: Trailer3DViewProps) {
  const W = trailer.internalWidth * CM;
  const H = trailer.internalHeight * CM;
  const L = trailer.internalLength * CM;

  // Camera: above and in front of the doors (doors = negative Z in Three.js space)
  const camX = W * 1.4;
  const camY = H * 1.6;
  const camZ = -(L / 2 + L * 0.85);

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [camX, camY, camZ], fov: 50, near: 0.01 }}
        style={{ background: "#F8FAFC" }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <Scene
            trailer={trailer}
            packages={packages}
            selectedPackageId={selectedPackageId}
            activeLayerIds={activeLayerIds}
            onSelect={onSelect}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
