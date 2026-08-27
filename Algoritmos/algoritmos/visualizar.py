"""
Render del escenario a PNG.

No es una herramienta de analisis: es para mirar de un vistazo si el mapa
generado tiene sentido antes de gastarlo en un entrenamiento. De un golpe se
ve si hay sentidos unicos, donde cayeron los semaforos y si las entregas
quedaron repartidas o apelmazadas en una esquina.
"""
from __future__ import annotations

import math
from pathlib import Path

import matplotlib
matplotlib.use("Agg")  # sin ventana: esto corre en consola y en CI
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from matplotlib.patches import Circle

from . import config
from .escenario import Escenario

_M_POR_GRADO = 111_320.0


def _proyectar(lat: float, lon: float, lat0: float, lon0: float) -> tuple[float, float]:
    """
    Proyeccion plana local en metros respecto al centro de la zona.

    A escala de barrio el error de tratar la Tierra como plana es despreciable
    y evita arrastrar una dependencia de proyecciones solo para dibujar.
    """
    x = (lon - lon0) * _M_POR_GRADO * math.cos(math.radians(lat0))
    y = (lat - lat0) * _M_POR_GRADO
    return x, y


def dibujar(esc: Escenario, ruta_png: Path, ancho_pulgadas: float = 13.0) -> Path:
    """Genera el PNG del escenario y devuelve la ruta escrita."""
    red = esc.red
    c = config.COLORES

    lat0 = sum(n.lat for n in red.nodos.values()) / len(red.nodos)
    lon0 = sum(n.lon for n in red.nodos.values()) / len(red.nodos)

    def pr(lat: float, lon: float) -> tuple[float, float]:
        return _proyectar(lat, lon, lat0, lon0)

    # Relacion de aspecto real de la zona, para que el mapa no salga estirado.
    xs, ys = zip(*(pr(n.lat, n.lon) for n in red.nodos.values()))
    ancho_m = max(max(xs) - min(xs), 1.0)
    alto_m = max(max(ys) - min(ys), 1.0)
    alto_pulgadas = ancho_pulgadas * (alto_m / ancho_m)
    alto_pulgadas = min(max(alto_pulgadas, 6.0), 22.0)

    fig, ax = plt.subplots(figsize=(ancho_pulgadas, alto_pulgadas))
    fig.patch.set_facecolor(c["fondo"])
    ax.set_facecolor(c["fondo"])
    plt.rcParams["font.family"] = "monospace"

    # --- Tramos ---------------------------------------------------------------
    dibujadas: set[frozenset] = set()
    for a in red.aristas.values():
        puntos = [pr(lat, lon) for lat, lon in a.geometria]
        px = [p[0] for p in puntos]
        py = [p[1] for p in puntos]

        if a.sentido_unico:
            ax.plot(px, py, color=c["un_sentido"], linewidth=1.7,
                    solid_capstyle="round", zorder=3)
            # Una avenida viene partida en decenas de tramos cortos; poner una
            # flecha en cada uno tapa el trazo. Solo se marcan los tramos con
            # longitud suficiente para que la flecha se lea.
            if a.longitud_m >= ancho_m * 0.025:
                _flecha(ax, puntos, c["un_sentido"])
        else:
            # El doble sentido son dos aristas opuestas: se dibuja una sola vez.
            clave = frozenset((a.origen, a.destino))
            if clave in dibujadas:
                continue
            dibujadas.add(clave)
            ax.plot(px, py, color=c["doble_sentido"], linewidth=1.4,
                    solid_capstyle="round", zorder=2)

    # --- Semaforos ------------------------------------------------------------
    semaforos = [n for n in red.nodos.values() if n.semaforo]
    for n in semaforos:
        x, y = pr(n.lat, n.lon)
        # Relleno hueco cuando el cruce NO permite vuelta continua: de un
        # vistazo se distingue donde el giro a la derecha si paga los 10 s.
        ax.add_patch(Circle(
            (x, y), radius=ancho_m * 0.004,
            facecolor=c["semaforo"] if n.vuelta_continua else c["fondo"],
            edgecolor=c["semaforo"], linewidth=1.2, zorder=5,
        ))

    # --- Deposito -------------------------------------------------------------
    dep = red.nodos[esc.deposito]
    dx, dy = pr(dep.lat, dep.lon)
    ax.add_patch(Circle((dx, dy), radius=ancho_m * 0.013,
                        facecolor=c["deposito"], edgecolor="#0B0E14",
                        linewidth=1.8, zorder=7))
    ax.text(dx, dy, "S", ha="center", va="center", fontsize=11,
            fontweight="bold", color="#0B0E14", zorder=8, family="monospace")

    # --- Entregas -------------------------------------------------------------
    for i, e in enumerate(esc.entregas):
        x, y = pr(e.lat, e.lon)
        ax.add_patch(Circle((x, y), radius=ancho_m * 0.012,
                            facecolor=c["entrega"], edgecolor="#0B0E14",
                            linewidth=1.6, zorder=7))
        ax.text(x, y, str(i + 1), ha="center", va="center", fontsize=9.5,
                fontweight="bold", color="#0B0E14", zorder=8, family="monospace")

    # --- Encuadre -------------------------------------------------------------
    margen = ancho_m * 0.05
    ax.set_xlim(min(xs) - margen, max(xs) + margen)
    ax.set_ylim(min(ys) - margen, max(ys) + margen)
    ax.set_aspect("equal")
    ax.axis("off")

    # --- Textos ---------------------------------------------------------------
    r = red.resumen()
    carga = esc.resumen()["carga"]

    fig.text(0.5, 0.975, f"{esc.zona['nombre'].upper()} - MONTERREY (OpenStreetMap)",
             ha="center", va="top", fontsize=15, color=c["texto"],
             family="monospace")
    fig.text(
        0.5, 0.955,
        f"{r['cruces']} cruces - {r['calles_fisicas']} tramos - "
        f"{r['tramos_un_sentido']} de un sentido - {r['semaforos']} semaforos",
        ha="center", va="top", fontsize=11.5, color=c["texto"], family="monospace",
    )
    fig.text(
        0.5, 0.937,
        f"{carga['entregas']} entregas - {carga['paquetes']} paquetes - "
        f"{carga['peso_total_kg']:.0f} kg - semilla {esc.semilla}",
        ha="center", va="top", fontsize=10.5, color=c["texto_tenue"],
        family="monospace",
    )

    fig.text(0.015, 0.018,
             "azul = doble sentido    naranja = un sentido (flecha)",
             ha="left", va="bottom", fontsize=10, color=c["texto_tenue"],
             family="monospace")
    fig.text(0.015, 0.038,
             "semaforo relleno = permite vuelta continua a la derecha",
             ha="left", va="bottom", fontsize=10, color=c["texto_tenue"],
             family="monospace")

    # --- Leyenda --------------------------------------------------------------
    claves = [
        Line2D([], [], marker="o", linestyle="", markersize=9,
               markerfacecolor=c["deposito"], markeredgecolor="#0B0E14",
               label="punto de partida"),
        Line2D([], [], marker="o", linestyle="", markersize=9,
               markerfacecolor=c["entrega"], markeredgecolor="#0B0E14",
               label=f"entregas ({len(esc.entregas)})"),
        Line2D([], [], marker="o", linestyle="", markersize=6,
               markerfacecolor=c["semaforo"], markeredgecolor=c["semaforo"],
               label=f"semaforos ({len(semaforos)})"),
    ]
    # La leyenda va anclada a la figura, no a los ejes: dentro del mapa taparia
    # las entregas que caen en la esquina.
    leyenda = fig.legend(
        handles=claves, loc="lower right", bbox_to_anchor=(0.985, 0.012),
        frameon=True, facecolor="#141821", edgecolor="#2A3140", fontsize=10,
        labelcolor=c["texto"], borderpad=0.8,
    )
    leyenda.set_zorder(10)

    fig.savefig(ruta_png, dpi=110, facecolor=c["fondo"], bbox_inches="tight")
    plt.close(fig)
    return ruta_png


def _flecha(ax, puntos: list[tuple[float, float]], color: str) -> None:
    """
    Punta de flecha a media polilinea para marcar el sentido de circulacion.

    Se coloca sobre el segmento intermedio real y no sobre la cuerda, para que
    en una calle curva la flecha caiga encima del trazo y no fuera de el.
    """
    if len(puntos) < 2:
        return
    medio = len(puntos) // 2
    p0 = puntos[max(0, medio - 1)]
    p1 = puntos[medio] if medio < len(puntos) else puntos[-1]
    if p0 == p1:
        return
    ax.annotate(
        "", xy=p1, xytext=p0,
        arrowprops=dict(arrowstyle="-|>", color=color, linewidth=0,
                        mutation_scale=13),
        zorder=4,
    )
