"""
Descarga del recorte de calles reales desde OpenStreetMap.

Elige una zona al azar del área metropolitana de Monterrey, la descarga vía
Overpass con osmnx y la deja lista para el modelo de red vial: velocidades,
tiempos de recorrido y un solo componente fuertemente conexo.
"""
from __future__ import annotations

import math
import random
from collections.abc import Callable
from pathlib import Path

import networkx as nx
import osmnx as ox

from . import config

# Metros por grado de latitud (aproximación local suficiente para el jitter).
_M_POR_GRADO_LAT = 111_320.0


def configurar_osmnx(carpeta_cache: Path) -> None:
    """Activa el caché en disco para no re-golpear Overpass en cada corrida."""
    carpeta_cache.mkdir(parents=True, exist_ok=True)
    ox.settings.use_cache = True
    ox.settings.cache_folder = str(carpeta_cache)
    ox.settings.requests_timeout = 180
    ox.settings.log_console = False
    # `highway` en nodos es lo que trae los semáforos reales; `junction` marca
    # glorietas. Sin estas etiquetas el grafo simplificado los perdería.
    ox.settings.useful_tags_node = ["highway", "junction", "ref", "crossing"]
    ox.settings.useful_tags_way = [
        "highway", "name", "oneway", "junction", "lanes", "maxspeed",
        "access", "service", "bridge", "tunnel", "width", "turn",
    ]


def elegir_zona(rng: random.Random, nombre: str | None = None) -> dict:
    """
    Devuelve la zona a descargar. Sin `nombre` toma una al azar del catálogo y
    la desplaza aleatoriamente, de modo que el recorte nunca sea idéntico.
    """
    if nombre:
        coincidencias = [
            z for z in config.ZONAS_MONTERREY
            if nombre.lower() in z["nombre"].lower()
        ]
        if not coincidencias:
            disponibles = ", ".join(z["nombre"] for z in config.ZONAS_MONTERREY)
            raise ValueError(f"Zona '{nombre}' no encontrada. Disponibles: {disponibles}")
        base = coincidencias[0]
        jitter_m = 0.0
    else:
        base = rng.choice(config.ZONAS_MONTERREY)
        jitter_m = config.JITTER_M

    # Desplazamiento uniforme dentro de un disco de radio `jitter_m`.
    angulo = rng.uniform(0, 2 * math.pi)
    distancia = jitter_m * math.sqrt(rng.random())
    d_lat = (distancia * math.cos(angulo)) / _M_POR_GRADO_LAT
    d_lon = (distancia * math.sin(angulo)) / (
        _M_POR_GRADO_LAT * math.cos(math.radians(base["lat"]))
    )

    return {
        "nombre": base["nombre"],
        "lat": round(base["lat"] + d_lat, 7),
        "lon": round(base["lon"] + d_lon, 7),
        "lat_catalogo": base["lat"],
        "lon_catalogo": base["lon"],
        "desplazamiento_m": round(distancia, 1),
    }


def descargar_grafo(lat: float, lon: float, radio_m: int) -> nx.MultiDiGraph:
    """
    Descarga la red vial manejable alrededor de un punto.

    `network_type="drive"` ya excluye peatonales y ciclovías, y respeta los
    sentidos únicos: una calle de un sentido sale como una sola arista dirigida.
    """
    # truncate_by_edge=False recorta limpio en el radio pedido. Con True, osmnx
    # conserva enteras las aristas que cruzan el borde y arrastra tramos de
    # kilometros hacia afuera de la zona, que despues deforman el mapa.
    return ox.graph_from_point(
        (lat, lon),
        dist=radio_m,
        network_type="drive",
        simplify=True,
        truncate_by_edge=False,
    )


def preparar_grafo(G: nx.MultiDiGraph) -> nx.MultiDiGraph:
    """
    Deja el grafo listo para calcular rutas:

    1. Asigna velocidad a cada tramo (de `maxspeed` o por tipo de vía).
    2. Deriva el tiempo de recorrido libre en segundos.
    3. Se queda con el mayor componente FUERTEMENTE conexo.

    El paso 3 es el importante: con calles de un sentido, que dos cruces estén
    unidos por una línea no significa que se pueda ir y volver. Si no se
    recorta, el generador puede colocar una entrega en un callejón del que el
    camión no puede salir y la ruta se vuelve imposible.
    """
    G = ox.routing.add_edge_speeds(
        G,
        hwy_speeds=config.VELOCIDADES_KMH,
        fallback=config.VELOCIDAD_FALLBACK_KMH,
    )
    G = ox.routing.add_edge_travel_times(G)
    G = ox.truncate.largest_component(G, strongly=True)
    return G


def obtener_zona_valida(
    rng: random.Random,
    nombre: str | None = None,
    radio_m: int | None = None,
    minimo_cruces: int = 60,
    intentos: int = 6,
    progreso: Callable[[str], None] | None = None,
) -> tuple[nx.MultiDiGraph, dict]:
    """
    Descarga hasta obtener un recorte utilizable.

    Un recorte sirve si, ya reducido al componente fuertemente conexo, conserva
    al menos `minimo_cruces` nodos. Zonas industriales o al pie de la sierra
    devuelven redes diminutas: en ese caso se reintenta con otra zona o, si el
    usuario fijó una, con un radio mayor.
    """
    ultimo_error: str | None = None

    for intento in range(1, intentos + 1):
        zona = elegir_zona(rng, nombre)
        radio = radio_m or rng.randint(config.RADIO_M_MIN, config.RADIO_M_MAX)
        # Al reintentar sobre una zona fija, ampliar el radio es lo único que
        # puede cambiar el resultado.
        if nombre and intento > 1:
            radio = int(radio * (1 + 0.35 * (intento - 1)))

        if progreso:
            # Overpass limita la tasa de peticiones y osmnx espera su turno en
            # silencio. Sin este aviso, una descarga encolada es indistinguible
            # de un cuelgue.
            progreso(
                f"descargando {zona['nombre']} (radio {radio} m)... "
                f"si tarda, Overpass esta limitando la tasa de peticiones"
            )

        try:
            G = descargar_grafo(zona["lat"], zona["lon"], radio)
        except Exception as exc:  # red caída, Overpass saturado, zona vacía
            ultimo_error = f"{type(exc).__name__}: {exc}"
            continue

        if G.number_of_nodes() == 0:
            ultimo_error = "el recorte no contiene calles"
            continue

        G = preparar_grafo(G)
        if G.number_of_nodes() >= minimo_cruces:
            zona["radio_m"] = radio
            zona["intentos"] = intento
            return G, zona

        ultimo_error = (
            f"solo {G.number_of_nodes()} cruces navegables "
            f"(mínimo {minimo_cruces})"
        )

    raise RuntimeError(
        f"No se obtuvo una zona utilizable tras {intentos} intentos. "
        f"Último motivo: {ultimo_error}"
    )
