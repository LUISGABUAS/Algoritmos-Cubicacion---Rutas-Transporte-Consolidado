"""
Modelo de giros: donde vive realmente el costo de un semaforo.

La idea central del escenario es que el tiempo de una ruta NO es solo la suma
de los tramos. Al llegar a un cruce, lo que cuesta depende de la maniobra:

    costo(giro) = penalizacion_maniobra + espera_semaforo

y la espera del semaforo se anula casi por completo cuando la maniobra es una
vuelta continua a la derecha. Por eso el costo se modela sobre el par
(tramo de entrada, tramo de salida) y no sobre el nodo: el mismo cruce cuesta
10 s si lo cruzas de frente y 2 s si das vuelta a la derecha en rojo.

Consecuencia practica para quien implemente la busqueda: este grafo es de
aristas expandidas. Un Dijkstra clasico sobre nodos NO puede representar este
costo; hay que buscar sobre estados (arista actual). Ver rutas.py.
"""
from __future__ import annotations

from dataclasses import dataclass

from . import config
from .grafo import RedVial

TIPOS_GIRO = ("recto", "derecha", "izquierda", "retorno")


@dataclass
class Giro:
    """Una maniobra posible: entrar a un cruce por un tramo y salir por otro."""
    nodo: int
    arista_entrada: int
    arista_salida: int
    tipo: str
    angulo: float              # grados con signo: + derecha, - izquierda
    penalizacion_s: float      # maniobra + espera de semaforo
    espera_semaforo_s: float   # cuanto de la penalizacion es el semaforo
    vuelta_continua: bool      # se aplico el descuento de vuelta en rojo
    # Vuelta en U estricta: el tramo de salida devuelve al cruce de origen.
    # Un giro puede ser de tipo "retorno" por su angulo (horquilla cerrada
    # hacia OTRA calle) sin ser una vuelta en U; solo estas ultimas se
    # prohiben con permitir_retorno=False, porque las otras son legales.
    es_vuelta_en_u: bool = False


def diferencia_rumbo(rumbo_entrada: float, rumbo_salida: float) -> float:
    """
    Cambio de direccion al pasar por el cruce, en grados dentro de (-180, 180].

    Positivo = giro a la derecha (sentido horario).
    Negativo = giro a la izquierda.
    """
    delta = (rumbo_salida - rumbo_entrada + 180.0) % 360.0 - 180.0
    # El modulo devuelve -180 en el caso limite; se normaliza a +180 para que
    # un retorno exacto caiga siempre del mismo lado.
    return 180.0 if delta == -180.0 else delta


def clasificar(delta: float) -> str:
    """Traduce el cambio de rumbo a una de las cuatro maniobras."""
    magnitud = abs(delta)
    if magnitud <= config.UMBRAL_RECTO_GRADOS:
        return "recto"
    if magnitud > config.UMBRAL_RETORNO_GRADOS:
        return "retorno"
    return "derecha" if delta > 0 else "izquierda"


def costo_giro(
    tipo: str,
    hay_semaforo: bool,
    permite_vuelta_continua: bool,
) -> tuple[float, float, bool]:
    """
    Costo en segundos de una maniobra.

    Devuelve (penalizacion_total, parte_de_semaforo, se_aplico_vuelta_continua).

    La penalizacion de maniobra se cobra siempre, haya o no semaforo: frenar y
    retomar velocidad para dar vuelta a la izquierda cuesta tiempo aunque el
    cruce este libre. Encima de eso se suma la espera del semaforo, que la
    vuelta continua reduce de 10 s a 2 s (el alto y ceder el paso).
    """
    base = config.PENALIZACION_GIRO_S[tipo]

    if not hay_semaforo:
        return base, 0.0, False

    if tipo == "derecha" and permite_vuelta_continua:
        return base + config.VUELTA_CONTINUA_S, config.VUELTA_CONTINUA_S, True

    return base + config.ESPERA_SEMAFORO_S, config.ESPERA_SEMAFORO_S, False


def generar(red: RedVial, permitir_retorno: bool | None = None) -> list[Giro]:
    """
    Enumera todas las maniobras legales de la red.

    Para cada nodo se cruza cada tramo entrante con cada tramo saliente. Se
    descarta la vuelta en U (volver por donde se vino) cuando esta prohibida,
    y siempre se descarta salir por el mismo tramo por el que se entro.
    """
    if permitir_retorno is None:
        permitir_retorno = config.PERMITIR_RETORNO

    giros: list[Giro] = []

    for nid, nodo in red.nodos.items():
        for aid_in in red.entrantes[nid]:
            entrada = red.aristas[aid_in]
            for aid_out in red.salientes[nid]:
                salida = red.aristas[aid_out]

                # Salir por el mismo tramo por el que se entro no es un giro.
                if aid_in == aid_out:
                    continue

                # Vuelta en U: el tramo de salida devuelve al nodo de origen.
                es_reversa = salida.destino == entrada.origen
                if es_reversa and not permitir_retorno:
                    continue

                delta = diferencia_rumbo(entrada.rumbo_final, salida.rumbo_inicial)
                tipo = clasificar(delta)

                # Una reversa geometricamente suave (calles casi paralelas)
                # sigue siendo una vuelta en U y debe costar como tal.
                if es_reversa:
                    tipo = "retorno"

                total, espera, continua = costo_giro(
                    tipo, nodo.semaforo, nodo.vuelta_continua
                )

                giros.append(
                    Giro(
                        nodo=nid,
                        arista_entrada=aid_in,
                        arista_salida=aid_out,
                        tipo=tipo,
                        angulo=round(delta, 1),
                        penalizacion_s=round(total, 2),
                        espera_semaforo_s=round(espera, 2),
                        vuelta_continua=continua,
                        es_vuelta_en_u=es_reversa,
                    )
                )

    return giros


def tabla(giros: list[Giro]) -> dict[tuple[int, int], Giro]:
    """Indice (arista_entrada, arista_salida) -> Giro para busqueda O(1)."""
    return {(g.arista_entrada, g.arista_salida): g for g in giros}


def resumen(giros: list[Giro]) -> dict:
    """Estadisticas de los giros, utiles para verificar el escenario."""
    por_tipo = {t: 0 for t in TIPOS_GIRO}
    for g in giros:
        por_tipo[g.tipo] += 1

    con_semaforo = [g for g in giros if g.espera_semaforo_s > 0]
    ahorro = [g for g in giros if g.vuelta_continua]

    return {
        "total": len(giros),
        "por_tipo": por_tipo,
        "vueltas_en_u": sum(1 for g in giros if g.es_vuelta_en_u),
        "en_semaforo": len(con_semaforo),
        "con_vuelta_continua": len(ahorro),
        "ahorro_medio_vuelta_continua_s": round(
            config.ESPERA_SEMAFORO_S - config.VUELTA_CONTINUA_S, 2
        ),
        "penalizacion_media_s": round(
            sum(g.penalizacion_s for g in giros) / len(giros), 2
        ) if giros else 0.0,
    }
