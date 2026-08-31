"""
Modelo de red vial.

Traduce el MultiDiGraph de osmnx a una estructura propia, con identificadores
consecutivos (0..N-1) en lugar de los ids gigantes de OSM, y con los rumbos de
entrada y salida de cada tramo ya calculados: eso es lo que despues permite
clasificar cada giro como recto, derecha, izquierda o retorno.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any

import networkx as nx


# --- Estructuras -------------------------------------------------------------

@dataclass
class Nodo:
    """Un cruce de calles."""
    id: int
    osm_id: int
    lat: float
    lon: float
    grado_entrada: int
    grado_salida: int
    calles: list[str] = field(default_factory=list)
    semaforo: bool = False
    semaforo_osm: bool = False      # el semaforo viene etiquetado en OSM
    vuelta_continua: bool = False   # permite vuelta a la derecha en rojo

    @property
    def es_cruce(self) -> bool:
        """Una interseccion real, no un simple quiebre de la calle."""
        return self.grado_salida >= 3 or self.grado_entrada >= 3


@dataclass
class Arista:
    """Un tramo de calle recorrible en un sentido."""
    id: int
    origen: int
    destino: int
    nombre: str | None
    tipo: str
    longitud_m: float
    sentido_unico: bool
    velocidad_kmh: float
    tiempo_s: float
    carriles: int | None
    rumbo_inicial: float            # grados 0-360 al salir del nodo origen
    rumbo_final: float              # grados 0-360 al llegar al nodo destino
    geometria: list[list[float]]    # [[lat, lon], ...] incluye ambos extremos


@dataclass
class RedVial:
    """Grafo dirigido de calles, con indices de acceso rapido."""
    nodos: dict[int, Nodo]
    aristas: dict[int, Arista]
    salientes: dict[int, list[int]]
    entrantes: dict[int, list[int]]

    def arista(self, aid: int) -> Arista:
        return self.aristas[aid]

    def nodo(self, nid: int) -> Nodo:
        return self.nodos[nid]

    @property
    def cruces(self) -> list[int]:
        """Nodos que son intersecciones reales (3 o mas ramales)."""
        return [n.id for n in self.nodos.values() if n.es_cruce]

    def resumen(self) -> dict[str, Any]:
        un_sentido = sum(1 for a in self.aristas.values() if a.sentido_unico)
        con_semaforo = sum(1 for n in self.nodos.values() if n.semaforo)
        doble = len(self.aristas) - un_sentido
        return {
            "cruces": len(self.nodos),
            "tramos": len(self.aristas),
            "tramos_un_sentido": un_sentido,
            "tramos_doble_sentido": doble,
            # Un tramo de doble sentido son dos aristas en el grafo. Este es el
            # numero de tramos de calle que veria alguien parado en la esquina.
            "calles_fisicas": un_sentido + doble // 2,
            "intersecciones": len(self.cruces),
            "semaforos": con_semaforo,
            "longitud_total_km": round(
                sum(a.longitud_m for a in self.aristas.values()) / 1000, 3
            ),
        }


# --- Geometria ---------------------------------------------------------------

def rumbo(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Rumbo geografico de un punto a otro, en grados 0-360 (0 = norte, 90 = este).

    Es el mismo calculo que osmnx.bearing.calculate_bearing, replicado aqui para
    poder aplicarlo a tramos internos de la geometria de una calle y no solo a
    la linea recta entre sus extremos.
    """
    f1, f2 = math.radians(lat1), math.radians(lat2)
    d_lon = math.radians(lon2 - lon1)
    y = math.sin(d_lon) * math.cos(f2)
    x = math.cos(f1) * math.sin(f2) - math.sin(f1) * math.cos(f2) * math.cos(d_lon)
    return (math.degrees(math.atan2(y, x)) + 360.0) % 360.0


def _rumbos_extremos(coords: list[list[float]]) -> tuple[float, float]:
    """
    Rumbo de salida y rumbo de llegada de una polilinea [[lat, lon], ...].

    En una calle curva el rumbo con el que se sale del cruce inicial no es el
    mismo con el que se llega al final. Usar la recta entre extremos clasifica
    mal los giros en avenidas con curva, por eso se miran los dos segmentos de
    los bordes y no la cuerda completa.
    """
    if len(coords) < 2:
        return 0.0, 0.0
    inicial = rumbo(coords[0][0], coords[0][1], coords[1][0], coords[1][1])
    final = rumbo(coords[-2][0], coords[-2][1], coords[-1][0], coords[-1][1])
    return inicial, final


def distancia_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distancia haversine en metros."""
    r = 6_371_008.8
    f1, f2 = math.radians(lat1), math.radians(lat2)
    d_f = f2 - f1
    d_l = math.radians(lon2 - lon1)
    a = math.sin(d_f / 2) ** 2 + math.cos(f1) * math.cos(f2) * math.sin(d_l / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


# --- Normalizacion de campos de OSM ------------------------------------------

def _escalar(valor: Any) -> Any:
    """OSM entrega listas cuando osmnx fusiona varios ways en un mismo tramo."""
    if isinstance(valor, (list, tuple)):
        return valor[0] if valor else None
    return valor


def _texto(valor: Any) -> str | None:
    valor = _escalar(valor)
    if valor is None:
        return None
    texto = str(valor).strip()
    return texto or None


def _entero(valor: Any) -> int | None:
    valor = _escalar(valor)
    try:
        return int(float(valor))
    except (TypeError, ValueError):
        return None


# --- Construccion ------------------------------------------------------------

def construir(G: nx.MultiDiGraph) -> RedVial:
    """Convierte el grafo de osmnx en una RedVial."""
    # Ids consecutivos, ordenados por id de OSM para que sean reproducibles.
    orden = sorted(G.nodes())
    idx = {osm_id: i for i, osm_id in enumerate(orden)}

    nodos: dict[int, Nodo] = {}
    for osm_id in orden:
        datos = G.nodes[osm_id]
        i = idx[osm_id]
        nodos[i] = Nodo(
            id=i,
            osm_id=int(osm_id),
            lat=round(float(datos["y"]), 7),
            lon=round(float(datos["x"]), 7),
            grado_entrada=G.in_degree(osm_id),
            grado_salida=G.out_degree(osm_id),
            # OSM etiqueta los semaforos como highway=traffic_signals sobre el
            # nodo. osmnx los conserva al simplificar gracias a useful_tags_node.
            semaforo_osm=_texto(datos.get("highway")) == "traffic_signals",
        )

    aristas: dict[int, Arista] = {}
    salientes: dict[int, list[int]] = {i: [] for i in nodos}
    entrantes: dict[int, list[int]] = {i: [] for i in nodos}

    # Ordenar las aristas hace el resultado independiente del orden de descarga.
    for aid, (u, v, datos) in enumerate(
        sorted(G.edges(data=True), key=lambda e: (e[0], e[1]))
    ):
        o, d = idx[u], idx[v]

        # Geometria real del tramo; si osmnx no la trae, el tramo es una recta.
        geom = datos.get("geometry")
        if geom is not None:
            coords = [[round(lat, 7), round(lon, 7)] for lon, lat in geom.coords]
        else:
            coords = [[nodos[o].lat, nodos[o].lon], [nodos[d].lat, nodos[d].lon]]

        r_ini, r_fin = _rumbos_extremos(coords)

        # Un tramo es de un sentido si no existe el recorrido inverso. Esto es
        # mas fiable que la etiqueta oneway de OSM porque refleja lo que el
        # camion puede hacer realmente sobre el grafo ya descargado.
        sentido_unico = not G.has_edge(v, u)

        longitud = float(datos.get("length") or 0.0)
        velocidad = float(datos.get("speed_kph") or 0.0)
        tiempo = float(datos.get("travel_time") or 0.0)
        if tiempo <= 0 and velocidad > 0:
            tiempo = longitud / (velocidad / 3.6)

        aristas[aid] = Arista(
            id=aid,
            origen=o,
            destino=d,
            nombre=_texto(datos.get("name")),
            tipo=_texto(datos.get("highway")) or "unclassified",
            longitud_m=round(longitud, 2),
            sentido_unico=sentido_unico,
            velocidad_kmh=round(velocidad, 1),
            tiempo_s=round(tiempo, 2),
            carriles=_entero(datos.get("lanes")),
            rumbo_inicial=round(r_ini, 1),
            rumbo_final=round(r_fin, 1),
            geometria=coords,
        )
        salientes[o].append(aid)
        entrantes[d].append(aid)

    # Calles que concurren en cada cruce: sirve para describir donde cae una
    # entrega sin tener que geocodificar de nuevo.
    for a in aristas.values():
        if a.nombre:
            for extremo in (a.origen, a.destino):
                if a.nombre not in nodos[extremo].calles:
                    nodos[extremo].calles.append(a.nombre)

    return RedVial(
        nodos=nodos,
        aristas=aristas,
        salientes=salientes,
        entrantes=entrantes,
    )
