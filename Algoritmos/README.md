# Algoritmos — generador de escenarios

Genera mapas de reparto sobre **calles reales de Monterrey** descargadas de
OpenStreetMap, con un punto de partida y puntos de entrega colocados al azar, y
los exporta a JSON para alimentar el modelo de ruteo y el de cubicación.

Un escenario contiene todo lo necesario para rutear sin volver a consultar OSM:
la red vial con sus sentidos de circulación, los semáforos, el costo en segundos
de **cada maniobra posible**, el depósito, las entregas y su paquetería.

```
python generar_escenario.py --semilla 42 --entregas 8
```

---

## Instalación

```bash
pip install -r requirements.txt
```

La primera corrida descarga la zona de OpenStreetMap; las siguientes sobre la
misma zona salen del caché en `data/cache_osm/`. Overpass (el servidor de OSM)
limita la tasa de peticiones: si generas muchos escenarios seguidos de zonas
distintas, algunas descargas se quedan esperando turno. Es normal, no está
colgado.

---

## Uso

```bash
# Escenario al azar
python generar_escenario.py

# Reproducible: la misma semilla da exactamente el mismo escenario
python generar_escenario.py --semilla 42 --entregas 10

# Zona concreta, radio fijo, solo semáforos reales de OSM
python generar_escenario.py --zona "Centro" --radio 600 --semaforos osm

# Dataset para entrenar: 50 escenarios, sin imágenes, JSON compacto
python generar_escenario.py --lote 50 --sin-png --compacto

python generar_escenario.py --listar-zonas
python verificar.py                    # comprueba que el modelo es coherente
```

Cada corrida escribe en `data/escenarios/`:

| Archivo | Para qué |
|---|---|
| `.json` | El escenario completo. Es la entrada del modelo. |
| `.geojson` | Para abrirlo en geojson.io o Leaflet y mirarlo sin escribir código. |
| `.png` | Vista rápida para saber si el mapa salió razonable. |

---

## El modelo de tiempo

Esta es la parte que hay que entender antes de escribir el algoritmo de
búsqueda. El costo de una ruta **no** es la suma de los tramos:

```
costo(ruta) = Σ tiempo_s(tramo)  +  Σ penalización_s(giro)  +  Σ tiempo_servicio_s(entrega)
```

### El costo del semáforo vive en el giro, no en el cruce

Un semáforo no cuesta lo mismo según lo que hagas en él. Cruzarlo de frente son
10 s de espera; dar vuelta a la derecha con **vuelta continua** son 2 s, porque
solo hay que hacer el alto y ceder el paso. Por eso el costo está definido sobre
el par *(tramo por el que entras, tramo por el que sales)* y no sobre el nodo.

```
penalización = maniobra + espera_semáforo

maniobra:   recto 0 s · derecha 2 s · izquierda 5 s · retorno 8 s
espera:     sin semáforo         →  0 s
            con semáforo         → 10 s
            con semáforo, vuelta
            continua a la derecha→  2 s
```

Cruzar de frente un semáforo: `0 + 10 = 10 s`.
Dar vuelta a la derecha en ese mismo semáforo: `2 + 2 = 4 s`.

La vuelta a la izquierda es la maniobra cara (`5 + 10 = 15 s`) porque cruza el
flujo opuesto. Eso es lo que debe empujar al modelo a preferir rutas de vueltas
a la derecha, que es exactamente el comportamiento que buscan las paqueterías
reales.

No todos los cruces permiten vuelta continua: cada semáforo lleva su bandera
`vuelta_continua` (por defecto el 85 % la permite).

### Consecuencia: el grafo es de aristas expandidas

> **Un Dijkstra normal sobre nodos calcula tiempos equivocados en este mapa.**

Si el costo de salir de un cruce depende de por dónde entraste, entonces el
estado de la búsqueda no es «en qué cruce estoy» sino «por qué tramo vengo
circulando». Llegar al mismo cruce por dos tramos distintos deja al camión ante
costos de salida distintos.

`algoritmos/rutas.py` implementa la búsqueda correcta y sirve de referencia:
los estados son aristas y la transición cuesta `giro + tramo nuevo`.

### Sentidos de circulación

El grafo es dirigido. Una calle de doble sentido aparece como **dos aristas
opuestas**; una de un sentido, como **una sola**. Si no existe la arista, el
camión no puede pasar por ahí: no hay que revisar ninguna bandera.

Por eso el mapa se recorta al **mayor componente fuertemente conexo**: garantiza
que desde cualquier punto se puede llegar a cualquier otro *y volver*. Sin ese
recorte, una entrega puede caer en una calle de un sentido de la que no hay
salida y la ruta se vuelve irresoluble.

La matriz de tiempos **no es simétrica**: ir de A a B casi nunca cuesta lo mismo
que volver.

---

## Estructura del JSON

```jsonc
{
  "meta":   { "semilla": 42, "version_formato": "1.0", "ciudad": "Monterrey..." },
  "zona":   { "nombre": "Centro de Monterrey", "lat": ..., "lon": ..., "radio_m": 600 },

  "parametros_tiempo": {
    "espera_semaforo_s": 10.0,
    "vuelta_continua_s": 2.0,
    "penalizacion_giro_s": { "recto": 0.0, "derecha": 2.0, "izquierda": 5.0, "retorno": 8.0 },
    "velocidades_kmh": { "primary": 50.0, "residential": 30.0, ... }
  },

  "grafo": {
    "dirigido": true,
    "nodos": [{
      "id": 0,                      // 0..N-1, consecutivo
      "osm_id": 293542773,          // trazabilidad con OpenStreetMap
      "lat": 25.6749, "lon": -100.3096,
      "grado_entrada": 2, "grado_salida": 2,
      "es_cruce": true,             // 3+ ramales, no un simple quiebre
      "semaforo": true,
      "semaforo_origen": "osm",     // "osm" | "sintetico" | null
      "vuelta_continua": true,      // permite vuelta a la derecha en rojo
      "calles": ["Av. Juárez", "Modesto Arreola"]
    }],
    "aristas": [{
      "id": 0,
      "origen": 12, "destino": 13,  // transitable SOLO en ese sentido
      "nombre": "Calle Zaragoza", "tipo": "secondary",
      "longitud_m": 101.37,
      "sentido_unico": true,
      "velocidad_kmh": 45.0,
      "tiempo_s": 8.11,             // recorrido libre del tramo
      "carriles": 2,
      "rumbo_inicial": 178.4,       // grados al salir del origen
      "rumbo_final": 179.1,         // grados al llegar al destino
      "geometria": [[lat, lon], ...]
    }]
  },

  "giros": {
    "lista": [{
      "nodo": 13,
      "arista_entrada": 0, "arista_salida": 7,
      "tipo": "derecha",            // recto | derecha | izquierda | retorno
      "angulo": 87.3,               // + derecha, - izquierda
      "penalizacion_s": 4.0,        // maniobra + espera
      "espera_semaforo_s": 2.0,     // cuánto de eso fue el semáforo
      "vuelta_continua": true,      // se aplicó el descuento
      "es_vuelta_en_u": false       // vuelta en U estricta
    }]
  },

  "deposito": { "nodo": 45, "lat": ..., "lon": ..., "direccion": "..." },

  "entregas": [{
    "id": "ENT-01",
    "nodo": 88, "lat": ..., "lon": ...,
    "direccion": "Av. Juárez y Modesto Arreola",
    "tiempo_servicio_s": 180.0,     // 90 s base + 45 s por paquete
    "peso_total_kg": 41.2,
    "volumen_total_m3": 0.38,
    "paquetes": [{
      "id": "PKG-001", "tipo": "caja_mediana",
      "largo_cm": 52.3, "ancho_cm": 38.1, "alto_cm": 31.0,
      "peso_kg": 9.4, "volumen_m3": 0.0618,
      "fragil": false, "apilable": true,
      "requiere_seguro": false, "prioridad": "medium",
      "valor_declarado": null,
      "orientaciones_permitidas": null   // null = cualquiera
    }]
  }],

  "matriz_tiempos": {
    "puntos": [45, 88, 102, ...],   // depósito primero, luego las entregas
    "tiempo_s":    [[0, 245.3, ...], ...],   // NO simétrica
    "distancia_m": [[0, 1840.2, ...], ...],
    "inalcanzables": []
  },

  "resumen": { ... }
}
```

**Un par `(arista_entrada, arista_salida)` ausente de `giros.lista` es una
maniobra prohibida.** Con `--sin-retorno`, las vueltas en U desaparecen de la
lista y el buscador debe tratarlas como inexistentes.

Cuidado con dos cosas que se parecen y no son lo mismo:

- `es_vuelta_en_u: true` — el tramo de salida te devuelve al cruce del que
  venías. Es la vuelta en U de verdad, y es la que `--sin-retorno` elimina.
- `tipo: "retorno"` — solo dice que el ángulo supera los 150°. Puede ser una
  horquilla cerrada hacia **otra** calle, que es una maniobra legal y sigue
  existiendo aunque prohíbas las vueltas en U.

En el Centro de Monterrey, `--sin-retorno` quita 30 vueltas en U y deja 1 giro
de tipo `retorno` que no lo es.

### Paquetes y el frontend

Los campos de `paquetes` corresponden uno a uno con el tipo `Package` de la
aplicación (`src/types/package.ts`), que es lo que consumirá el algoritmo de
cubicación:

| JSON del escenario | Frontend | Notas |
|---|---|---|
| `largo_cm` / `ancho_cm` / `alto_cm` | `length` / `width` / `height` | cm |
| `peso_kg` | `weight` | kg |
| `fragil` | `fragile` | |
| `apilable` | `stackable` | |
| `requiere_seguro` | `requiresInsurance` | |
| `prioridad` | `priority` | `low` / `medium` / `high` |
| `valor_declarado` | `declaredValue` | |
| `orientaciones_permitidas` | `allowedOrientations` | `null` = cualquiera |

El orden de entrega de una ruta se traduce directo a `stopOrder`, que es lo que
el acomodo usa para decidir qué va cerca de las puertas.

---

## Opciones

| Opción | Efecto |
|---|---|
| `-s, --semilla N` | Reproduce exactamente el mismo escenario. |
| `-z, --zona TEXTO` | Fija la zona en lugar de tomar una al azar. |
| `-r, --radio M` | Radio del recorte en metros (por defecto 600–1000). |
| `-e, --entregas N` | Número de puntos de entrega (por defecto 6–14). |
| `--semaforos MODO` | `osm` (solo reales) · `auto` (reales + relleno) · `densidad`. |
| `--densidad-semaforos F` | Fracción de cruces semaforizados (por defecto 0.12). |
| `--sin-retorno` | Prohíbe la vuelta en U. |
| `--lote N` | Genera N escenarios con semillas consecutivas. |
| `--sin-png` / `--sin-geojson` | Omite salidas auxiliares. |
| `--sin-giros` | JSON mucho más liviano, sin la tabla de maniobras. |
| `--sin-matriz` | Generación más rápida, sin matriz origen-destino. |
| `--compacto` | JSON sin indentar, para datasets grandes. |

Sobre `--semaforos`: la cobertura de semáforos en OSM es despareja. El centro de
Monterrey está bien mapeado; una colonia residencial puede no tener ninguno
etiquetado. El modo `auto` conserva **todos** los reales y solo rellena hasta la
densidad objetivo, priorizando los cruces de calles más importantes. Usa `osm`
cuando necesites fidelidad estricta y `densidad` cuando necesites presión de
semáforos garantizada para entrenar.

---

## Módulos

| Archivo | Responsabilidad |
|---|---|
| `config.py` | Todos los parámetros ajustables. Ningún otro módulo define constantes. |
| `osm.py` | Elige zona, descarga de Overpass, recorta al componente fuertemente conexo. |
| `grafo.py` | `RedVial`: nodos, aristas dirigidas y rumbos de entrada/salida. |
| `semaforos.py` | Coloca semáforos y decide dónde hay vuelta continua. |
| `giros.py` | Clasifica cada maniobra y le pone precio. **El corazón del modelo.** |
| `rutas.py` | Dijkstra sobre aristas expandidas. Valida y arma la matriz O-D. |
| `entregas.py` | Depósito, puntos de entrega y generación de paquetería. |
| `escenario.py` | Orquesta todo lo anterior. |
| `exportar.py` | Serializa a JSON y GeoJSON. |
| `visualizar.py` | Render del PNG. |

`verificar.py` comprueba 40 afirmaciones del modelo sobre un escenario recién
generado: que los sentidos únicos sean coherentes, que la vuelta continua
siempre sea más barata que cruzar de frente, que toda entrega sea alcanzable
**y** se pueda volver de ella, y que recorrer una ruta paso a paso cueste lo que
la búsqueda dijo que costaba.

---

## Por qué JSON

El escenario es un grafo con listas anidadas de longitud variable —geometrías,
paquetes por entrega, tabla de maniobras—, así que una tabla plana (CSV,
Parquet) obligaría a partirlo en varios archivos y a reconstruir las relaciones
al leerlo. JSON lo mantiene en una sola pieza, se abre y se revisa a mano
durante el desarrollo, y `json.load` es suficiente para consumirlo.

Si el volumen llega a molestar: `--compacto` quita la indentación y `--sin-giros`
quita la tabla de maniobras (que es la sección más pesada, y se puede recalcular
con `giros.generar()` a partir de los rumbos y `parametros_tiempo`).

---

## Siguientes pasos

Lo que este generador deja listo para las dos piezas que faltan:

1. **Algoritmo de ruteo** — consume `matriz_tiempos` para el orden de visita y
   `grafo` + `giros` para el camino concreto. `rutas.costo_secuencia()` puntúa
   cualquier ruta propuesta con el mismo modelo de costo que usó el generador,
   y `resumen.cota_inferior_ruta_s` da una referencia para saber si un resultado
   es razonable.

2. **Algoritmo de cubicación** — consume `entregas[].paquetes` con dimensiones,
   peso y restricciones, más el orden de visita que produzca el ruteo: lo que se
   entrega primero va cerca de las puertas.
