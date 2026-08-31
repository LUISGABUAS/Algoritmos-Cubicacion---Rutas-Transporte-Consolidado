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

// --- Paquetes en memoria (mock CRUD) -------------------------------------
const packages = [];
let nextPkgId = 1;

app.get(`${API_PREFIX}/packages`, (req, res) => {
  const { trailerId, routeId } = req.query;
  let list = packages;
  if (trailerId) list = list.filter((p) => p.trailerId === trailerId);
  if (routeId) list = list.filter((p) => p.routeId === routeId);
  res.json(list);
});

app.get(`${API_PREFIX}/packages/:id`, (req, res) => {
  const pkg = packages.find((p) => p.id === req.params.id);
  if (!pkg) return res.status(404).send({ message: 'Not found' });
  res.json(pkg);
});

app.post(`${API_PREFIX}/packages`, (req, res) => {
  const data = req.body || {};
  const id = `PKG-${String(nextPkgId++).padStart(3, '0')}`;
  const now = new Date().toISOString();
  const pkg = { id, createdAt: now, updatedAt: now, ...data };
  packages.push(pkg);
  res.status(201).json(pkg);
});

app.put(`${API_PREFIX}/packages/:id`, (req, res) => {
  const idx = packages.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).send({ message: 'Not found' });
  packages[idx] = { ...packages[idx], ...req.body, updatedAt: new Date().toISOString() };
  res.json(packages[idx]);
});

app.delete(`${API_PREFIX}/packages/:id`, (req, res) => {
  const idx = packages.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).send({ message: 'Not found' });
  packages.splice(idx, 1);
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
