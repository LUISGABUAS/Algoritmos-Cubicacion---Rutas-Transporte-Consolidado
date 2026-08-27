"""
Serializacion del escenario.

Formato principal: JSON. Se eligio sobre CSV o Parquet porque el escenario es
un grafo con listas anidadas de longitud variable (geometrias, paquetes por
entrega, tabla de giros) y porque tiene que poder abrirse y revisarse a mano
durante el desarrollo. Es autocontenido: quien lo recibe no necesita volver a
consultar OpenStreetMap ni recalcular nada para poder rutear.

Formato secundario: GeoJSON, para tirarlo directo en cualquier visor de mapas
(geojson.io, Leaflet, Mapbox) sin escribir codigo.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from . import config
from .entregas import Entrega, Paquete
from .escenario import Escenario

VERSION_FORMATO = "1.0"


# --- JSON principal ----------------------------------------------------------

def _paquete_a_dict(p: Paquete) -> dict[str, Any]:
    return {
        "id": p.id,
        "tipo": p.tipo,
        "largo_cm": p.largo,
        "ancho_cm": p.ancho,
        "alto_cm": p.alto,
        "peso_kg": p.peso_kg,
        "volumen_m3": p.volumen_m3,
        "fragil": p.fragil,
        "apilable": p.apilable,
        "requiere_seguro": p.requiere_seguro,
        "prioridad": p.prioridad,
        "valor_declarado": p.valor_declarado,
        "orientaciones_permitidas": p.orientaciones_permitidas,
    }


def _entrega_a_dict(e: Entrega) -> dict[str, Any]:
    return {
        "id": e.id,
        "nodo": e.nodo,
        "lat": e.lat,
        "lon": e.lon,
        "direccion": e.direccion,
        "tiempo_servicio_s": e.tiempo_servicio_s,
        "peso_total_kg": e.peso_total_kg,
        "volumen_total_m3": e.volumen_total_m3,
        "paquetes": [_paquete_a_dict(p) for p in e.paquetes],
    }


def a_dict(esc: Escenario, incluir_giros: bool = True) -> dict[str, Any]:
    """Convierte el escenario al diccionario que se guarda como JSON."""
    red = esc.red

    documento: dict[str, Any] = {
        "meta": {
            "version_formato": VERSION_FORMATO,
            "generado_en": esc.generado_en,
            "semilla": esc.semilla,
            "fuente": "OpenStreetMap via osmnx",
            "ciudad": "Monterrey, Nuevo Leon, Mexico",
            "descripcion": (
                "Escenario de ruteo y cubicacion. El costo de una ruta es "
                "suma(tiempo_s de los tramos) + suma(penalizacion_s de los giros)."
            ),
        },
        "zona": esc.zona,
        "parametros_tiempo": {
            "espera_semaforo_s": config.ESPERA_SEMAFORO_S,
            "vuelta_continua_s": config.VUELTA_CONTINUA_S,
            "penalizacion_giro_s": dict(config.PENALIZACION_GIRO_S),
            "umbral_recto_grados": config.UMBRAL_RECTO_GRADOS,
            "umbral_retorno_grados": config.UMBRAL_RETORNO_GRADOS,
            "velocidades_kmh": dict(config.VELOCIDADES_KMH),
            "velocidad_fallback_kmh": config.VELOCIDAD_FALLBACK_KMH,
            "servicio_base_s": config.SERVICIO_BASE_S,
            "servicio_por_paquete_s": config.SERVICIO_POR_PAQUETE_S,
        },
        "grafo": {
            "dirigido": True,
            "nota": (
                "Cada arista es transitable solo de origen a destino. Una calle "
                "de doble sentido aparece como dos aristas opuestas."
            ),
            "nodos": [
                {
                    "id": n.id,
                    "osm_id": n.osm_id,
                    "lat": n.lat,
                    "lon": n.lon,
                    "grado_entrada": n.grado_entrada,
                    "grado_salida": n.grado_salida,
                    "es_cruce": n.es_cruce,
                    "semaforo": n.semaforo,
                    "semaforo_origen": (
                        "osm" if n.semaforo and n.semaforo_osm
                        else "sintetico" if n.semaforo
                        else None
                    ),
                    "vuelta_continua": n.vuelta_continua,
                    "calles": n.calles,
                }
                for n in red.nodos.values()
            ],
            "aristas": [
                {
                    "id": a.id,
                    "origen": a.origen,
                    "destino": a.destino,
                    "nombre": a.nombre,
                    "tipo": a.tipo,
                    "longitud_m": a.longitud_m,
                    "sentido_unico": a.sentido_unico,
                    "velocidad_kmh": a.velocidad_kmh,
                    "tiempo_s": a.tiempo_s,
                    "carriles": a.carriles,
                    "rumbo_inicial": a.rumbo_inicial,
                    "rumbo_final": a.rumbo_final,
                    "geometria": a.geometria,
                }
                for a in red.aristas.values()
            ],
        },
        "deposito": {
            "nodo": esc.deposito,
            "lat": red.nodos[esc.deposito].lat,
            "lon": red.nodos[esc.deposito].lon,
            "direccion": (
                " y ".join(red.nodos[esc.deposito].calles[:2])
                or f"Cruce sin nombre (nodo {esc.deposito})"
            ),
        },
        "entregas": [_entrega_a_dict(e) for e in esc.entregas],
        "matriz_tiempos": esc.matriz,
        "resumen": esc.resumen(),
    }

    if incluir_giros:
        documento["giros"] = {
            "nota": (
                "Costo de cada maniobra. La clave es el par (arista_entrada, "
                "arista_salida); un par ausente es una maniobra prohibida."
            ),
            "lista": [
                {
                    "nodo": g.nodo,
                    "arista_entrada": g.arista_entrada,
                    "arista_salida": g.arista_salida,
                    "tipo": g.tipo,
                    "angulo": g.angulo,
                    "penalizacion_s": g.penalizacion_s,
                    "espera_semaforo_s": g.espera_semaforo_s,
                    "vuelta_continua": g.vuelta_continua,
                    "es_vuelta_en_u": g.es_vuelta_en_u,
                }
                for g in esc.giros
            ],
        }

    return documento


def guardar_json(esc: Escenario, ruta: Path, incluir_giros: bool = True,
                 compacto: bool = False) -> Path:
    """Escribe el escenario como JSON UTF-8."""
    ruta.parent.mkdir(parents=True, exist_ok=True)
    documento = a_dict(esc, incluir_giros=incluir_giros)
    with ruta.open("w", encoding="utf-8") as f:
        json.dump(
            documento, f,
            ensure_ascii=False,
            indent=None if compacto else 2,
            separators=(",", ":") if compacto else None,
        )
    return ruta


# --- GeoJSON para inspeccion visual ------------------------------------------

def a_geojson(esc: Escenario) -> dict[str, Any]:
    """
    Vista geografica del escenario, lista para cualquier visor de mapas.

    Es una proyeccion con perdida: no lleva la tabla de giros ni la matriz. Su
    unico proposito es poder mirar el mapa sin escribir codigo.
    """
    red = esc.red
    rasgos: list[dict[str, Any]] = []

    for a in red.aristas.values():
        # Un tramo de doble sentido existe dos veces en el grafo; para dibujar
        # basta una, de lo contrario las lineas se encimarian.
        if not a.sentido_unico and a.origen > a.destino:
            continue
        rasgos.append({
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [[lon, lat] for lat, lon in a.geometria],
            },
            "properties": {
                "clase": "tramo",
                "id": a.id,
                "nombre": a.nombre,
                "tipo": a.tipo,
                "sentido_unico": a.sentido_unico,
                "longitud_m": a.longitud_m,
                "tiempo_s": a.tiempo_s,
                "velocidad_kmh": a.velocidad_kmh,
            },
        })

    for n in red.nodos.values():
        if not n.semaforo:
            continue
        rasgos.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [n.lon, n.lat]},
            "properties": {
                "clase": "semaforo",
                "nodo": n.id,
                "vuelta_continua": n.vuelta_continua,
                "origen": "osm" if n.semaforo_osm else "sintetico",
            },
        })

    deposito = red.nodos[esc.deposito]
    rasgos.append({
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [deposito.lon, deposito.lat]},
        "properties": {"clase": "deposito", "nodo": deposito.id},
    })

    for e in esc.entregas:
        rasgos.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [e.lon, e.lat]},
            "properties": {
                "clase": "entrega",
                "id": e.id,
                "nodo": e.nodo,
                "direccion": e.direccion,
                "paquetes": len(e.paquetes),
                "peso_total_kg": e.peso_total_kg,
            },
        })

    return {"type": "FeatureCollection", "features": rasgos}


def guardar_geojson(esc: Escenario, ruta: Path) -> Path:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    with ruta.open("w", encoding="utf-8") as f:
        json.dump(a_geojson(esc), f, ensure_ascii=False, indent=2)
    return ruta


# --- Lectura -----------------------------------------------------------------

def cargar_json(ruta: Path) -> dict[str, Any]:
    """Lee un escenario guardado. Util para el modelo que consume el archivo."""
    with Path(ruta).open(encoding="utf-8") as f:
        return json.load(f)
