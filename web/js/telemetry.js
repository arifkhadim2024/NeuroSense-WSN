/**
 * Real-time HUD KPIs, Telemetry Strip, and Toast Notification Utilities.
 */

import { State } from "./state.js";

let initialCoverage = null;

export function setInitialCoverage(cov) {
  initialCoverage = cov;
}

export function updateLiveKpis(frame) {
  if (!frame) return;
  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setTxt("hud-coverage", `${frame.coverage}%`);
  setTxt("hud-overlap", `${frame.overlap}%`);
  setTxt("hud-holes", `${frame.blindspot}%`);
  setTxt("hud-multiplicity", `${frame.multiplicity}x`);
  setTxt("hud-packets", `${frame.packets_total || 0}`);

  if (initialCoverage) {
    const delta = frame.coverage - initialCoverage.coverage_ratio;
    const deltaEl = document.getElementById("hud-coverage-delta");
    if (deltaEl) {
      deltaEl.textContent = `${delta >= 0 ? '▲ +' : '▼ '}${delta.toFixed(1)}% from R0`;
      deltaEl.style.color = delta >= 0 ? "var(--emerald)" : "var(--rose)";
    }
  }
}

export function updateLiveTelemetry(frame, currIdx, totalFrames) {
  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setTxt("telemetry-round", `Round ${frame.round} / ${totalFrames}`);
  setTxt("telemetry-alive", `${frame.alive}/${State.numNodes} (${frame.active} act, ${frame.sleeping} slp, ${frame.dead} dead)`);
  setTxt("telemetry-energy", `${(frame.energy_total_left || 0).toFixed(4)} J`);
  setTxt("telemetry-energy-round", `${(frame.energy_round || 0).toFixed(4)} J`);
  setTxt("telemetry-packets", `${frame.packets_total} pkts (${frame.packets_round} this round)`);
}

export function showToast(msg) {
  const toast = document.getElementById("app-toast");
  if (!toast) return;
  toast.textContent = msg; toast.style.display = "block";
  setTimeout(() => { toast.style.display = "none"; }, 3000);
}
