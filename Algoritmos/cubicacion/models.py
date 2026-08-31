from dataclasses import dataclass
from typing import List, Optional

@dataclass
class Package:
    id: str
    length: float
    width: float
    height: float
    weight: float
    stackable: bool
    stopOrder: int

@dataclass
class Trailer:
    id: str
    internalLength: float
    internalWidth: float
    internalHeight: float
    maxWeight: float

@dataclass
class Position:
    x: float
    y: float
    z: float
    rotationY: int

@dataclass
class Placement:
    packageId: str
    position: Position
