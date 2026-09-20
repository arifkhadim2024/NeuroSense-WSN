/**
 * 2D Canvas Heatmap and Voronoi Cell Rendering Module.
 * Draws coverage multiplicity matrices (0x, 1x, 2x, 3x+) and planar polygonal partitions.
 */

import { State } from "./state.js";
import { runPhase1Scheduling, triggerDeployment } from "./panels.js";

let hoveredNodeId = null;

export function initHeatmapAndVoronoi() {
  State.subscribe((event) => {
    if (event === "nodes_changed" || event === "coverage_changed") {
      refreshVoronoiView();
    }
  });

  initCanvasInteractions();
  initVoronoiActionButtons();
  refreshVoronoiView();
}

export function refreshVoronoiView() {
  drawHeatmap();
  drawVoronoi();
  updateVoronoiStats();
}

function initVoronoiActionButtons() {
  const btnP1 = document.getElementById("btn-voronoi-run-phase1");
  if (btnP1) btnP1.addEventListener("click", async () => { await runPhase1Scheduling(); refreshVoronoiView(); });

  const btnDeploy = document.getElementById("btn-voronoi-redeploy");
  if (btnDeploy) btnDeploy.addEventListener("click", async () => {
    State.seed = Math.floor(Math.random() * 1000);
    const numSeed = document.getElementById("num-seed-input");
    if (numSeed) numSeed.value = State.seed;
    await triggerDeployment();
    refreshVoronoiView();
  });
}

function initCanvasInteractions() {
  const vCanvas = document.getElementById("voronoi-canvas");
  if (vCanvas) {
    vCanvas.addEventListener("mousemove", (e) => {
      const rect = vCanvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100.0;
      const y = ((e.clientY - rect.top) / rect.height) * 100.0;
      let closest = null, minD = Infinity;
      State.nodes.forEach((n) => {
        const d = Math.hypot(n.x - x, n.y - y);
        if (d < minD) { minD = d; closest = n; }
      });
      hoveredNodeId = (minD < 15 && closest) ? closest.id : null;
      drawVoronoi();
    });
    vCanvas.addEventListener("mouseleave", () => { hoveredNodeId = null; drawVoronoi(); });
  }

  const hCanvas = document.getElementById("heatmap-canvas");
  if (hCanvas) {
    hCanvas.addEventListener("mousemove", (e) => {
      const rect = hCanvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100.0;
      const y = ((e.clientY - rect.top) / rect.height) * 100.0;
      let count = 0;
      State.nodes.forEach((n) => {
        if (n.state === "ACTIVE" && n.energy > 0) {
          if (Math.hypot(n.x - x, n.y - y) <= (n.sensing_radius || State.sensingRadius)) count++;
        }
      });
      const tag = document.getElementById("heatmap-hover-info");
      if (tag) tag.textContent = `Point (${x.toFixed(0)}m, ${y.toFixed(0)}m): ${count}x Multiplicity (${count === 0 ? 'Hole' : count === 1 ? '1x Ideal' : count + 'x Overlap'})`;
    });
    hCanvas.addEventListener("mouseleave", () => {
      const tag = document.getElementById("heatmap-hover-info");
      if (tag) tag.textContent = "Hover over map to inspect local multiplicity";
    });
  }
}

export function updateVoronoiStats() {
  const cov = State.coverage || {};
  const cr = cov.coverage_ratio !== undefined ? cov.coverage_ratio : 94.5;
  const or = cov.overlap_ratio !== undefined ? cov.overlap_ratio : 42.1;
  const br = cov.blindspot_ratio !== undefined ? cov.blindspot_ratio : Math.max(0, (100 - cr).toFixed(1));
  const mult = cov.multiplicity !== undefined ? cov.multiplicity : (1 + or / 50).toFixed(2);
  const numCells = State.voronoiCells ? State.voronoiCells.length : State.nodes.length;
  const avgArea = numCells > 0 ? (10000 / numCells).toFixed(0) : 200;

  const setT = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setT("voronoi-stat-coverage", `${cr}% (${(cr * 100).toFixed(0)} m²)`);
  setT("voronoi-stat-multiplicity", `${mult}× Avg`);
  setT("voronoi-stat-overlap", `${or}% (${(or * 100).toFixed(0)} m²)`);
  setT("voronoi-stat-blindspots", `${br}% (${(br * 100).toFixed(0)} m²)`);
  setT("voronoi-stat-cells", `${numCells} Cells (${avgArea} m² avg)`);
}

export function drawHeatmap() {
  const canvas = document.getElementById("heatmap-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = "#06090E"; ctx.fillRect(0, 0, w, h);

  const activeNodes = State.nodes.filter((n) => n.state === "ACTIVE" && n.energy > 0);
  if (activeNodes.length === 0) return;

  const scaleX = w / 100.0, scaleY = h / 100.0;
  ctx.globalCompositeOperation = "lighter";

  activeNodes.forEach((node) => {
    const cx = node.x * scaleX, cy = node.y * scaleY;
    const r = (node.sensing_radius || State.sensingRadius) * scaleX;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, "rgba(6, 182, 212, 0.45)");
    grad.addColorStop(0.7, "rgba(16, 185, 129, 0.25)");
    grad.addColorStop(1, "rgba(6, 182, 212, 0)");
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  });

  ctx.globalCompositeOperation = "source-over";
  activeNodes.forEach((node) => {
    const cx = node.x * scaleX, cy = node.y * scaleY;
    ctx.fillStyle = "#F3F4F6"; ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, Math.PI * 2); ctx.fill();
  });
}

export function drawVoronoi() {
  const canvas = document.getElementById("voronoi-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = "#06090E"; ctx.fillRect(0, 0, w, h);

  const cells = State.voronoiCells || [];
  const scaleX = w / 100.0, scaleY = h / 100.0;

  cells.forEach((cell, idx) => {
    const poly = cell.polygon;
    if (!poly || poly.length < 3) return;
    const isHovered = (hoveredNodeId !== null && State.nodes[idx] && State.nodes[idx].id === hoveredNodeId);

    ctx.beginPath();
    ctx.moveTo(poly[0][0] * scaleX, poly[0][1] * scaleY);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0] * scaleX, poly[i][1] * scaleY);
    ctx.closePath();

    ctx.fillStyle = isHovered ? "rgba(6, 182, 212, 0.35)" : (idx % 2 === 0 ? "rgba(139, 92, 246, 0.08)" : "rgba(6, 182, 212, 0.08)");
    ctx.fill();
    ctx.strokeStyle = isHovered ? "#38BDF8" : "rgba(139, 92, 246, 0.35)";
    ctx.lineWidth = isHovered ? 2 : 1;
    ctx.stroke();
  });

  State.nodes.forEach((node) => {
    if (node.state === "DEAD") return;
    const cx = node.x * scaleX, cy = node.y * scaleY;
    const isHovered = (hoveredNodeId === node.id);

    ctx.fillStyle = node.state === "ACTIVE" ? "#06B6D4" : "#8B5CF6";
    ctx.beginPath(); ctx.arc(cx, cy, isHovered ? 5 : 3, 0, Math.PI * 2); ctx.fill();
    if (isHovered) {
      ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 10px monospace";
      ctx.fillText(`N${node.id} (${node.state})`, cx + 6, cy - 4);
    }
  });
}
