#!/usr/bin/env python
"""
Comprobaciones del escenario generado.

No es una suite de pruebas exhaustiva: es la lista de cosas que, si se rompen,
invalidan silenciosamente todo lo que se entrene encima. Cada comprobacion
verifica una afirmacion concreta del modelo, sobre un escenario recien generado
o sobre un JSON ya guardado.

    python verificar.py                      # genera uno y lo revisa
    python verificar.py --semilla 7
    python verificar.py --archivo data/escenarios/escenario_x.json
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from Algoritmos import config, escenario as mod_escenario, exportar
from Algoritmos.rutas import giros, rutas

RAIZ = Path(__file__).resolve().parent


class Resultado:
    def __init__(self) -> None:
        self.fallos: list[str] = []
        self.avisos: list[str] = []
        self.pasadas = 0

    def comprobar(self, condicion: bool, descripcion: str, detalle: str = "") -> None:
        if condicion:
            self.pasadas += 1
            print(f"  ok    {descripcion}")
        else:
            self.fallos.append(f"{descripcion}. {detalle}".strip())
            print(f"  FALLA {descripcion}  {detalle}")

    def avisar(self, condicion: bool, descripcion: str) -> None:
        if not condicion:
            self.avisos.append(descripcion)
            print(f"  aviso {descripcion}")
        else:
            self.pasadas += 1
            print(f"  ok    {descripcion}")


def verificar_escenario(esc) -> Resultado:
    r = Resultado()
    red = esc.red
    tabla = esc.tabla_giros

    print("\nRed vial")
    r.comprobar(len(red.nodos) > 0, "la red tiene cruces")
    r.comprobar(len(red.aristas) > 0, "la red tiene tramos")
    r.comprobar(
        all(a.tiempo_s > 0 for a in red.aristas.values()),
        "todo tramo tiene tiempo de recorrido positivo",
        f"{sum(1 for a in red.aristas.values() if a.tiempo_s <= 0)} en cero",
    )
    r.comprobar(
        all(a.longitud_m > 0 for a in red.aristas.values()),
        "todo tramo tiene longitud positiva",
    )
    r.avisar(
        any(a.sentido_unico for a in red.aristas.values()),
        "la zona incluye calles de un sentido",
    )

    # El sentido unico debe ser real: si el tramo esta marcado de un sentido,
    # no puede existir el tramo inverso entre los mismos dos cruces.
    inversos = {(a.origen, a.destino) for a in red.aristas.values()}
    incoherentes = [
        a.id for a in red.aristas.values()
        if a.sentido_unico and (a.destino, a.origen) in inversos
    ]
    r.comprobar(
        not incoherentes,
        "ningun tramo de un sentido tiene su inverso en el grafo",
        f"{len(incoherentes)} incoherentes",
    )

    print("\nSemaforos")
    con_semaforo = [n for n in red.nodos.values() if n.semaforo]
    r.avisar(bool(con_semaforo), "hay al menos un semaforo")
    r.comprobar(
        all(n.grado_entrada + n.grado_salida >= 2 for n in con_semaforo),
        "todo semaforo esta en un cruce, no en un callejon",
    )

    print("\nModelo de giros")
    r.comprobar(bool(esc.giros), "se generaron maniobras")

    # Un giro solo puede unir dos tramos que realmente se tocan en el nodo.
    mal_encadenados = [
        g for g in esc.giros
        if red.aristas[g.arista_entrada].destino != g.nodo
        or red.aristas[g.arista_salida].origen != g.nodo
    ]
    r.comprobar(
        not mal_encadenados,
        "toda maniobra encadena tramos que concurren en su nodo",
        f"{len(mal_encadenados)} mal encadenadas",
    )

    # Sin semaforo, la penalizacion es exactamente la de la maniobra.
    sin_semaforo = [g for g in esc.giros if not red.nodos[g.nodo].semaforo]
    r.comprobar(
        all(
            abs(g.penalizacion_s - config.PENALIZACION_GIRO_S[g.tipo]) < 1e-6
            for g in sin_semaforo
        ),
        "sin semaforo, el costo del giro es solo el de la maniobra",
    )

    # La afirmacion central: en un cruce semaforizado que permite vuelta
    # continua, girar a la derecha cuesta menos que seguir de frente.
    ahorros = []
    for g in esc.giros:
        if g.tipo != "derecha" or not g.vuelta_continua:
            continue
        rectos = [
            o for o in esc.giros
            if o.nodo == g.nodo and o.tipo == "recto"
        ]
        if rectos:
            ahorros.append(min(o.penalizacion_s for o in rectos) - g.penalizacion_s)

    r.avisar(bool(ahorros), "hay vueltas continuas comparables con un cruce de frente")
    if ahorros:
        r.comprobar(
            all(a > 0 for a in ahorros),
            "la vuelta continua siempre es mas barata que cruzar de frente",
            f"ahorro medio {sum(ahorros)/len(ahorros):.1f} s",
        )

    # Sin vuelta continua permitida, la derecha paga la espera completa.
    derechas_bloqueadas = [
        g for g in esc.giros
        if g.tipo == "derecha" and red.nodos[g.nodo].semaforo
        and not red.nodos[g.nodo].vuelta_continua
    ]
    if derechas_bloqueadas:
        r.comprobar(
            all(
                abs(g.espera_semaforo_s - config.ESPERA_SEMAFORO_S) < 1e-6
                for g in derechas_bloqueadas
            ),
            "sin vuelta continua, la derecha paga los 10 s completos",
        )

    print("\nDeposito y entregas")
    r.comprobar(esc.deposito in red.nodos, "el deposito cae sobre un cruce real")
    r.comprobar(bool(esc.entregas), "hay puntos de entrega")
    r.comprobar(
        all(e.nodo in red.nodos for e in esc.entregas),
        "toda entrega cae sobre un cruce real",
    )
    r.comprobar(
        all(e.paquetes for e in esc.entregas),
        "toda entrega lleva al menos un paquete",
    )
    r.comprobar(
        esc.deposito not in {e.nodo for e in esc.entregas},
        "el deposito no coincide con una entrega",
    )
    r.comprobar(
        len({e.nodo for e in esc.entregas}) == len(esc.entregas),
        "no hay dos entregas en el mismo cruce",
    )
    r.comprobar(
        all(p.peso_kg > 0 and p.volumen_m3 > 0
            for e in esc.entregas for p in e.paquetes),
        "todo paquete tiene peso y volumen positivos",
    )

    print("\nAlcanzabilidad")
    caminos = rutas.caminos_desde(
        red, tabla, esc.deposito, [e.nodo for e in esc.entregas]
    )
    inalcanzables = [d for d, c in caminos.items() if not c.alcanzable]
    r.comprobar(
        not inalcanzables,
        "el camion puede llegar del deposito a toda entrega",
        f"sin camino: {inalcanzables}",
    )

    # Y tiene que poder volver: con calles de un sentido, la ida no garantiza
    # la vuelta.
    sin_retorno = []
    for e in esc.entregas:
        vuelta = rutas.caminos_desde(red, tabla, e.nodo, [esc.deposito])
        if not vuelta[esc.deposito].alcanzable:
            sin_retorno.append(e.id)
    r.comprobar(
        not sin_retorno,
        "el camion puede volver de toda entrega al deposito",
        f"sin retorno: {sin_retorno}",
    )

    print("\nMatriz de tiempos")
    if esc.matriz["tiempo_s"]:
        n = len(esc.matriz["puntos"])
        r.comprobar(
            len(esc.matriz["tiempo_s"]) == n
            and all(len(f) == n for f in esc.matriz["tiempo_s"]),
            "la matriz es cuadrada y cubre deposito mas entregas",
        )
        r.comprobar(
            all(esc.matriz["tiempo_s"][i][i] == 0 for i in range(n)),
            "la diagonal de la matriz es cero",
        )
        asimetricos = sum(
            1
            for i in range(n) for j in range(n)
            if i != j
            and esc.matriz["tiempo_s"][i][j] is not None
            and esc.matriz["tiempo_s"][j][i] is not None
            and abs(esc.matriz["tiempo_s"][i][j] - esc.matriz["tiempo_s"][j][i]) > 1.0
        )
        r.avisar(
            asimetricos > 0,
            f"la matriz es asimetrica en {asimetricos} pares (esperado con "
            f"calles de un sentido)",
        )

        # El camino minimo nunca puede costar menos que ir en linea recta a
        # velocidad maxima: si eso pasa, el modelo de tiempos esta roto.
        v_max = max(config.VELOCIDADES_KMH.values()) / 3.6
        violaciones = 0
        for i, fila in enumerate(esc.matriz["tiempo_s"]):
            for j, t in enumerate(fila):
                d = esc.matriz["distancia_m"][i][j]
                if i != j and t is not None and d is not None and t > 0:
                    if d / t > v_max * 1.01:
                        violaciones += 1
        r.comprobar(
            violaciones == 0,
            "ningun camino supera la velocidad maxima del modelo",
            f"{violaciones} violaciones",
        )

    print("\nCoherencia del costo")
    # Recorrer una ruta paso a paso debe costar lo mismo que dice la matriz.
    destino = esc.entregas[0].nodo
    camino = caminos[destino]
    if camino.alcanzable and camino.aristas:
        recomputado = rutas.costo_secuencia(red, tabla, camino.aristas)
        r.comprobar(
            abs(recomputado - camino.tiempo_s) < 0.05,
            "recorrer la ruta tramo a tramo cuesta lo que dice la busqueda",
            f"{recomputado} vs {camino.tiempo_s}",
        )

    return r


def verificar_json(ruta: Path) -> Resultado:
    """Comprobaciones estructurales sobre un JSON ya escrito."""
    r = Resultado()
    doc = exportar.cargar_json(ruta)

    print(f"\nEstructura de {ruta.name}")
    for clave in ("meta", "zona", "parametros_tiempo", "grafo", "deposito",
                  "entregas", "matriz_tiempos", "resumen"):
        r.comprobar(clave in doc, f"contiene la seccion '{clave}'")

    nodos = {n["id"] for n in doc["grafo"]["nodos"]}
    aristas = doc["grafo"]["aristas"]
    r.comprobar(
        all(a["origen"] in nodos and a["destino"] in nodos for a in aristas),
        "toda arista referencia nodos existentes",
    )
    r.comprobar(
        doc["deposito"]["nodo"] in nodos,
        "el deposito referencia un nodo existente",
    )
    r.comprobar(
        all(e["nodo"] in nodos for e in doc["entregas"]),
        "toda entrega referencia un nodo existente",
    )

    if "giros" in doc:
        ids_arista = {a["id"] for a in aristas}
        r.comprobar(
            all(
                g["arista_entrada"] in ids_arista and g["arista_salida"] in ids_arista
                for g in doc["giros"]["lista"]
            ),
            "toda maniobra referencia aristas existentes",
        )
    return r


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Verifica un escenario generado.")
    p.add_argument("--semilla", type=int, default=1234)
    p.add_argument("--archivo", type=Path, default=None,
                   help="Verifica un JSON existente en lugar de generar uno.")
    args = p.parse_args(argv)

    if args.archivo:
        resultado = verificar_json(args.archivo)
    else:
        print(f"Generando escenario de prueba (semilla {args.semilla})...")
        esc = mod_escenario.generar(semilla=args.semilla)
        print(f"Zona: {esc.zona['nombre']}  ({esc.zona['radio_m']} m)")
        resultado = verificar_escenario(esc)

        destino = RAIZ / "data" / "escenarios" / "_verificacion.json"
        exportar.guardar_json(esc, destino)
        resultado_json = verificar_json(destino)
        resultado.fallos += resultado_json.fallos
        resultado.pasadas += resultado_json.pasadas

    print("\n" + "-" * 60)
    print(f"{resultado.pasadas} comprobaciones pasadas, "
          f"{len(resultado.fallos)} fallidas, {len(resultado.avisos)} avisos")
    for f in resultado.fallos:
        print(f"  FALLA: {f}")
    return 1 if resultado.fallos else 0


if __name__ == "__main__":
    raise SystemExit(main())
