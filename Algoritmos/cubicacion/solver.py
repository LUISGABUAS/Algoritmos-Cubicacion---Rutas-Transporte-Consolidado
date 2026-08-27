import random
import numpy as np
from deap import base, creator, tools, algorithms
from .models import Package, Trailer, Position, Placement
from typing import List, Tuple, Dict, Any

# ─── Packer Deterministico (Deepest Bottom Left Fill) ───────────────────────

def get_dimensions(pkg: Package, orientation: int) -> Tuple[float, float, float]:
    """Retorna dimensiones (L, W, H) basadas en la orientación (0-5)."""
    # 0: L, W, H | 1: L, H, W | 2: W, L, H | 3: W, H, L | 4: H, L, W | 5: H, W, L
    dims = [pkg.length, pkg.width, pkg.height]
    if orientation == 0: return (dims[0], dims[1], dims[2])
    if orientation == 1: return (dims[0], dims[2], dims[1])
    if orientation == 2: return (dims[1], dims[0], dims[2])
    if orientation == 3: return (dims[1], dims[2], dims[0])
    if orientation == 4: return (dims[2], dims[0], dims[1])
    if orientation == 5: return (dims[2], dims[1], dims[0])
    return (dims[0], dims[1], dims[2])

def pack_sequence(packages: List[Package], trailer: Trailer, sequence: List[int], orientations: List[int]) -> List[Tuple[Placement, Package]]:
    placed = [] # Lista de dicts {x, y, z, l, w, h, pkg}
    
    for i, pkg_idx in enumerate(sequence):
        pkg = packages[pkg_idx]
        orientation = orientations[i]
        l, w, h = get_dimensions(pkg, orientation)
        
        placed_ok = False
        # Busqueda de espacio en el suelo (z=0)
        for x in range(0, int(trailer.internalLength - l + 1), 10):
            for y in range(0, int(trailer.internalWidth - w + 1), 10):
                z = 0 # simplificado para este prototipo
                # Verificar solapamiento
                overlap = False
                for p in placed:
                    if not (x + l <= p['x'] or x >= p['x'] + p['l'] or
                            y + w <= p['y'] or y >= p['y'] + p['w'] or
                            z + h <= p['z'] or z >= p['z'] + p['h']):
                        overlap = True
                        break
                if not overlap:
                    placed.append({'x': x, 'y': y, 'z': z, 'l': l, 'w': w, 'h': h, 'pkg': pkg})
                    placed_ok = True
                    break
            if placed_ok: break
    
    return [(Placement(p['pkg'].id, Position(p['x'], p['y'], p['z'], 0)), p['pkg']) for p in placed]

# ─── Función de Fitness ───────────────────────────────────────────────────

def evaluate(individual, packages, trailer):
    # individual: [orden_indices, orientaciones]
    sequence = individual[:len(packages)]
    orientations = individual[len(packages):]
    
    # Debug
    # print(f"DEBUG: seq={sequence}, len(pkg)={len(packages)}")
    
    placements_with_pkg = pack_sequence(packages, trailer, sequence, orientations)
    
    # 1. Utilización de volumen
    volumen_ocupado = sum([p[1].length * p[1].width * p[1].height for p in placements_with_pkg])
    volumen_trailer = trailer.internalLength * trailer.internalWidth * trailer.internalHeight
    utilization = volumen_ocupado / volumen_trailer
    
    return (utilization,)


# ─── Solver Evolutivo ──────────────────────────────────────────────────────

def optimize_loading(packages: List[Package], trailer: Trailer) -> List[Placement]:
    # Crear clases si no existen
    if not hasattr(creator, "FitnessMax"):
        creator.create("FitnessMax", base.Fitness, weights=(1.0,))
        creator.create("Individual", list, fitness=creator.FitnessMax)
    
    toolbox = base.Toolbox()
    
    def create_individual():
        seq = list(range(len(packages)))
        random.shuffle(seq)
        ori = [random.randint(0, 5) for _ in range(len(packages))]
        return creator.Individual(seq + ori)
    
    def mutate_individual(ind):
        # Mutate sequence
        sequence_len = len(ind) // 2
        # Swap two elements in sequence
        idx1, idx2 = random.sample(range(sequence_len), 2)
        ind[idx1], ind[idx2] = ind[idx2], ind[idx1]
        
        # Mutate orientation
        ori_idx = random.randint(sequence_len, len(ind) - 1)
        ind[ori_idx] = random.randint(0, 5)
        return ind,
    
    toolbox.register("individual", create_individual)
    toolbox.register("population", tools.initRepeat, list, toolbox.individual)
    
    toolbox.register("mate", lambda ind1, ind2: (ind1, ind2))
    toolbox.register("mutate", mutate_individual)
    toolbox.register("select", tools.selTournament, tournsize=3)
    toolbox.register("evaluate", evaluate, packages=packages, trailer=trailer)
    
    pop = toolbox.population(n=20) # Reducido para rapidez
    algorithms.eaSimple(pop, toolbox, cxpb=0.5, mutpb=0.2, ngen=20, verbose=False)
    
    best_ind = tools.selBest(pop, 1)[0]
    
    # Retornar mejor solución
    sequence = best_ind[:len(packages)]
    orientations = best_ind[len(packages):]
    
    placements_with_pkg = pack_sequence(packages, trailer, sequence, orientations)
    
    return [p[0] for p in placements_with_pkg]
