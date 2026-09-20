/**
 * Research Data and Publication Snapshot Export Module.
 * Generates downloadable CSV datasets, JSON telemetry, and canvas PNG figures.
 */

import { State } from "./state.js";
import { showToast } from "./telemetry.js";

export function initExport() {
  const btnExportMenu = document.getElementById("btn-export-menu");
  const exportDropdown = document.getElementById("export-dropdown-menu");

  if (btnExportMenu && exportDropdown) {
    btnExportMenu.addEventListener("click", (e) => {
      e.stopPropagation();
      exportDropdown.classList.toggle("show");
    });
    document.addEventListener("click", () => exportDropdown.classList.remove("show"));
  }

  bindExportBtn("btn-export-csv", exportTopologyCsv);
  bindExportBtn("btn-export-json", exportTelemetryJson);
  bindExportBtn("btn-export-snapshot", exportCanvasSnapshot);
}

function bindExportBtn(id, fn) {
  const btn = document.getElementById(id);
  if (btn) btn.addEventListener("click", fn);
}

function exportTopologyCsv() {
  const nodes = State.nodes;
  if (!nodes || nodes.length === 0) {
    showToast("No nodes deployed to export.");
    return;
  }

  let csv = "node_id,x_coord,y_coord,initial_energy_j,residual_energy_j,node_type,state,role\n";
  nodes.forEach((n) => {
    csv += `${n.id},${n.x},${n.y},${n.initial_energy || 0.5},${n.energy},${n.type || "normal"},${n.state},${n.role}\n`;
  });

  downloadFile(csv, "wsn_topology_dataset.csv", "text/csv");
  showToast("Exported Topology Dataset (.CSV)");
}

function exportTelemetryJson() {
  const data = {
    scenario_id: State.scenarioId,
    num_nodes: State.numNodes,
    sensing_radius: State.sensingRadius,
    comm_radius: State.commRadius,
    coverage: State.coverage,
    nodes: State.nodes,
    ann_model: State.annModel ? State.annModel.metrics : null
  };

  const jsonStr = JSON.stringify(data, null, 2);
  downloadFile(jsonStr, "wsn_telemetry_metrics.json", "application/json");
  showToast("Exported Telemetry Data (.JSON)");
}

function exportCanvasSnapshot() {
  const canvas = document.querySelector("#threejs-canvas-container canvas") || document.getElementById("heatmap-canvas");
  if (!canvas) return;

  const imageUri = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = imageUri;
  a.download = "neurosense_wsn_figure.png";
  a.click();
  showToast("Downloaded Hi-Res Publication Figure (.PNG)");
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
