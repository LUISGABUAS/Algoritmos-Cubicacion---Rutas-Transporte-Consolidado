import { useState } from "react";
import { orchestrator } from "@/orchestrator/orchestrator";
import type { OptimizationRequest, OptimizationResult, Package } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageTable } from "@/features/packages/components/PackageTable";
import { RouteMap } from "@/components/shared/RouteMap";

// Mock data for the playground
const MOCK_PACKAGES: Package[] = [
  { id: "pkg-1", recipientName: "Cliente A", senderName: "Almacén", destination: "Zona Norte", length: 100, width: 100, height: 100, weight: 50, status: "pending", priority: "medium", fragile: false, routeId: "R1", stopOrder: 1 },
  { id: "pkg-2", recipientName: "Cliente B", senderName: "Almacén", destination: "Zona Sur", length: 50, width: 50, height: 50, weight: 10, status: "pending", priority: "high", fragile: true, routeId: "R1", stopOrder: 2 },
  { id: "pkg-3", recipientName: "Cliente C", senderName: "Almacén", destination: "Centro", length: 80, width: 80, height: 80, weight: 30, status: "pending", priority: "low", fragile: false, routeId: "R2", stopOrder: 1 },
];

export default function AlgoritmosPlaygroundPage() {
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    if (selectedPackageIds.length === 0) return;
    
    setLoading(true);
    const request: OptimizationRequest = {
      trailerId: "trailer-001",
      packageIds: selectedPackageIds,
      preferences: {
        prioritizeDischargeOrder: true,
        allowRotation: true,
        maximizeUtilization: true,
      },
    };
    
    try {
      const res = await orchestrator.run(request);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Playground de Algoritmos</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Seleccionar Paquetes</CardTitle>
          </CardHeader>
          <CardContent>
            <PackageTable 
              packages={MOCK_PACKAGES} 
              selectedIds={selectedPackageIds} 
              onSelectionChange={setSelectedPackageIds}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Visualización de Ruta</CardTitle>
          </CardHeader>
          <CardContent>
             <RouteMap routes={[]} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>3. Ejecución</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleRun} disabled={loading || selectedPackageIds.length === 0}>
            {loading ? "Ejecutando..." : "Ejecutar Optimización Conjunta"}
          </Button>

          {result && (
            <div className="space-y-2">
              <h3 className="font-semibold">Log de Razonamiento:</h3>
              <ul className="list-disc pl-5 text-sm bg-slate-50 p-3 rounded">
                {result.reasoningLog?.map((log, i) => <li key={i}>{log}</li>)}
              </ul>
              <h3 className="font-semibold pt-2">Detalle de Acomodo:</h3>
              <pre className="bg-slate-100 p-4 rounded overflow-auto text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
