/**
 * Interactive ANN Laboratory and Model Showcase Module.
 * Visualizes connection weights, live forward pass activations, confusion matrix, and what-if inference.
 */

import { State } from "./state.js";
import { Api } from "./api.js";

let modelData = null;
const whatIfValues = [0.8, 0.45, 6, 0.25, 0.4, 0.85, 0.15, 0.0];
let lastActivations = { h1: [], h2: [], out: 0.5 };

const FEATURE_LABELS = [
  "Residual Energy (E_res)", "Sink Distance (d_sink)", "Neighbors (k_nbr)",
  "Unique Coverage (CR_uniq)", "Overlap Ratio (OR)", "Local Density (ρ_loc)",
  "Nearest Dist (d_act)", "Obstacle Blocked (obs)"
];

export async function initAnnLab() {
  try {
    modelData = await Api.fetchAnnModel();
    State.annModel = modelData;
    if (modelData?.metrics) renderModelTelemetry(modelData);
    if (modelData) {
      initWhatIfSliders();
      initPresetButtons();
      drawNeuralNetDiagram(modelData);
    }
  } catch (err) {
    console.error("Failed to load ANN model for lab:", err);
  }
}

function renderModelTelemetry(data) {
  const m = data.metrics || {};
  const setEl = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };

  if (m.accuracy !== undefined) setEl("ann-acc-val", `${(m.accuracy * 100).toFixed(1)}%`);
  if (m.f1 !== undefined) setEl("ann-f1-val", m.f1.toFixed(4));
  if (m.roc_auc !== undefined) setEl("ann-auc-val", m.roc_auc.toFixed(4));

  const cm = m.confusion_matrix;
  if (cm && cm.length === 2) {
    setEl("cm-tn", cm[0][0]); setEl("cm-fp", cm[0][1]);
    setEl("cm-fn", cm[1][0]); setEl("cm-tp", cm[1][1]);
  }
  if (data.speedup) {
    setEl("speedup-factor", `${data.speedup.speedup_factor}x Speedup`);
    setEl("speedup-text", `Oracle: ${data.speedup.oracle_avg_ms}ms | ANN: ${data.speedup.ann_avg_ms}ms`);
  }
}

export function drawNeuralNetDiagram(data) {
  const canvas = document.getElementById("ann-canvas");
  if (!canvas || !data) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;

  ctx.fillStyle = "#06090E"; ctx.fillRect(0, 0, w, h);

  const layers = data.layer_sizes || [8, 16, 8, 1];
  const layerX = [w * 0.18, w * 0.44, w * 0.70, w * 0.90];
  const layerNames = ["Input (8)", "Hidden 1 (16)", "Hidden 2 (8)", "Output (1)"];
  const nodePositions = [];

  // Draw Layer Titles
  ctx.font = "bold 11px sans-serif"; ctx.fillStyle = "#94A3B8"; ctx.textAlign = "center";
  layerX.forEach((x, i) => ctx.fillText(layerNames[i], x, 22));

  layers.forEach((size, lIdx) => {
    const layerNodes = [];
    const spacing = Math.min(34, (h - 70) / (size + 1));
    const startY = 40 + (h - 40 - (size - 1) * spacing) / 2;
    for (let i = 0; i < size; i++) layerNodes.push({ x: layerX[lIdx], y: startY + i * spacing });
    nodePositions.push(layerNodes);
  });

  // Synaptic Weights
  const weights = data.weights || [];
  weights.forEach((W, lIdx) => {
    if (!nodePositions[lIdx] || !nodePositions[lIdx + 1] || !W) return;
    const fromNodes = nodePositions[lIdx], toNodes = nodePositions[lIdx + 1];

    for (let i = 0; i < fromNodes.length; i++) {
      for (let j = 0; j < toNodes.length; j++) {
        const weightVal = W[i] ? W[i][j] : 0.1;
        const absW = Math.abs(weightVal || 0.1);
        ctx.strokeStyle = (weightVal >= 0) ? `rgba(6, 182, 212, ${Math.min(0.7, absW * 0.5)})` : `rgba(244, 63, 94, ${Math.min(0.7, absW * 0.5)})`;
        ctx.lineWidth = Math.max(0.4, Math.min(2.0, absW * 1.2));
        ctx.beginPath(); ctx.moveTo(fromNodes[i].x, fromNodes[i].y); ctx.lineTo(toNodes[j].x, toNodes[j].y); ctx.stroke();
      }
    }
  });

  // Neurons
  nodePositions.forEach((layerNodes, lIdx) => {
    layerNodes.forEach((pt, nIdx) => {
      ctx.beginPath(); ctx.arc(pt.x, pt.y, lIdx === 3 ? 12 : (lIdx === 0 ? 7 : 6), 0, Math.PI * 2);
      if (lIdx === 0) ctx.fillStyle = "#06B6D4";
      else if (lIdx === 3) ctx.fillStyle = lastActivations.out >= 0.5 ? "#10B981" : "#F59E0B";
      else ctx.fillStyle = "#8B5CF6";
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 1.2; ctx.stroke();

      // Feature labels for inputs
      if (lIdx === 0) {
        ctx.font = "9px monospace"; ctx.fillStyle = "#E2E8F0"; ctx.textAlign = "right";
        ctx.fillText(FEATURE_LABELS[nIdx] || `F${nIdx}`, pt.x - 12, pt.y + 3);
      }
      if (lIdx === 3) {
        ctx.font = "bold 10px monospace"; ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "left";
        ctx.fillText(lastActivations.out >= 0.5 ? " ACTIVE" : " SLEEP", pt.x + 14, pt.y + 3);
      }
    });
  });
}

function initPresetButtons() {
  const btnRedundant = document.getElementById("wif-preset-redundant");
  const btnBoundary = document.getElementById("wif-preset-boundary");
  const btnLowBattery = document.getElementById("wif-preset-lowbattery");

  if (btnRedundant) btnRedundant.addEventListener("click", () => applyWhatIfPreset([0.9, 0.4, 8, 0.05, 0.85, 0.9, 0.1, 0.0]));
  if (btnBoundary) btnBoundary.addEventListener("click", () => applyWhatIfPreset([0.8, 0.8, 2, 0.85, 0.10, 0.2, 0.6, 0.0]));
  if (btnLowBattery) btnLowBattery.addEventListener("click", () => applyWhatIfPreset([0.1, 0.5, 5, 0.20, 0.60, 0.7, 0.2, 0.0]));
}

function applyWhatIfPreset(vals) {
  vals.forEach((v, i) => {
    whatIfValues[i] = v;
    const num = document.getElementById(`wif-num-${i}`), slider = document.getElementById(`wif-slider-${i}`);
    if (num) num.value = v;
    if (slider) slider.value = v;
  });
  computeWhatIfInference();
}

function initWhatIfSliders() {
  const container = document.getElementById("whatif-sliders-container");
  if (!container || !modelData) return;
  container.innerHTML = "";

  FEATURE_LABELS.forEach((name, idx) => {
    const row = document.createElement("div");
    row.className = "control-group";
    row.innerHTML = `
      <div class="control-label">
        <span>${name}</span>
        <input type="number" step="0.05" min="0" max="1" value="${whatIfValues[idx]}" class="form-input-number" id="wif-num-${idx}" />
      </div>
      <input type="range" min="0" max="1" step="0.05" value="${whatIfValues[idx]}" id="wif-slider-${idx}" />
    `;
    container.appendChild(row);

    const slider = row.querySelector("input[type='range']");
    const numIn = row.querySelector("input[type='number']");
    const syncVal = (val) => {
      const v = Math.max(0, Math.min(1, parseFloat(val) || 0));
      whatIfValues[idx] = v;
      if (slider) slider.value = v;
      if (numIn) numIn.value = v;
      computeWhatIfInference();
    };
    if (slider) slider.addEventListener("input", (e) => syncVal(e.target.value));
    if (numIn) numIn.addEventListener("input", (e) => syncVal(e.target.value));
  });

  computeWhatIfInference();
}

function computeWhatIfInference() {
  if (!modelData || !modelData.weights || !modelData.scaler) return;
  const { weights, biases, scaler } = modelData;
  if (!scaler.mean || !scaler.scale || !weights[0] || !biases[0]) return;

  let x = whatIfValues.map((v, i) => (v - (scaler.mean[i] || 0)) / (scaler.scale[i] || 1));

  let h1 = [];
  for (let j = 0; j < 16; j++) {
    let sum = biases[0][j] || 0;
    for (let i = 0; i < 8; i++) sum += (x[i] || 0) * ((weights[0][i] && weights[0][i][j]) || 0);
    h1.push(Math.max(0, sum));
  }

  let h2 = [];
  for (let j = 0; j < 8; j++) {
    let sum = (biases[1] && biases[1][j]) || 0;
    for (let i = 0; i < 16; i++) sum += h1[i] * ((weights[1][i] && weights[1][i][j]) || 0);
    h2.push(Math.max(0, sum));
  }

  let outSum = (biases[2] && biases[2][0]) || 0;
  for (let i = 0; i < 8; i++) outSum += h2[i] * ((weights[2][i] && weights[2][i][0]) || 0);
  const probActive = 1.0 / (1.0 + Math.exp(-outSum));

  lastActivations = { h1, h2, out: probActive };

  const probEl = document.getElementById("whatif-prob-val");
  const stateEl = document.getElementById("whatif-state-val");
  const explainEl = document.getElementById("whatif-explanation-text");

  if (probEl) probEl.textContent = `${(probActive * 100).toFixed(1)}%`;
  if (stateEl) {
    stateEl.textContent = probActive >= 0.5 ? "ACTIVE (1)" : "SLEEP (0)";
    stateEl.className = probActive >= 0.5 ? "status-emerald" : "status-amber";
  }

  if (explainEl) {
    if (probActive < 0.5) {
      explainEl.innerHTML = `<span style="color: var(--amber);"><b>SLEEP (0)</b>: High overlap redundancy detected (${(whatIfValues[4]*100).toFixed(0)}% OR). Sensor scheduled to sleep to conserve battery without coverage loss.</span>`;
    } else {
      explainEl.innerHTML = `<span style="color: var(--emerald);"><b>ACTIVE (1)</b>: Critical coverage contribution (${(whatIfValues[3]*100).toFixed(0)}% Unique CR). Sensor kept awake to prevent sensing holes.</span>`;
    }
  }

  drawNeuralNetDiagram(modelData);
}
