"""
Parámetros del generador de escenarios.

Todo lo ajustable del modelo vive aquí: zonas de Monterrey, velocidades,
penalizaciones de tiempo y catálogo de paquetes. El resto de módulos importa
de aquí y no define constantes propias.
"""
from __future__ import annotations

# ─── Zonas reales del área metropolitana de Monterrey ────────────────────────
# Centros verificados sobre calles con red vial densa. El generador toma una al
# azar y le aplica un desplazamiento aleatorio (JITTER_M) para que dos corridas
# con semillas distintas nunca den exactamente el mismo recorte.
ZONAS_MONTERREY: list[dict] = [
    {"nombre": "Centro de Monterrey",      "lat": 25.6714, "lon": -100.3090},
    {"nombre": "Barrio Antiguo",           "lat": 25.6666, "lon": -100.3092},
    {"nombre": "Mitras Centro",            "lat": 25.6885, "lon": -100.3428},
    {"nombre": "Tecnológico",              "lat": 25.6512, "lon": -100.2897},
    {"nombre": "Obispado",                 "lat": 25.6767, "lon": -100.3300},
    {"nombre": "Contry",                   "lat": 25.6303, "lon": -100.2731},
    {"nombre": "Valle Oriente",            "lat": 25.6338, "lon": -100.3222},
    {"nombre": "San Pedro Centrito",       "lat": 25.6572, "lon": -100.3573},
    {"nombre": "San Pedro Del Valle",      "lat": 25.6478, "lon": -100.3576},
    {"nombre": "Cumbres",                  "lat": 25.7175, "lon": -100.3739},
    {"nombre": "Linda Vista",              "lat": 25.7000, "lon": -100.2530},
    {"nombre": "Guadalupe Centro",         "lat": 25.6770, "lon": -100.2560},
    {"nombre": "San Nicolás Centro",       "lat": 25.7433, "lon": -100.2831},
    {"nombre": "Anáhuac",                  "lat": 25.7020, "lon": -100.2960},
    {"nombre": "Escobedo Centro",          "lat": 25.7967, "lon": -100.3161},
    {"nombre": "Apodaca Centro",           "lat": 25.7810, "lon": -100.1885},
    {"nombre": "Santa Catarina Centro",    "lat": 25.6739, "lon": -100.4581},
    {"nombre": "La Fama",                  "lat": 25.6620, "lon": -100.4180},
    {"nombre": "Fundidora / Talleres",     "lat": 25.6790, "lon": -100.2840},
    {"nombre": "Chepevera",                "lat": 25.6930, "lon": -100.3280},
    {"nombre": "Roma / Moderna",           "lat": 25.7060, "lon": -100.3400},
    {"nombre": "Independencia",            "lat": 25.6560, "lon": -100.3050},
]

# Desplazamiento aleatorio aplicado al centro de la zona elegida (metros).
JITTER_M = 350.0

# Radio del recorte a descargar (metros). El generador elige dentro del rango.
RADIO_M_MIN = 600
RADIO_M_MAX = 1000

# ─── Velocidades por tipo de vía (km/h) ──────────────────────────────────────
# Se usan cuando OSM no trae `maxspeed`. Ajustadas a tránsito urbano real de
# Monterrey, no a límites legales: son velocidades efectivas de recorrido.
VELOCIDADES_KMH: dict[str, float] = {
    "motorway":       80.0,
    "motorway_link":  50.0,
    "trunk":          65.0,
    "trunk_link":     45.0,
    "primary":        50.0,
    "primary_link":   35.0,
    "secondary":      45.0,
    "secondary_link": 30.0,
    "tertiary":       40.0,
    "tertiary_link":  30.0,
    "residential":    30.0,
    "living_street":  15.0,
    "unclassified":   30.0,
    "service":        20.0,
    "road":           30.0,
}
VELOCIDAD_FALLBACK_KMH = 30.0

# ─── Modelo de tiempo ────────────────────────────────────────────────────────
# El costo de una ruta = suma(tiempo de tramos) + suma(penalización de giros).
# La espera del semáforo NO es un costo del nodo: es un costo del giro, porque
# depende de la maniobra (una vuelta continua a la derecha no espera el rojo).

ESPERA_SEMAFORO_S = 10.0   # cruce de intersección semaforizada
VUELTA_CONTINUA_S = 2.0    # vuelta a la derecha en rojo: alto y ceder el paso

# Penalización base de la maniobra, exista o no semáforo (des/aceleración).
PENALIZACION_GIRO_S: dict[str, float] = {
    "recto":     0.0,
    "derecha":   2.0,
    "izquierda": 5.0,   # cruza el flujo opuesto
    "retorno":   8.0,
}

# Clasificación del giro por diferencia de rumbo (grados).
UMBRAL_RECTO_GRADOS = 30.0    # |delta| <= 30  → recto
UMBRAL_RETORNO_GRADOS = 150.0 # |delta| >  150 → retorno

# Fracción de intersecciones semaforizadas que permiten vuelta continua.
PROB_VUELTA_CONTINUA = 0.85

# ¿Se permite el retorno (vuelta en U) en una intersección?
PERMITIR_RETORNO = True

# ─── Semáforos ───────────────────────────────────────────────────────────────
# modo "osm"      → solo los semáforos reales etiquetados en OpenStreetMap
# modo "auto"     → los reales + relleno en cruces importantes hasta la densidad
# modo "densidad" → ignora OSM y semaforiza una fracción de los cruces mayores
DENSIDAD_SEMAFOROS_OBJETIVO = 0.12  # fracción de cruces (grado >= 3) con semáforo
GRADO_MINIMO_SEMAFORO = 3           # un semáforo necesita un cruce real

# ─── Entregas ────────────────────────────────────────────────────────────────
ENTREGAS_MIN = 6
ENTREGAS_MAX = 14
SEPARACION_MIN_ENTREGAS_M = 180.0   # evita que dos entregas caigan en el mismo cruce
PAQUETES_POR_ENTREGA = (1, 2, 3, 4, 5)
PAQUETES_PROB       = (0.40, 0.28, 0.17, 0.10, 0.05)  # se normaliza al usarse

# ─── Catálogo de paquetes ────────────────────────────────────────────────────
# Los campos coinciden con el tipo `Package` del frontend (dimensiones en cm,
# peso en kg) para que el algoritmo de cubicación consuma lo mismo que la UI.
# `densidad` en kg/m³ genera un peso coherente con el volumen de la caja.
CATALOGO_PAQUETES: list[dict] = [
    {"tipo": "sobre",            "prob": 0.10, "largo": (30, 40),   "ancho": (22, 30),  "alto": (2, 5),     "densidad": (80, 150),  "p_fragil": 0.02, "p_apilable": 0.98, "p_seguro": 0.05},
    {"tipo": "caja_chica",       "prob": 0.28, "largo": (25, 40),   "ancho": (20, 30),  "alto": (15, 25),   "densidad": (90, 200),  "p_fragil": 0.15, "p_apilable": 0.95, "p_seguro": 0.10},
    {"tipo": "caja_mediana",     "prob": 0.24, "largo": (40, 60),   "ancho": (30, 45),  "alto": (25, 40),   "densidad": (80, 180),  "p_fragil": 0.18, "p_apilable": 0.90, "p_seguro": 0.12},
    {"tipo": "caja_grande",      "prob": 0.14, "largo": (60, 90),   "ancho": (45, 70),  "alto": (40, 60),   "densidad": (70, 150),  "p_fragil": 0.20, "p_apilable": 0.75, "p_seguro": 0.18},
    {"tipo": "electrodomestico", "prob": 0.08, "largo": (60, 110),  "ancho": (55, 75),  "alto": (60, 100),  "densidad": (60, 120),  "p_fragil": 0.55, "p_apilable": 0.25, "p_seguro": 0.45},
    {"tipo": "tubo_perfil",      "prob": 0.06, "largo": (150, 280), "ancho": (15, 30),  "alto": (15, 30),   "densidad": (200, 500), "p_fragil": 0.05, "p_apilable": 0.30, "p_seguro": 0.08},
    {"tipo": "tarima",           "prob": 0.10, "largo": (100, 120), "ancho": (80, 100), "alto": (80, 150),  "densidad": (120, 300), "p_fragil": 0.10, "p_apilable": 0.40, "p_seguro": 0.20},
]

PRIORIDADES = ("low", "medium", "high")
PRIORIDADES_PROB = (0.45, 0.40, 0.15)

# Tiempo de servicio en el punto de entrega (bajar y entregar el paquete).
SERVICIO_BASE_S = 90.0       # bajar del camión, tocar, firmar
SERVICIO_POR_PAQUETE_S = 45.0

# ─── Paleta de la visualización ──────────────────────────────────────────────
# Los colores de marca vienen del frontend (src/index.css) para que el PNG y la
# aplicación se vean como el mismo producto.
COLORES = {
    "fondo":         "#0B0E14",
    "doble_sentido": "#2F86E0",
    "un_sentido":    "#F97316",
    "semaforo":      "#EF4444",
    "entrega":       "#FBBF24",
    "deposito":      "#22C55E",
    "texto":         "#E5E7EB",
    "texto_tenue":   "#6B7280",
}
