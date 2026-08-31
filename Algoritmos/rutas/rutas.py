"""
Camino minimo con penalizacion de giros.

Este modulo NO es el algoritmo de ruteo del proyecto: es la herramienta minima
para (a) verificar que el escenario generado es resoluble y (b) precalcular la
matriz de tiempos entre el deposito y las entregas, que es lo que despues
consume el modelo de ruteo.

El punto tecnico importante: como el costo de un semaforo depende de la
maniobra, el estado de la busqueda no es "en que nodo estoy" sino "por que
tramo vengo circulando". Dos llegadas al mismo cruce por tramos distintos
enfrentan costos de salida distintos, asi que un Dijkstra sobre nodos daria
tiempos equivocados. Aqui el grafo esta expandido en aristas: cada tramo es un
estado y la transicion entre estados cuesta giro + recorrido del tramo nuevo.
"""
from __future__ import annotations

import heapq
from dataclasses import dataclass

from .giros import Giro
from .grafo import RedVial

INFINITO = float("inf")


@dataclass
class Camino:
    """Resultado de una busqueda entre dos cruces."""
    origen: int
    destino: int
    tiempo_s: float
    distancia_m: float
    aristas: list[int]
    semaforos_cruzados: int
    vueltas_continuas: int

    @property
    def alcanzable(self) -> bool:
        return self.tiempo_s < INFINITO


def _sucesores(red: RedVial, aid: int) -> list[int]:
    """Tramos a los que se puede pasar al terminar de recorrer `aid`."""
    return red.salientes[red.aristas[aid].destino]


def dijkstra_desde(
    red: RedVial,
    tabla_giros: dict[tuple[int, int], Giro],
    origen: int,
) -> tuple[dict[int, float], dict[int, int | None]]:
    """
    Dijkstra sobre el grafo expandido en aristas, partiendo de un cruce.

    Devuelve (costo por tramo, tramo anterior por tramo). El costo de un tramo
    es el tiempo acumulado desde `origen` hasta terminar de recorrerlo, es
    decir, hasta plantarse en su nodo destino.
    """
    costo: dict[int, float] = {}
    previo: dict[int, int | None] = {}

    monticulo: list[tuple[float, int]] = []
    # Salir del deposito no cuesta giro: el camion ya esta apuntado hacia el
    # tramo por el que arranca.
    for aid in red.salientes[origen]:
        t = red.aristas[aid].tiempo_s
        costo[aid] = t
        previo[aid] = None
        heapq.heappush(monticulo, (t, aid))

    visitados: set[int] = set()

    while monticulo:
        t_actual, aid = heapq.heappop(monticulo)
        if aid in visitados:
            continue
        visitados.add(aid)

        for sig in _sucesores(red, aid):
            giro = tabla_giros.get((aid, sig))
            if giro is None:
                continue  # maniobra prohibida (por ejemplo, retorno vetado)

            t_nuevo = t_actual + giro.penalizacion_s + red.aristas[sig].tiempo_s
            if t_nuevo < costo.get(sig, INFINITO):
                costo[sig] = t_nuevo
                previo[sig] = aid
                heapq.heappush(monticulo, (t_nuevo, sig))

    return costo, previo


def _reconstruir(previo: dict[int, int | None], final: int) -> list[int]:
    camino = [final]
    while (anterior := previo.get(camino[-1])) is not None:
        camino.append(anterior)
    camino.reverse()
    return camino


def _describir(
    red: RedVial,
    tabla_giros: dict[tuple[int, int], Giro],
    origen: int,
    destino: int,
    aristas: list[int],
    tiempo: float,
) -> Camino:
    distancia = sum(red.aristas[a].longitud_m for a in aristas)
    semaforos = 0
    continuas = 0
    for anterior, siguiente in zip(aristas, aristas[1:]):
        giro = tabla_giros.get((anterior, siguiente))
        if giro and giro.espera_semaforo_s > 0:
            semaforos += 1
            if giro.vuelta_continua:
                continuas += 1
    return Camino(
        origen=origen,
        destino=destino,
        tiempo_s=round(tiempo, 2),
        distancia_m=round(distancia, 1),
        aristas=aristas,
        semaforos_cruzados=semaforos,
        vueltas_continuas=continuas,
    )


def caminos_desde(
    red: RedVial,
    tabla_giros: dict[tuple[int, int], Giro],
    origen: int,
    destinos: list[int],
) -> dict[int, Camino]:
    """
    Camino minimo de un cruce a varios, con una sola pasada de Dijkstra.

    Llegar a un cruce es terminar de recorrer cualquiera de sus tramos
    entrantes, asi que el mejor tiempo al destino es el minimo entre ellos.
    """
    costo, previo = dijkstra_desde(red, tabla_giros, origen)

    resultado: dict[int, Camino] = {}
    for destino in destinos:
        if destino == origen:
            resultado[destino] = Camino(origen, destino, 0.0, 0.0, [], 0, 0)
            continue

        mejor_aid, mejor_t = None, INFINITO
        for aid in red.entrantes[destino]:
            t = costo.get(aid, INFINITO)
            if t < mejor_t:
                mejor_aid, mejor_t = aid, t

        if mejor_aid is None:
            resultado[destino] = Camino(origen, destino, INFINITO, INFINITO, [], 0, 0)
            continue

        aristas = _reconstruir(previo, mejor_aid)
        resultado[destino] = _describir(
            red, tabla_giros, origen, destino, aristas, mejor_t
        )

    return resultado


def matriz_tiempos(
    red: RedVial,
    tabla_giros: dict[tuple[int, int], Giro],
    puntos: list[int],
) -> dict:
    """
    Matriz origen-destino entre los puntos de interes (deposito y entregas).

    No es simetrica: con calles de un sentido, ir de A a B casi nunca cuesta lo
    mismo que volver. El modelo de ruteo debe tratarla como dirigida.
    """
    tiempos: list[list[float]] = []
    distancias: list[list[float]] = []
    inalcanzables: list[tuple[int, int]] = []

    for origen in puntos:
        caminos = caminos_desde(red, tabla_giros, origen, puntos)
        fila_t, fila_d = [], []
        for destino in puntos:
            camino = caminos[destino]
            if not camino.alcanzable:
                inalcanzables.append((origen, destino))
                fila_t.append(None)
                fila_d.append(None)
            else:
                fila_t.append(camino.tiempo_s)
                fila_d.append(camino.distancia_m)
        tiempos.append(fila_t)
        distancias.append(fila_d)

    return {
        "puntos": puntos,
        "tiempo_s": tiempos,
        "distancia_m": distancias,
        "simetrica": False,
        "inalcanzables": inalcanzables,
    }


def costo_secuencia(
    red: RedVial,
    tabla_giros: dict[tuple[int, int], Giro],
    aristas: list[int],
) -> float:
    """
    Tiempo de recorrer una secuencia concreta de tramos.

    Sirve para puntuar una ruta propuesta por el modelo con exactamente el
    mismo modelo de costo que usa el generador.
    """
    if not aristas:
        return 0.0
    total = red.aristas[aristas[0]].tiempo_s
    for anterior, siguiente in zip(aristas, aristas[1:]):
        giro = tabla_giros.get((anterior, siguiente))
        if giro is None:
            return INFINITO  # la secuencia usa una maniobra ilegal
        total += giro.penalizacion_s + red.aristas[siguiente].tiempo_s
    return round(total, 2)
