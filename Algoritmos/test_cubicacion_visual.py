import matplotlib
matplotlib.use("Agg") # No mostrar ventana
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from Algoritmos.cubicacion import optimize_loading
from Algoritmos.cubicacion.models import Package, Trailer

# 1. Escenario de prueba
trailer = Trailer(id="TR-01", internalLength=1200, internalWidth=240, internalHeight=260, maxWeight=20000)
packages = [
    Package(id="P1", length=100, width=100, height=100, weight=100, stackable=True, stopOrder=1),
    Package(id="P2", length=150, width=100, height=80, weight=150, stackable=True, stopOrder=2),
    Package(id="P3", length=200, width=120, height=100, weight=300, stackable=True, stopOrder=1),
]

# 2. Ejecutar optimización
placements = optimize_loading(packages, trailer)

# 3. Visualizar en 3D
fig = plt.figure(figsize=(10, 6))
ax = fig.add_subplot(111, projection='3d')

# Dibujar el tráiler
ax.set_box_aspect([trailer.internalLength, trailer.internalWidth, trailer.internalHeight])
ax.set_xlim(0, trailer.internalLength)
ax.set_ylim(0, trailer.internalWidth)
ax.set_zlim(0, trailer.internalHeight)

# Dibujar paquetes
for p in placements:
    pkg = next(pk for pk in packages if pk.id == p.packageId)
    # Dimensiones según orientación (simplificado: rotaciónY 0)
    l, w, h = pkg.length, pkg.width, pkg.height
    
    # Dibujar caja (vértices)
    x, y, z = p.position.x, p.position.y, p.position.z
    ax.bar3d(x, y, z, l, w, h, shade=True, alpha=0.6)

ax.set_xlabel('Largo')
ax.set_ylabel('Ancho')
ax.set_zlabel('Alto')
plt.title("Visualización de Cubicación 3D")
plt.savefig("cubicacion_test.png")
print("Prueba finalizada. Resultados guardados en cubicacion_test.png")
print("Placements:", placements)
