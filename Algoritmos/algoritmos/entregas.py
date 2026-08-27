"""
Deposito, puntos de entrega y paqueteria.

El punto de partida y las entregas se colocan sobre cruces reales de la red ya
recortada al componente fuertemente conexo, de modo que siempre exista un
camino de ida y de vuelta entre cualquier par.

Los paquetes traen dimensiones y peso porque son la entrada del segundo
algoritmo del proyecto, el de cubicacion: no basta con saber a donde hay que ir,
hay que saber que cabe y en que orden se baja.
"""
from __future__ import annotations

import random
from dataclasses import dataclass, field

from . import config
from .grafo import RedVial, distancia_m


@dataclass
class Paquete:
    """Un bulto individual. Las dimensiones van en cm y el peso en kg."""
    id: str
    tipo: str
    largo: float
    ancho: float
    alto: float
    peso_kg: float
    volumen_m3: float
    fragil: bool
    apilable: bool
    requiere_seguro: bool
    prioridad: str
    valor_declarado: float | None = None
    orientaciones_permitidas: list[str] | None = None


@dataclass
class Entrega:
    """Una parada: un cruce al que hay que llegar con uno o mas paquetes."""
    id: str
    nodo: int
    lat: float
    lon: float
    direccion: str
    paquetes: list[Paquete] = field(default_factory=list)

    @property
    def peso_total_kg(self) -> float:
        return round(sum(p.peso_kg for p in self.paquetes), 2)

    @property
    def volumen_total_m3(self) -> float:
        return round(sum(p.volumen_m3 for p in self.paquetes), 4)

    @property
    def tiempo_servicio_s(self) -> float:
        """Cuanto se detiene el camion aqui: bajar, entregar y recabar firma."""
        return round(
            config.SERVICIO_BASE_S
            + config.SERVICIO_POR_PAQUETE_S * len(self.paquetes),
            1,
        )


# --- Utilidades --------------------------------------------------------------

def _elegir_ponderado(rng: random.Random, opciones, pesos):
    """Eleccion aleatoria ponderada; normaliza los pesos por si no suman 1."""
    total = sum(pesos)
    umbral = rng.random() * total
    acumulado = 0.0
    for opcion, peso in zip(opciones, pesos):
        acumulado += peso
        if umbral <= acumulado:
            return opcion
    return opciones[-1]


def _describir_cruce(red: RedVial, nid: int) -> str:
    """Nombre legible del cruce a partir de las calles que concurren en el."""
    calles = red.nodos[nid].calles
    if len(calles) >= 2:
        return f"{calles[0]} y {calles[1]}"
    if calles:
        return calles[0]
    return f"Cruce sin nombre (nodo {nid})"


# --- Paquetes ----------------------------------------------------------------

def generar_paquete(rng: random.Random, identificador: str) -> Paquete:
    """Crea un paquete coherente: el peso sale del volumen por una densidad."""
    plantilla = _elegir_ponderado(
        rng,
        config.CATALOGO_PAQUETES,
        [p["prob"] for p in config.CATALOGO_PAQUETES],
    )

    largo = round(rng.uniform(*plantilla["largo"]), 1)
    ancho = round(rng.uniform(*plantilla["ancho"]), 1)
    alto = round(rng.uniform(*plantilla["alto"]), 1)

    volumen_m3 = (largo * ancho * alto) / 1_000_000
    densidad = rng.uniform(*plantilla["densidad"])
    peso = round(max(0.1, volumen_m3 * densidad), 2)

    fragil = rng.random() < plantilla["p_fragil"]
    apilable = rng.random() < plantilla["p_apilable"]
    seguro = rng.random() < plantilla["p_seguro"]

    # Un bulto fragil no se acuesta ni se pone de punta: eso lo tiene que
    # respetar el algoritmo de acomodo.
    orientaciones = ["vertical"] if fragil else None

    return Paquete(
        id=identificador,
        tipo=plantilla["tipo"],
        largo=largo,
        ancho=ancho,
        alto=alto,
        peso_kg=peso,
        volumen_m3=round(volumen_m3, 5),
        fragil=fragil,
        apilable=apilable and not fragil,
        requiere_seguro=seguro,
        prioridad=_elegir_ponderado(rng, config.PRIORIDADES, config.PRIORIDADES_PROB),
        valor_declarado=round(rng.uniform(500, 45_000), 2) if seguro else None,
        orientaciones_permitidas=orientaciones,
    )


# --- Colocacion sobre la red -------------------------------------------------

def elegir_deposito(red: RedVial, rng: random.Random) -> int:
    """
    Punto de partida del camion.

    Se prefiere un cruce con varias salidas: un deposito en un callejon de una
    sola salida hace que toda ruta empiece igual y empobrece el entrenamiento.
    """
    candidatos = [
        nid for nid in red.nodos
        if len(red.salientes[nid]) >= 2 and len(red.entrantes[nid]) >= 2
    ]
    return rng.choice(candidatos or list(red.nodos))


def elegir_entregas(
    red: RedVial,
    rng: random.Random,
    cantidad: int,
    deposito: int,
    separacion_min_m: float | None = None,
) -> list[int]:
    """
    Reparte los puntos de entrega por la zona.

    Sin separacion minima, el muestreo uniforme apelmaza las entregas donde la
    malla de calles es mas densa y deja media zona vacia. Si no se alcanza la
    cantidad pedida con la separacion actual, se relaja poco a poco antes que
    devolver menos entregas de las solicitadas.
    """
    if separacion_min_m is None:
        separacion_min_m = config.SEPARACION_MIN_ENTREGAS_M

    candidatos = [nid for nid in red.nodos if nid != deposito and red.salientes[nid]]
    separacion = separacion_min_m
    elegidos: list[int] = []

    while separacion >= 10.0:
        elegidos = []
        barajados = candidatos[:]
        rng.shuffle(barajados)

        for nid in barajados:
            if len(elegidos) >= cantidad:
                break
            nodo = red.nodos[nid]
            referencia = [deposito, *elegidos]
            if all(
                distancia_m(
                    nodo.lat, nodo.lon,
                    red.nodos[otro].lat, red.nodos[otro].lon,
                ) >= separacion
                for otro in referencia
            ):
                elegidos.append(nid)

        if len(elegidos) >= cantidad:
            break
        separacion *= 0.7   # zona chica: acercar las entregas y reintentar

    return sorted(elegidos[:cantidad])


def generar(
    red: RedVial,
    rng: random.Random,
    cantidad: int | None = None,
    deposito: int | None = None,
) -> tuple[int, list[Entrega]]:
    """
    Genera el deposito y la lista de entregas con sus paquetes.

    Devuelve (nodo del deposito, entregas).
    """
    if cantidad is None:
        cantidad = rng.randint(config.ENTREGAS_MIN, config.ENTREGAS_MAX)

    if deposito is None:
        deposito = elegir_deposito(red, rng)
    elif deposito not in red.nodos:
        raise ValueError(f"El nodo {deposito} no existe en la red generada")

    nodos_entrega = elegir_entregas(red, rng, cantidad, deposito)

    entregas: list[Entrega] = []
    contador_paquete = 1

    for i, nid in enumerate(nodos_entrega, start=1):
        n_paquetes = _elegir_ponderado(
            rng, config.PAQUETES_POR_ENTREGA, config.PAQUETES_PROB
        )
        paquetes = []
        for _ in range(n_paquetes):
            paquetes.append(generar_paquete(rng, f"PKG-{contador_paquete:03d}"))
            contador_paquete += 1

        nodo = red.nodos[nid]
        entregas.append(
            Entrega(
                id=f"ENT-{i:02d}",
                nodo=nid,
                lat=nodo.lat,
                lon=nodo.lon,
                direccion=_describir_cruce(red, nid),
                paquetes=paquetes,
            )
        )

    return deposito, entregas


def resumen(entregas: list[Entrega]) -> dict:
    """Totales de carga: lo que el algoritmo de cubicacion debe hacer caber."""
    paquetes = [p for e in entregas for p in e.paquetes]
    return {
        "entregas": len(entregas),
        "paquetes": len(paquetes),
        "paquetes_por_entrega": round(len(paquetes) / len(entregas), 2) if entregas else 0,
        "peso_total_kg": round(sum(p.peso_kg for p in paquetes), 2),
        "volumen_total_m3": round(sum(p.volumen_m3 for p in paquetes), 4),
        "fragiles": sum(1 for p in paquetes if p.fragil),
        "no_apilables": sum(1 for p in paquetes if not p.apilable),
        "tiempo_servicio_total_s": round(sum(e.tiempo_servicio_s for e in entregas), 1),
    }
