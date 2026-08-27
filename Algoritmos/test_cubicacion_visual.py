import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from Algoritmos.cubicacion import optimize_loading
from Algoritmos.cubicacion.models import Package, Trailer
import random

# 1. Generar escenario complejo
trailer_dims = (1200, 240, 260)
num_packages = 20
packages = []
for i in range(num_packages):
    packages.append(Package(
        id=f"P{i}", 
        length=random.randint(50, 400), # Dimensiones "extrañas"
        width=random.randint(50, 200),
        height=random.randint(50, 200),
        weight=random.randint(10, 500),
        stackable=True, 
        stopOrder=random.randint(1, 5)
    ))

# 2. Ejecutar optimización (manejar múltiples envíos)
all_shipments = []
remaining_packages = packages

while remaining_packages:
    trailer = Trailer(id=f"TR-{len(all_shipments)+1}", internalLength=trailer_dims[0], internalWidth=trailer_dims[1], internalHeight=trailer_dims[2], maxWeight=20000)
    
    placements, unplaced = optimize_loading(remaining_packages, trailer)
    all_shipments.append((trailer, placements))
    print(f"Envío {len(all_shipments)}: {len(placements)} cajas colocadas, {len(unplaced)} pendientes.")
    
    if len(remaining_packages) == len(unplaced):
        print("Error: No se pudieron colocar más cajas.")
        break
    remaining_packages = unplaced

# 3. Visualizar (primer envío)
trailer, placements = all_shipments[0]
fig = plt.figure(figsize=(10, 6))
ax = fig.add_subplot(111, projection='3d')

ax.set_box_aspect([trailer.internalLength, trailer.internalWidth, trailer.internalHeight])
ax.set_xlim(0, trailer.internalLength)
ax.set_ylim(0, trailer.internalWidth)
ax.set_zlim(0, trailer.internalHeight)

for p in placements:
    pkg = next(pk for pk in packages if pk.id == p.packageId)
    x, y, z = p.position.x, p.position.y, p.position.z
    ax.bar3d(x, y, z, pkg.length, pkg.width, pkg.height, shade=True, alpha=0.6)

plt.title(f"Visualización Envío 1: {len(placements)} cajas")
plt.savefig("cubicacion_test.png")
print("Prueba finalizada. Resultados guardados en cubicacion_test.png")
