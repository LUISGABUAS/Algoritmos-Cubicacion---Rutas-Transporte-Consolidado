# Algoritmo de Cubicación 3D

Este módulo implementa un algoritmo evolutivo (basado en la librería `deap`) para resolver el problema de empaquetamiento 3D (3D Bin Packing) con restricciones LIFO y equilibrio de pesos para tráileres de transporte consolidado.

## Enfoque: Algoritmo Evolutivo basado en Secuencias

El algoritmo no intenta posicionar directamente los paquetes, sino que "evoluciona" una secuencia de ordenamiento y una configuración de rotaciones. Un decodificador determinista (regla de llenado) es el encargado de colocar los paquetes físicamente basándose en ese orden.

## Componentes

1.  **Cromosoma**: Representa una permutación de los IDs de los paquetes (orden de entrada) y una lista de índices de orientación (0-5, representando rotaciones posibles).
2.  **Fitness (Aptitud)**: Calculado como:
    `Fitness = α * UtilizaciónVolumen - β * PenalizaciónLIFO - γ * DesbalancePeso`
    *   `α` (Utilización): Objetivo maximizar el espacio ocupado.
    *   `β` (LIFO): Penalización severa si un paquete de una parada posterior bloquea a uno de una anterior.
    *   `γ` (Peso): Penalización si el centro de gravedad se aleja del centro longitudinal.
3.  **Decodificador (Packer)**: Utiliza una heurística de tipo *Deepest Bottom Left Fill* (DBLF) mejorada para respetar el orden definido por el cromosoma.

## Parámetros de Configuración

*   `Tamaño de Población`: 50 - 100 individuos.
*   `Generaciones`: 50 - 200.
*   `Probabilidad de Mutación`: 0.1 - 0.2.

## Dependencias

Se requiere instalar las dependencias definidas en `Algoritmos/requirements.txt`:
```bash
pip install -r Algoritmos/requirements.txt
```
