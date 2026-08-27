"""
Generador de escenarios de ruteo y cubicacion sobre calles reales de Monterrey.

Uso tipico desde codigo:

    from algoritmos import escenario, exportar

    esc = escenario.generar(semilla=42)
    exportar.guardar_json(esc, Path("escenario.json"))

Desde consola, ver generar_escenario.py en la raiz del paquete.
"""
from __future__ import annotations

__version__ = "1.0.0"

from . import (  # noqa: F401
    config,
    entregas,
    escenario,
    exportar,
    giros,
    grafo,
    osm,
    rutas,
    semaforos,
    visualizar,
)

__all__ = [
    "config", "entregas", "escenario", "exportar", "giros",
    "grafo", "osm", "rutas", "semaforos", "visualizar",
]
