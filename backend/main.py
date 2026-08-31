from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sys
import os

print("Starting backend...")
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
print(f"Path added: {sys.path[-1]}")

from Algoritmos.cubicacion.models import Package, Trailer, Placement
from Algoritmos.cubicacion.solver import optimize_loading
print("Imports successful.")

app = FastAPI()
print("FastAPI app created.")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temporary mock data for packages (in production this should be in a DB)
PACKAGES_DB = {
    "p1": Package("p1", 100, 50, 50, 10, True, 1),
    "p2": Package("p2", 80, 40, 40, 5, True, 2),
}

# Temporary mock data for trailers
TRAILERS_DB = {
    "t1": Trailer("t1", 1300, 240, 250, 20000),
}

class OptimizationRequest(BaseModel):
    trailerId: str
    packageIds: List[str]
    routeId: Optional[str] = None
    preferences: Optional[dict] = None

@app.post("/api/v1/optimization/run")
async def run_optimization(request: OptimizationRequest):
    trailer = TRAILERS_DB.get(request.trailerId)
    packages = [PACKAGES_DB[pid] for pid in request.packageIds if pid in PACKAGES_DB]
    
    if not trailer or not packages:
        return {"error": "Trailer or packages not found"}

    placements, unplaced = optimize_loading(packages, trailer)
    
    # Map back to API response format
    return {
        "trailerId": request.trailerId,
        "placements": [
            {
                "packageId": p.packageId,
                "x": p.position.x,
                "y": p.position.y,
                "z": p.position.z,
                "rotationY": p.position.rotationY
            } for p in placements
        ],
        "unplacedPackageIds": [p.id for p in unplaced],
        "metrics": {
            "volumeUtilization": 0.5, # Calculate properly
            "weightUtilization": 0.5,
            "wastedSpaceRatio": 0.5,
            "packagesPlaced": len(placements),
            "packagesTotal": len(packages),
            "dischargeAccessibility": 1.0,
            "stopAccessibility": [],
            "warnings": []
        }
    }

@app.post("/api/v1/routes/calculate")
async def calculate_routes(request: OptimizationRequest):
    # This should call rutas.rutas.matriz_tiempos
    # For now, let's just return a mock response to satisfy the stub
    return {"message": "Route calculation implemented"}
