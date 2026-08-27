"""
Orquestacion: de una semilla a un escenario completo.

Un escenario es todo lo que el modelo de ruteo necesita para trabajar sobre una
zona real de Monterrey: la red vial con sus sentidos, los semaforos, la tabla de
costos de cada maniobra, el deposito, las entregas con su paqueteria y la matriz
de tiempos entre puntos.
"""
from __future__ import annotations

import random
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from . import config, entregas as mod_entregas, giros as mod_giros
from . import osm, semaforos as mod_semaforos
from . import rutas
from .entregas import Entrega
from .giros import Giro
from .grafo import RedVial, construir


@dataclass
class Escenario:
    """Un mapa jugable, reproducible a partir de su semilla."""
    semilla: int
    zona: dict
    red: RedVial
    giros: list[Giro]
    deposito: int
    entregas: list[Entrega]
    matriz: dict
    info_semaforos: dict
    generado_en: str
    advertencias: list[str] = field(default_factory=list)

    @property
    def tabla_giros(self) -> dict[tuple[int, int], Giro]:
        return mod_giros.tabla(self.giros)

    @property
    def puntos_interes(self) -> list[int]:
        """Deposito primero, luego las entregas: el orden de la matriz."""
        return [self.deposito, *[e.nodo for e in self.entregas]]

    def resumen(self) -> dict[str, Any]:
        return {
            "zona": self.zona["nombre"],
            "red": self.red.resumen(),
            "giros": mod_giros.resumen(self.giros),
            "semaforos": self.info_semaforos,
            "carga": mod_entregas.resumen(self.entregas),
            "cota_inferior_ruta_s": self.cota_inferior_s(),
            "advertencias": self.advertencias,
        }

    def cota_inferior_s(self) -> float:
        """
        Referencia rapida para saber si una ruta propuesta es razonable.

        Es la suma, por cada punto, del salto mas barato hacia otro punto, mas
        el tiempo de servicio. No es una ruta valida ni pretende serlo: es una
        cota inferior del tiempo total de cualquier recorrido que visite todo.
        """
        tiempos = self.matriz["tiempo_s"]
        total = 0.0
        for i, fila in enumerate(tiempos):
            candidatos = [t for j, t in enumerate(fila) if j != i and t is not None]
            if candidatos:
                total += min(candidatos)
        total += sum(e.tiempo_servicio_s for e in self.entregas)
        return round(total, 1)


def generar(
    semilla: int | None = None,
    zona: str | None = None,
    radio_m: int | None = None,
    n_entregas: int | None = None,
    modo_semaforos: str = "auto",
    densidad_semaforos: float | None = None,
    permitir_retorno: bool | None = None,
    carpeta_cache: Path | None = None,
    con_matriz: bool = True,
    progreso: Callable[[str], None] | None = None,
) -> Escenario:
    """
    Genera un escenario completo.

    La misma semilla con los mismos parametros produce exactamente el mismo
    escenario, siempre que OpenStreetMap no haya cambiado el mapa de la zona
    entre corridas.
    """
    if semilla is None:
        semilla = random.randrange(2**31)
    rng = random.Random(semilla)

    cache = carpeta_cache or Path(__file__).resolve().parent.parent / "data" / "cache_osm"
    osm.configurar_osmnx(cache)

    # 1. Zona real de Monterrey, recortada al componente fuertemente conexo.
    G, info_zona = osm.obtener_zona_valida(
        rng, nombre=zona, radio_m=radio_m, progreso=progreso
    )
    red = construir(G)

    # 2. Semaforos y permiso de vuelta continua.
    info_semaforos = mod_semaforos.asignar(
        red, rng, modo=modo_semaforos, densidad=densidad_semaforos
    )

    # 3. Costos de maniobra. Depende del paso 2: la penalizacion de un giro
    #    cambia segun haya semaforo y segun permita vuelta continua.
    giros = mod_giros.generar(red, permitir_retorno=permitir_retorno)
    tabla = mod_giros.tabla(giros)

    # 4. Deposito y entregas.
    deposito, entregas = mod_entregas.generar(red, rng, cantidad=n_entregas)

    advertencias: list[str] = []
    if n_entregas is not None and len(entregas) < n_entregas:
        advertencias.append(
            f"Se pidieron {n_entregas} entregas y la zona solo admitio "
            f"{len(entregas)} con la separacion minima requerida."
        )

    # 5. Matriz de tiempos deposito-entregas, que es tambien la verificacion de
    #    que el escenario es resoluble.
    puntos = [deposito, *[e.nodo for e in entregas]]
    if con_matriz:
        matriz = rutas.matriz_tiempos(red, tabla, puntos)
        if matriz["inalcanzables"]:
            advertencias.append(
                f"{len(matriz['inalcanzables'])} pares de puntos sin camino. "
                "Revise el recorte de la zona."
            )
    else:
        matriz = {
            "puntos": puntos,
            "tiempo_s": [],
            "distancia_m": [],
            "simetrica": False,
            "inalcanzables": [],
        }

    return Escenario(
        semilla=semilla,
        zona=info_zona,
        red=red,
        giros=giros,
        deposito=deposito,
        entregas=entregas,
        matriz=matriz,
        info_semaforos=info_semaforos,
        generado_en=datetime.now(timezone.utc).isoformat(timespec="seconds"),
        advertencias=advertencias,
    )
