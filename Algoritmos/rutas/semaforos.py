"""
Colocacion de semaforos sobre la red.

OpenStreetMap etiqueta muchos semaforos reales, pero la cobertura es despareja:
el centro de Monterrey esta bien mapeado y una colonia residencial puede no
tener ninguno. Como el escenario debe ejercitar el modelo de tiempos, el modo
por defecto conserva todos los semaforos reales y solo rellena hasta alcanzar
una densidad minima, priorizando los cruces mas importantes.
"""
from __future__ import annotations

import random

from . import config
from .grafo import RedVial

MODOS = ("osm", "auto", "densidad")


def _importancia(red: RedVial, nid: int) -> tuple[int, float]:
    """
    Que tan probable es que un cruce este semaforizado en la vida real.

    Pesa el numero de ramales y la jerarquia de las calles que concurren: un
    cruce de dos avenidas primarias lleva semaforo mucho antes que el encuentro
    de dos calles residenciales.
    """
    jerarquia = {
        "motorway": 6, "trunk": 6, "primary": 5, "secondary": 4,
        "tertiary": 3, "residential": 1, "living_street": 0,
        "unclassified": 1, "service": 0,
    }
    ramales = red.nodos[nid].grado_entrada + red.nodos[nid].grado_salida
    tipos = [
        red.aristas[aid].tipo
        for aid in red.entrantes[nid] + red.salientes[nid]
    ]
    peso = max((jerarquia.get(t, 1) for t in tipos), default=1)
    return ramales, peso


def asignar(
    red: RedVial,
    rng: random.Random,
    modo: str = "auto",
    densidad: float | None = None,
) -> dict:
    """
    Marca los nodos semaforizados y decide cuales permiten vuelta continua.

    Modifica la red en sitio y devuelve un resumen de lo que hizo.

    modo "osm"      -> exclusivamente los semaforos etiquetados en OSM.
    modo "auto"     -> los de OSM mas relleno hasta la densidad objetivo.
    modo "densidad" -> ignora OSM y semaforiza segun importancia del cruce.
    """
    if modo not in MODOS:
        raise ValueError(f"Modo de semaforos invalido: {modo}. Use uno de {MODOS}")

    objetivo_frac = (
        densidad if densidad is not None else config.DENSIDAD_SEMAFOROS_OBJETIVO
    )

    # Solo un cruce real puede llevar semaforo: un quiebre de calle, no.
    candidatos = [
        nid for nid in red.nodos
        if (red.nodos[nid].grado_entrada + red.nodos[nid].grado_salida) / 2
        >= config.GRADO_MINIMO_SEMAFORO
    ]

    for nodo in red.nodos.values():
        nodo.semaforo = False
        nodo.vuelta_continua = False

    reales = [nid for nid in red.nodos if red.nodos[nid].semaforo_osm]
    sinteticos: list[int] = []

    if modo == "osm":
        elegidos = set(reales)

    elif modo == "auto":
        elegidos = set(reales)
        objetivo = int(round(len(candidatos) * objetivo_frac))
        faltantes = objetivo - len(elegidos)
        if faltantes > 0:
            # Ordenar por importancia y desempatar con el generador, para que
            # dos semillas distintas no siempre elijan los mismos cruces.
            restantes = [n for n in candidatos if n not in elegidos]
            restantes.sort(key=lambda n: (_importancia(red, n), rng.random()), reverse=True)
            sinteticos = restantes[:faltantes]
            elegidos.update(sinteticos)

    else:  # densidad
        objetivo = max(1, int(round(len(candidatos) * objetivo_frac)))
        ordenados = sorted(
            candidatos,
            key=lambda n: (_importancia(red, n), rng.random()),
            reverse=True,
        )
        sinteticos = ordenados[:objetivo]
        elegidos = set(sinteticos)

    for nid in elegidos:
        nodo = red.nodos[nid]
        nodo.semaforo = True
        # La vuelta continua a la derecha es la norma en Mexico salvo senal que
        # la prohiba; se modela como una probabilidad por cruce.
        nodo.vuelta_continua = rng.random() < config.PROB_VUELTA_CONTINUA

    con_vuelta = sum(
        1 for nid in elegidos if red.nodos[nid].vuelta_continua
    )
    return {
        "modo": modo,
        "total": len(elegidos),
        "de_osm": len([n for n in elegidos if red.nodos[n].semaforo_osm]),
        "sinteticos": len([n for n in elegidos if not red.nodos[n].semaforo_osm]),
        "con_vuelta_continua": con_vuelta,
        "cruces_candidatos": len(candidatos),
        "densidad_resultante": round(len(elegidos) / len(candidatos), 4) if candidatos else 0.0,
    }
