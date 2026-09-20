/**
 * Benchmark and Ablation Data Tables Module.
 * Displays Phase 1 ablation results, Phase 2 routing comparisons, and Live Session Outputs.
 */

import { State } from "./state.js";
import { Api } from "./api.js";

const PROTOCOL_DISPLAY_NAMES = {
  leach: "LEACH Protocol",
  pegasis: "PEGASIS Protocol",
  hybrid: "Hybrid LEACH-PEGASIS",
  pso_hybrid: "PSO-Hybrid",
  ann_pso_hybrid: "ANN + PSO-Hybrid (Proposed)"
};

const PROTOCOL_BADGE_CLASSES = {
  leach: "status-rose",
  pegasis: "status-amber",
  hybrid: "status-amber",
  pso_hybrid: "status-cyan",
  ann_pso_hybrid: "status-emerald"
};

const liveSessionRuns = {};

export async function initTables(maxRounds = 3000) {
  State.subscribe((event, data) => {
    if (event === "simulation_updated" && data) {
      recordLiveSimulationResult(data);
    }
  });

  try {
    const data = await Api.fetchBenchmarks(maxRounds);
    State.ablationTable = data.ablation_table || [];
    State.protocolTable = data.protocol_table || [];
    const configSummary = data.config_summary || `N=50, Rs=15m, α=2.0, seeds=5, rounds up to ${maxRounds}`;

    updateConfigSummaryHeaders(configSummary);
    renderAblationTable(State.ablationTable, maxRounds);
    renderProtocolTable(State.protocolTable, maxRounds);
    renderLiveSessionTable();
  } catch (err) {
    console.error("Failed to load benchmark tables:", err);
  }
}

export function resetLiveSessionRuns() {
  Object.keys(liveSessionRuns).forEach((k) => delete liveSessionRuns[k]);
  renderLiveSessionTable();
}

export function recordLiveSimulationResult(simData) {
  if (!simData || !simData.protocol) return;
  liveSessionRuns[simData.protocol] = simData;
  renderLiveSessionTable();
}

export function recordBatchSimulationResults(resultsMap) {
  if (!resultsMap) return;
  Object.entries(resultsMap).forEach(([k, v]) => {
    if (v) liveSessionRuns[k] = v;
  });
  renderLiveSessionTable();
}

export function renderLiveSessionTable() {
  const tbody = document.getElementById("live-session-table-body");
  const summaryEl = document.getElementById("live-session-summary");
  if (!tbody) return;

  const entries = Object.entries(liveSessionRuns);
  if (summaryEl) {
    summaryEl.textContent = `${entries.length} protocol run${entries.length === 1 ? '' : 's'} recorded live`;
  }

  if (entries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-secondary); padding: 1.25rem;">No live simulations computed in this session yet. Click <b>"Start Multi-Hop Routing"</b> or <b>"Compare All 5 Protocols"</b> to populate live outputs.</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  entries.forEach(([protoKey, res]) => {
    const tr = document.createElement("tr");
    tr.className = protoKey === "ann_pso_hybrid" ? "highlight-row active-row" : "";
    const pName = PROTOCOL_DISPLAY_NAMES[protoKey] || protoKey.toUpperCase();
    const badgeClass = PROTOCOL_BADGE_CLASSES[protoKey] || "status-muted";

    const rounds = res.rounds_completed || (res.history ? res.history.rounds.length : 0);
    const fndStr = res.fnd ? `Round ${res.fnd}` : `<span class="text-muted">not reached (> ${rounds})</span>`;
    const hndStr = res.hnd ? `Round ${res.hnd}` : `<span class="text-muted">not reached (> ${rounds})</span>`;
    const pkts = res.total_packets_delivered !== undefined ? res.total_packets_delivered : (res.history?.packets?.slice(-1)[0] || 0);
    const energyLeft = res.final_total_energy !== undefined ? res.final_total_energy.toFixed(3) : (res.history?.energy?.slice(-1)[0] || 0).toFixed(3);
    const pktsPerJ = res.packets_per_joule !== undefined ? res.packets_per_joule : (res.total_energy_spent > 0 ? (pkts / res.total_energy_spent).toFixed(1) : '-');
    const elapsedSec = res.elapsed_seconds !== undefined ? `${res.elapsed_seconds.toFixed(2)}s` : `${Math.round(res.elapsed_ms || 0)}ms`;

    let assessment = "Computed successfully";
    if (protoKey === "ann_pso_hybrid") assessment = "Ultra-low power • Extended sensor lifetime";
    else if (protoKey === "pso_hybrid") assessment = "High packet throughput • Continuous active mesh";
    else if (protoKey === "leach") assessment = "Cluster head rotation • Rapid battery depletion";
    else if (protoKey === "pegasis") assessment = "Linear chain relay • Leader bottleneck";
    else if (protoKey === "hybrid") assessment = "Intra-cluster daisy chain aggregation";

    tr.innerHTML = `
      <td><b>${pName}</b></td>
      <td>${rounds} Rnds</td>
      <td>${fndStr}</td>
      <td>${hndStr}</td>
      <td><b>${Number(pkts).toLocaleString()} pkts</b></td>
      <td>${energyLeft} J</td>
      <td><b>${pktsPerJ} pkts/J</b></td>
      <td>${elapsedSec}</td>
      <td><span class="${badgeClass}">${assessment}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function updateConfigSummaryHeaders(summary) {
  const ablHeader = document.getElementById("ablation-config-summary");
  if (ablHeader) ablHeader.textContent = summary;
  const protoHeader = document.getElementById("protocol-config-summary");
  if (protoHeader) protoHeader.textContent = summary;
}

function formatRoundVal(val, std, maxRounds) {
  if (val === null || val === undefined) return `<span class="text-muted">not reached (> ${maxRounds})</span>`;
  return `Round ${Math.round(val)}${std ? ` ± ${Math.round(std)}` : ''}`;
}

function renderAblationTable(rows, maxRounds = 3000) {
  const tbody = document.getElementById("ablation-table-body");
  if (!tbody || !rows || !rows.length) return;
  tbody.innerHTML = "";

  rows.forEach((r) => {
    const tr = document.createElement("tr");
    tr.className = r.key === "ann_guard" ? "highlight-row active-row" : "";
    tr.innerHTML = `
      <td><b>${r.name}</b></td>
      <td>${r.active_pct_mean}% ± ${r.active_pct_std}%</td>
      <td>${r.coverage_mean}% ± ${r.coverage_std}%</td>
      <td>${r.overlap_mean}% ± ${r.overlap_std}%</td>
      <td>${formatRoundVal(r.fnd_mean, r.fnd_std, maxRounds)}</td>
      <td>${formatRoundVal(r.hnd_mean, r.hnd_std, maxRounds)}</td>
      <td>${r.packets_per_joule || '-'} pkts/J</td>
      <td>${r.runtime_ms_mean} ms</td>
      <td><span class="${r.badge_class}">${r.assessment}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderProtocolTable(rows, maxRounds = 3000) {
  const tbody = document.getElementById("protocol-table-body");
  if (!tbody || !rows || !rows.length) return;
  tbody.innerHTML = "";

  rows.forEach((r) => {
    const tr = document.createElement("tr");
    tr.className = r.key === "ann_pso_hybrid" ? "highlight-row active-row" : "";
    tr.innerHTML = `
      <td><b>${r.name}</b></td>
      <td>${formatRoundVal(r.fnd_mean, r.fnd_std, maxRounds)}</td>
      <td>${formatRoundVal(r.hnd_mean, r.hnd_std, maxRounds)}</td>
      <td>${formatRoundVal(r.lnd_mean, r.lnd_std, maxRounds)}</td>
      <td>${Number(r.packets_mean).toLocaleString()} pkts</td>
      <td><b>${r.packets_per_joule || '-'} pkts/J</b></td>
      <td>${r.runtime_s_mean} s</td>
      <td><span class="${r.badge_class}">${r.assessment}</span></td>
    `;
    tbody.appendChild(tr);
  });
}
