#!/usr/bin/env python
"""
Genera escenarios de ruteo sobre calles reales de Monterrey.

Ejemplos
--------
    python generar_escenario.py
    python generar_escenario.py --semilla 42 --entregas 10
    python generar_escenario.py --zona "Centro" --radio 800 --semaforos densidad
    python generar_escenario.py --lote 50 --sin-png        # dataset de entrenamiento
    python generar_escenario.py --listar-zonas
"""
from __future__ import annotations

import argparse
import re
import sys
import time
import unicodedata
from pathlib import Path

from algoritmos import config, escenario as mod_escenario, exportar, visualizar

RAIZ = Path(__file__).resolve().parent
SALIDA_POR_DEFECTO = RAIZ / "data" / "escenarios"


def _slug(texto: str) -> str:
    """Nombre de archivo seguro a partir del nombre de la zona."""
    normalizado = unicodedata.normalize("NFKD", texto)
    ascii_only = normalizado.encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", ascii_only.lower()).strip("-")


def construir_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Generador de escenarios de ruteo y cubicacion (Monterrey).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    p.add_argument("-s", "--semilla", type=int, default=None,
                   help="Semilla. La misma semilla reproduce el mismo escenario.")
    p.add_argument("-z", "--zona", type=str, default=None,
                   help="Zona concreta de Monterrey. Por defecto una al azar.")
    p.add_argument("-r", "--radio", type=int, default=None,
                   help=f"Radio del recorte en metros "
                        f"(por defecto entre {config.RADIO_M_MIN} y {config.RADIO_M_MAX}).")
    p.add_argument("-e", "--entregas", type=int, default=None,
                   help=f"Numero de puntos de entrega "
                        f"(por defecto entre {config.ENTREGAS_MIN} y {config.ENTREGAS_MAX}).")

    p.add_argument("--semaforos", choices=["osm", "auto", "densidad"], default="auto",
                   help="osm = solo los reales; auto = reales + relleno; "
                        "densidad = ignora OSM (por defecto: auto).")
    p.add_argument("--densidad-semaforos", type=float, default=None,
                   help=f"Fraccion de cruces semaforizados "
                        f"(por defecto {config.DENSIDAD_SEMAFOROS_OBJETIVO}).")
    p.add_argument("--sin-retorno", action="store_true",
                   help="Prohibe la vuelta en U en las intersecciones.")

    p.add_argument("-o", "--salida", type=Path, default=SALIDA_POR_DEFECTO,
                   help="Carpeta de salida.")
    p.add_argument("-n", "--nombre", type=str, default=None,
                   help="Nombre base de los archivos (sin extension).")
    p.add_argument("--lote", type=int, default=1,
                   help="Genera N escenarios de corrido, con semillas consecutivas.")

    p.add_argument("--sin-png", action="store_true", help="No renderiza el mapa.")
    p.add_argument("--sin-geojson", action="store_true", help="No escribe el GeoJSON.")
    p.add_argument("--sin-giros", action="store_true",
                   help="Omite la tabla de giros del JSON (archivo mucho mas liviano).")
    p.add_argument("--sin-matriz", action="store_true",
                   help="Omite la matriz de tiempos (generacion mas rapida).")
    p.add_argument("--compacto", action="store_true",
                   help="JSON sin indentacion, para datasets grandes.")

    p.add_argument("--listar-zonas", action="store_true",
                   help="Muestra las zonas disponibles y termina.")
    return p


def generar_uno(args, semilla: int | None, indice: int, total: int) -> bool:
    """Genera, guarda y reporta un escenario. Devuelve True si tuvo exito."""
    etiqueta = f"[{indice}/{total}] " if total > 1 else ""
    inicio = time.time()

    try:
        esc = mod_escenario.generar(
            semilla=semilla,
            zona=args.zona,
            radio_m=args.radio,
            n_entregas=args.entregas,
            modo_semaforos=args.semaforos,
            densidad_semaforos=args.densidad_semaforos,
            permitir_retorno=not args.sin_retorno,
            con_matriz=not args.sin_matriz,
            progreso=lambda m: print(f"{etiqueta}{m}", flush=True),
        )
    except Exception as exc:
        print(f"{etiqueta}ERROR: {type(exc).__name__}: {exc}", file=sys.stderr)
        return False

    base = args.nombre or f"escenario_{_slug(esc.zona['nombre'])}_{esc.semilla}"
    if total > 1 and args.nombre:
        base = f"{base}_{esc.semilla}"

    ruta_json = exportar.guardar_json(
        esc, args.salida / f"{base}.json",
        incluir_giros=not args.sin_giros,
        compacto=args.compacto,
    )

    rutas_extra = []
    if not args.sin_geojson:
        rutas_extra.append(exportar.guardar_geojson(esc, args.salida / f"{base}.geojson"))
    if not args.sin_png:
        rutas_extra.append(visualizar.dibujar(esc, args.salida / f"{base}.png"))

    _reportar(esc, ruta_json, rutas_extra, time.time() - inicio, etiqueta)
    return True


def _reportar(esc, ruta_json: Path, extras: list[Path], segundos: float,
              etiqueta: str) -> None:
    r = esc.resumen()
    red, giros, carga = r["red"], r["giros"], r["carga"]
    sem = r["semaforos"]

    print(f"\n{etiqueta}{esc.zona['nombre']}  (semilla {esc.semilla}, "
          f"radio {esc.zona['radio_m']} m, {segundos:.1f} s)")
    print(f"  red      {red['cruces']} cruces - {red['calles_fisicas']} tramos de calle "
          f"({red['tramos_un_sentido']} de un sentido) - "
          f"{red['longitud_total_km']} km - {red['tramos']} aristas dirigidas")
    print(f"  semaforos {sem['total']} ({sem['de_osm']} de OSM, "
          f"{sem['sinteticos']} sinteticos) - "
          f"{sem['con_vuelta_continua']} con vuelta continua")
    print(f"  giros    {giros['total']} maniobras - "
          f"{giros['en_semaforo']} en semaforo - "
          f"{giros['con_vuelta_continua']} se ahorran "
          f"{giros['ahorro_medio_vuelta_continua_s']} s")
    print(f"  carga    {carga['entregas']} entregas - {carga['paquetes']} paquetes - "
          f"{carga['peso_total_kg']} kg - {carga['volumen_total_m3']} m3")
    print(f"  cota inferior de ruta: {r['cota_inferior_ruta_s'] / 60:.1f} min")

    for advertencia in esc.advertencias:
        print(f"  AVISO: {advertencia}")

    tam_kb = ruta_json.stat().st_size / 1024
    print(f"  -> {ruta_json}  ({tam_kb:.0f} KB)")
    for extra in extras:
        print(f"  -> {extra}")


def main(argv: list[str] | None = None) -> int:
    args = construir_parser().parse_args(argv)

    if args.listar_zonas:
        print("Zonas disponibles:\n")
        for z in config.ZONAS_MONTERREY:
            print(f"  {z['nombre']:<28} {z['lat']:.4f}, {z['lon']:.4f}")
        return 0

    if args.lote < 1:
        print("--lote debe ser al menos 1", file=sys.stderr)
        return 2

    args.salida.mkdir(parents=True, exist_ok=True)

    exitos = 0
    for i in range(args.lote):
        # En lote, las semillas avanzan de una en una desde la semilla base;
        # sin semilla base cada escenario toma una al azar.
        semilla = None if args.semilla is None else args.semilla + i
        if generar_uno(args, semilla, i + 1, args.lote):
            exitos += 1

    if args.lote > 1:
        print(f"\n{exitos}/{args.lote} escenarios generados en {args.salida}")

    return 0 if exitos else 1


if __name__ == "__main__":
    raise SystemExit(main())
