const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 8000;
const API_PREFIX = "/api/v1";

// Carpeta de escenarios del generador Python (puede estar vacía)
const ESC_DIR = path.join(__dirname, "..", "Algoritmos", "data", "escenarios");

function listScenarioFiles() {
  try {
    const files = fs.readdirSync(ESC_DIR).filter((f) => f.endsWith(".json"));
    return files;
  } catch (e) {
    return [];
  }
}

app.get(`${API_PREFIX}/scenarios`, (req, res) => {
  const files = listScenarioFiles();
  if (files.length === 0) {
    // devolver mock list
    return res.json([
      { id: "sc-001", meta: { semilla: 42, ciudad: "Monterrey" }, zona: { nombre: "Centro" } },
    ]);
  }
  const list = files.map((f) => {
    try {
      const raw = fs.readFileSync(path.join(ESC_DIR, f), "utf8");
      const json = JSON.parse(raw);
      return { id: f.replace(/\.json$/, ""), meta: json.meta, zona: json.zona };
    } catch (e) {
      return null;
    }
  }).filter(Boolean);
  res.json(list);
});

app.get(`${API_PREFIX}/scenarios/:id`, (req, res) => {
  const id = req.params.id;
  const fp = path.join(ESC_DIR, `${id}.json`);
  if (fs.existsSync(fp)) {
    const raw = fs.readFileSync(fp, "utf8");
    return res.json(JSON.parse(raw));
  }
  // mock
  res.json({ id, meta: { semilla: 42, version_formato: "1.0", ciudad: "Monterrey" }, grafo: { nodos: [], aristas: [] }, entregas: [], deposito: null, matriz_tiempos: null });
});

app.get(`${API_PREFIX}/scenarios/:id/geojson`, (req, res) => {
  const id = req.params.id;
  const geoPath = path.join(ESC_DIR, `${id}.geojson`);
  if (fs.existsSync(geoPath)) return res.sendFile(geoPath);
  res.json({ type: "FeatureCollection", features: [] });
});

app.get(`${API_PREFIX}/scenarios/:id/png`, (req, res) => {
  const id = req.params.id;
  const p = path.join(ESC_DIR, `${id}.png`);
  if (fs.existsSync(p)) return res.sendFile(p);
  // 1x1 PNG base64
  const buf = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYGWNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
    "base64"
  );
  res.setHeader("Content-Type", "image/png");
  res.send(buf);
});

// --- Paquetes con persistencia simple en disco (mock CRUD) ---------------
const DATA_DIR = path.join(__dirname, "data");
const PACKAGES_FILE = path.join(DATA_DIR, "packages.json");

function loadPackages() {
  try {
    const raw = fs.readFileSync(PACKAGES_FILE, "utf8");
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed.packages) ? parsed.packages : [];
    // re-normalizar por si el archivo viene de una versión anterior del mock
    // (p.ej. sin status/priority válidos)
    return list.map(normalizeForStorage);
  } catch (e) {
    return [];
  }
}

function loadNextPkgId(loadedPackages) {
  try {
    const raw = fs.readFileSync(PACKAGES_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (Number.isInteger(parsed.nextPkgId)) return parsed.nextPkgId;
  } catch (e) {
    // ignore, derive below
  }
  const maxSeen = loadedPackages.reduce((max, p) => {
    const n = parseInt(String(p.id).replace(/^PKG-/, ""), 10);
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 0);
  return maxSeen + 1;
}

function savePackages() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(
      PACKAGES_FILE,
      JSON.stringify({ packages, nextPkgId }, null, 2),
      "utf8"
    );
  } catch (e) {
    console.error("No se pudo persistir packages.json:", e.message);
  }
}

const packages = loadPackages();
let nextPkgId = loadNextPkgId(packages);
if (packages.length > 0) savePackages(); // persistir cualquier normalización aplicada al cargar

app.get(`${API_PREFIX}/packages`, (req, res) => {
  const { trailerId, routeId } = req.query;
  let list = packages;
  if (trailerId) list = list.filter((p) => p.trailerId === trailerId);
  if (routeId) list = list.filter((p) => p.routeId === routeId);
  res.json(list.map(normalizeForResponse));
});

app.get(`${API_PREFIX}/packages/:id`, (req, res) => {
  const pkg = packages.find((p) => p.id === req.params.id);
  if (!pkg) return res.status(404).send({ message: 'Not found' });
  res.json(normalizeForResponse(pkg));
});

app.post(`${API_PREFIX}/packages`, (req, res) => {
  const data = req.body || {};
  const id = `PKG-${String(nextPkgId++).padStart(3, '0')}`;
  const now = new Date().toISOString();
  const stored = normalizeForStorage({ id, createdAt: now, updatedAt: now, ...data });
  packages.push(stored);
  savePackages();
  res.status(201).json(normalizeForResponse(stored));
});

app.put(`${API_PREFIX}/packages/:id`, (req, res) => {
  const idx = packages.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).send({ message: 'Not found' });
  const updated = normalizeForStorage({ ...packages[idx], ...req.body, updatedAt: new Date().toISOString() });
  packages[idx] = updated;
  savePackages();
  res.json(normalizeForResponse(updated));
});

app.delete(`${API_PREFIX}/packages/:id`, (req, res) => {
  const idx = packages.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).send({ message: 'Not found' });
  packages.splice(idx, 1);
  savePackages();
  res.status(204).end();
});

// Endpoint de optimización (mock)
app.post(`${API_PREFIX}/optimization/run`, (req, res) => {
  // Espera body: { depotId, trailerId, packageIds, ... }
  const body = req.body || {};
  const packageIds = body.packageIds || [];
  const trailerId = body.trailerId || null;
  const placements = packageIds.map((id, i) => ({ packageId: id, x: i * 10, y: 0, z: 0, rotationY: 0 }));
  const result = {
    trailerId,
    placements,
    unplacedPackageIds: [],
    metrics: { volumeUtilization: 0.7, weightUtilization: 0.5, packagesPlaced: packageIds.length, packagesTotal: packageIds.length, warnings: [] },
  };
  res.json(result);
});

app.listen(PORT, () => console.log(`Mock backend listening on http://localhost:${PORT}${API_PREFIX}`));

// --- Helpers para normalizar campos entre backend (es) y frontend (en-US keys)
function normalizeForStorage(input) {
  // Accept either frontend keys or backend Spanish keys and store in a canonical frontend shape
  const out = { ...input };
  // peso_kg or weight -> weight (number)
  if (out.peso_kg !== undefined && out.weight === undefined) out.weight = out.peso_kg;
  if (out.weight !== undefined && out.peso_kg === undefined) out.peso_kg = out.weight;
  // dimensions
  if (out.largo_cm !== undefined && out.length === undefined) out.length = out.largo_cm;
  if (out.ancho_cm !== undefined && out.width === undefined) out.width = out.ancho_cm;
  if (out.alto_cm !== undefined && out.height === undefined) out.height = out.alto_cm;
  if (out.length !== undefined) out.largo_cm = out.length;
  if (out.width !== undefined) out.ancho_cm = out.width;
  if (out.height !== undefined) out.alto_cm = out.height;
  // boolean flags
  if (out.fragil !== undefined && out.fragile === undefined) out.fragile = out.fragil;
  if (out.apilable !== undefined && out.stackable === undefined) out.stackable = out.apilable;
  if (out.requiere_seguro !== undefined && out.requiresInsurance === undefined) out.requiresInsurance = out.requiere_seguro;
  if (out.fragile !== undefined) out.fragil = out.fragile;
  if (out.stackable !== undefined) out.apilable = out.stackable;
  if (out.requiresInsurance !== undefined) out.requiere_seguro = out.requiresInsurance;
  // priority and other
  if (out.prioridad !== undefined && out.priority === undefined) out.priority = out.prioridad;
  if (out.priority !== undefined && out.prioridad === undefined) out.prioridad = out.priority;
  const VALID_PRIORITIES = ["low", "medium", "high"];
  if (!VALID_PRIORITIES.includes(out.priority)) out.priority = "medium";
  out.prioridad = out.priority;
  if (out.valor_declarado !== undefined && out.declaredValue === undefined) out.declaredValue = out.valor_declarado;
  if (out.orientaciones_permitidas !== undefined && out.allowedOrientations === undefined) out.allowedOrientations = out.orientaciones_permitidas;
  // status (estado) — siempre debe quedar un valor válido para el frontend
  if (out.estado !== undefined && out.status === undefined) out.status = out.estado;
  const VALID_STATUSES = ["pending", "assigned", "loaded", "in_transit", "delivered"];
  if (!VALID_STATUSES.includes(out.status)) out.status = "pending";
  out.estado = out.status;
  return out;
}

function normalizeForResponse(stored) {
  // ensure response uses frontend-friendly keys
  return {
    id: stored.id,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
    destination: stored.destination,
    length: stored.length,
    width: stored.width,
    height: stored.height,
    weight: stored.weight,
    fragile: stored.fragile,
    stackable: stored.stackable,
    requiresInsurance: stored.requiresInsurance,
    priority: stored.priority,
    declaredValue: stored.declaredValue,
    allowedOrientations: stored.allowedOrientations,
    status: stored.status,
    // keep any extra fields
    ...Object.fromEntries(Object.entries(stored).filter(([k]) => !["id","createdAt","updatedAt","destination","length","width","height","weight","fragile","stackable","requiresInsurance","priority","declaredValue","allowedOrientations","status"].includes(k)))
  };
}
