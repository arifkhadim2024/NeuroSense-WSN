/**
 * NeuroSense-WSN v2 Master Initialization Script.
 * Orchestrates navigation tabs, 3D field, ANN lab, benchmark telemetry, and tables.
 */

import { State } from "./state.js";
import { init3DField } from "./field3d.js";
import { initControlPanels, triggerDeployment } from "./panels.js";
import { initHeatmapAndVoronoi, refreshVoronoiView } from "./heatmap.js";
import { initAnnLab } from "./annlab.js";
import { initCharts, resizeAllCharts } from "./charts.js";
import { initTables } from "./tables.js";
import { initSourceViewer } from "./sourceviewer.js";
import { initExport } from "./export.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("NeuroSense-WSN v2 Laboratory Initializing...");

  setupNavigationTabs();
  init3DShadingListeners();

  try { init3DField("threejs-canvas-container"); } catch (e) { console.error("3D init error:", e); }
  try { initControlPanels(); } catch (e) { console.error("Control panels init error:", e); }
  try { initHeatmapAndVoronoi(); } catch (e) { console.error("Heatmap init error:", e); }
  try { initAnnLab(); } catch (e) { console.error("ANN Lab init error:", e); }
  try { initCharts(); } catch (e) { console.error("Charts init error:", e); }
  try { initTables(); } catch (e) { console.error("Tables init error:", e); }
  try { initSourceViewer(); } catch (e) { console.error("Source viewer init error:", e); }
  try { initExport(); } catch (e) { console.error("Export init error:", e); }

  // Deploy initial scenario
  await triggerDeployment();
});

function setupNavigationTabs() {
  const tabs = document.querySelectorAll(".nav-tab-btn");
  const views = document.querySelectorAll(".tab-view");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetTab = tab.getAttribute("data-tab");
      tabs.forEach((t) => t.classList.remove("active"));
      views.forEach((v) => v.classList.remove("active"));

      tab.classList.add("active");
      const activeView = document.getElementById(`view-${targetTab}`);
      if (activeView) activeView.classList.add("active");

      State.activeTab = targetTab;
      if (targetTab === "2d-grid") {
        setTimeout(() => refreshVoronoiView(), 50);
      } else if (targetTab === "routing") {
        setTimeout(() => resizeAllCharts(), 50);
        if (!State.protocolTable || !State.protocolTable.length) initTables();
      }
      init3DShadingListeners();
    });
  });
}

function init3DShadingListeners() {
  const cards = document.querySelectorAll(".canvas-card, .metric-card, .sim-sidebar, .playback-bar, .viewport-container, .cm-cell, .telemetry-strip");
  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
      card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
    });
  });
}
