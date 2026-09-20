/**
 * Scenario Control Panel, Unified Playback HUD, and Simulation Actions Module.
 * Connects sidebar buttons and player bar to ONE unified state machine.
 */

import { State } from "./state.js";
import { Api } from "./api.js";
import { sound } from "./sound.js";
import { player } from "./player.js";
import { renderNodes, renderFrame, renderObstaclesAndJammers, setCameraView, toggleOrbitCam, toggleSensingBubbles, updateLayerVisibility } from "./field3d.js";
import { loadFullSimulationCharts, overlayAllProtocolsComparison, resetChartsHistory } from "./charts.js";
import { recordLiveSimulationResult, recordBatchSimulationResults, resetLiveSessionRuns } from "./tables.js";
import { updateLiveKpis, updateLiveTelemetry, showToast, setInitialCoverage } from "./telemetry.js";
export { showToast };

export function initControlPanels() {
  initPlayerCallbacks(); initScenarioSelectors(); initSpatialTools();
  initCameraControls(); initSimulationActions(); initSoundHeaderControls(); initLayerToggles();
}

function initPlayerCallbacks() {
  player.onFrameCallback = (frame, currIdx, totalFrames) => {
    renderFrame(frame, State.routingProto);
    updateLiveTelemetry(frame, currIdx, totalFrames);
    updateLiveKpis(frame);
  };
  player.onStateCallback = (state, currIdx, totalFrames) => updateAllPlayerUI(state, currIdx, totalFrames);
  player.initKeyboardShortcuts();

  bindClick("btn-play-pause", () => (player.frames.length === 0 || player.loadedProtocol !== State.routingProto ? startRoutingSimulation() : player.togglePlay()));
  bindClick("btn-step-fwd", () => player.stepForward());
  bindClick("btn-step-bwd", () => player.stepBackward());
  bindClick("btn-stop-reset", () => handleResetDeployment());

  const scrubber = document.getElementById("timeline-slider");
  if (scrubber) scrubber.addEventListener("input", (e) => { player.pause(); player.jumpToRound(parseInt(e.target.value)); });

  document.querySelectorAll(".btn-speed").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn-speed").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      player.setSpeed(parseFloat(btn.dataset.speed));
    });
  });
}

function initLayerToggles() {
  ["links", "arrows", "packets", "disks", "labels"].forEach((layer) => {
    const chk = document.getElementById(`chk-layer-${layer}`);
    if (chk) chk.addEventListener("change", (e) => updateLayerVisibility(layer, e.target.checked));
  });
}

function initSoundHeaderControls() {
  const muteBtn = document.getElementById("btn-audio-toggle"), volSlider = document.getElementById("slider-volume");
  if (muteBtn) {
    muteBtn.addEventListener("click", () => {
      const isMuted = sound.toggleMute();
      muteBtn.classList.toggle("muted", isMuted);
      const txt = document.getElementById("audio-text");
      if (txt) txt.textContent = isMuted ? "Audio: Muted" : "Audio Feedback";
    });
  }
  if (volSlider) {
    volSlider.value = sound.volume * 100;
    volSlider.addEventListener("input", (e) => sound.setVolume(parseFloat(e.target.value) / 100));
  }
}

function initScenarioSelectors() {
  const selectPreset = document.getElementById("select-preset");
  if (selectPreset) {
    selectPreset.addEventListener("change", (e) => {
      const p = e.target.value; State.scenarioId = p;
      if (p === "s1") updateSliders(30, 10, 20, "random");
      else if (p === "s2") updateSliders(50, 15, 30, "random");
      else if (p === "s3") updateSliders(80, 12, 24, "clustered");
      else if (p === "s4") updateSliders(100, 15, 30, "grid");
      triggerDeployment();
    });
  }

  bindInputAndSlider("slider-nodes", "num-nodes-input", (v) => { State.numNodes = parseInt(v); triggerDeployment(); });
  bindInputAndSlider("slider-rs", "num-rs-input", (v) => {
    State.sensingRadius = parseFloat(v); State.commRadius = State.sensingRadius * 2;
    const rcNum = document.getElementById("num-rc-input"), rcSlider = document.getElementById("slider-rc");
    if (rcNum) rcNum.value = State.commRadius;
    if (rcSlider) rcSlider.value = State.commRadius;
    triggerDeployment();
  });
  bindInputAndSlider("slider-rc", "num-rc-input", (v) => { State.commRadius = parseFloat(v); });
  bindInputAndSlider("slider-path-loss", "num-path-loss-input", (v) => { State.pathLossExp = parseFloat(v); });
  
  const seedInput = document.getElementById("num-seed-input");
  if (seedInput) seedInput.addEventListener("change", (e) => { State.seed = parseInt(e.target.value) || 42; triggerDeployment(); });

  bindSelect("select-obstacle-preset", (v) => { State.obstaclePreset = v; renderObstaclesAndJammers(); triggerDeployment(); });
  bindSelect("select-jammer-preset", (v) => {
    State.jammerPreset = v; renderObstaclesAndJammers();
    document.getElementById("jammer-badge").textContent = v === "none" ? "Off" : "Active";
  });

  const syncProto = (v) => {
    State.routingProto = v; player.reset(); player.loadedProtocol = null;
    const startBtn = document.getElementById("btn-start-routing");
    if (startBtn) startBtn.innerHTML = `<span>Start ${v.toUpperCase()} Routing</span>`;
    const s1 = document.getElementById("select-routing-proto"), s2 = document.getElementById("select-benchmark-proto");
    if (s1 && s1.value !== v) s1.value = v;
    if (s2 && s2.value !== v) s2.value = v;
    const badge = document.getElementById("benchmark-active-proto-badge");
    if (badge) badge.textContent = `Active: ${v.toUpperCase()}`;
    showToast(`Selected protocol: ${v.toUpperCase()}`);
  };

  bindSelect("select-routing-proto", syncProto);
  bindSelect("select-benchmark-proto", syncProto);
}

function initSpatialTools() {
  ["inspect", "relocate", "inject", "delete"].forEach((tool) => {
    const btn = document.getElementById(`btn-tool-${tool}`);
    if (btn) {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tool-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        State.activeTool = tool; sound.click();
        showToast(`Spatial Tool: ${tool.toUpperCase()}`);
      });
    }
  });
}

function initCameraControls() {
  const setCamState = (aId) => ["btn-cam-iso", "btn-cam-top", "btn-cam-sink", "btn-cam-fit"].forEach(id => {
    const el = document.getElementById(id); if (el) el.classList.toggle("active", id === aId);
  });
  bindClick("btn-cam-iso", () => { setCameraView("iso"); setCamState("btn-cam-iso"); showToast("Camera: Stable Perspective"); });
  bindClick("btn-cam-top", () => { setCameraView("top"); setCamState("btn-cam-top"); showToast("Camera: Top-Down"); });
  bindClick("btn-cam-sink", () => { setCameraView("sink"); setCamState("btn-cam-sink"); showToast("Camera: Sink View"); });
  bindClick("btn-cam-fit", () => { setCameraView("fit"); setCamState("btn-cam-fit"); showToast("Camera: Centered View"); });
  bindClick("btn-toggle-orbit", () => {
    const isRot = toggleOrbitCam();
    if (isRot) { setCamState(""); showToast("Camera: 360° Continuous Rotation"); }
    else { setCamState("btn-cam-iso"); showToast("Camera: Stable View Locked"); }
  });
  bindClick("btn-toggle-bubbles", () => {
    const on = toggleSensingBubbles();
    const b = document.getElementById("btn-toggle-bubbles"); if (b) b.classList.toggle("active", on);
  });
}

export { runPhase1Scheduling, runCompareAllProtocols, startRoutingSimulation };

function initSimulationActions() {
  bindClick("btn-run-optimization", runPhase1Scheduling);
  bindClick("btn-start-routing", handleStartButtonClick);
  bindClick("btn-reset-deployment", handleResetDeployment);
  bindClick("btn-trigger-emp", triggerEmpBlast);
  bindClick("btn-compare-all", runCompareAllProtocols);
  bindClick("btn-benchmark-run-selected", () => {
    const bSel = document.getElementById("select-benchmark-proto");
    if (bSel) State.routingProto = bSel.value;
    startRoutingSimulation();
  });
  bindClick("btn-benchmark-compare-all", runCompareAllProtocols);
  bindClick("btn-benchmark-reset", handleResetDeployment);
}

function handleStartButtonClick() {
  if (player.state === "IDLE" || player.frames.length === 0 || player.loadedProtocol !== State.routingProto) {
    startRoutingSimulation();
  } else if (player.state === "PLAYING") player.pause();
  else if (player.state === "PAUSED") player.resume();
  else if (player.state === "FINISHED") { player.jumpToRound(1); player.play(); }
}

function handleResetDeployment() { resetChartsHistory(); resetLiveSessionRuns(); player.reset(); triggerDeployment(); }

export async function triggerDeployment() {
  player.reset(); showToast("Deploying sensor topology...");
  try {
    const res = await Api.deployNetwork({
      num_nodes: State.numNodes, sensing_radius: State.sensingRadius,
      comm_radius: State.commRadius, deployment_type: State.deploymentType,
      seed: State.seed, obstacle_preset: State.obstaclePreset
    });
    State.setNodes(res.nodes); State.setCoverage(res.coverage); setInitialCoverage(res.coverage);
    State.voronoiCells = res.voronoi || [];
    renderObstaclesAndJammers(); renderNodes();
    updateLiveKpis({ coverage: res.coverage.coverage_ratio, overlap: res.coverage.overlap_ratio, blindspot: res.coverage.blindspot_ratio, multiplicity: res.coverage.multiplicity, packets_total: 0 });
    showToast(`Deployed ${res.nodes.length} nodes (Coverage: ${res.coverage.coverage_ratio}%)`);
  } catch (err) {
    console.error("Deployment failed:", err); showToast(`Error: ${err.message}`);
  }
}

async function runPhase1Scheduling() {
  sound.phase1(); showToast("Executing Phase 1: ANN Sleep Scheduling + Coverage Guard...");
  try {
    const res = await Api.runPhase1Schedule(State.nodes, "ann_guard", State.obstaclePreset, State.sensingRadius);
    State.setNodes(res.nodes); State.setCoverage(res.telemetry);
    State.voronoiCells = res.voronoi || []; renderNodes();
    updateLiveKpis({ coverage: res.telemetry.coverage_ratio, overlap: res.telemetry.overlap_ratio, blindspot: res.telemetry.blindspot_ratio, multiplicity: res.telemetry.multiplicity, packets_total: 0 });
    showToast(`Phase 1: ${res.telemetry.active_count} Active, ${res.telemetry.sleep_count} Sleep (CR: ${res.telemetry.coverage_ratio}%)`);
  } catch (err) {
    console.error("Phase 1 failed:", err);
  }
}

async function startRoutingSimulation() {
  const proto = State.routingProto;
  const startBtn = document.getElementById("btn-start-routing"), benchBtn = document.getElementById("btn-benchmark-run-selected");
  if (startBtn) { startBtn.innerHTML = `<span>Computing ${proto.toUpperCase()}...</span>`; startBtn.disabled = true; }
  if (benchBtn) { benchBtn.innerHTML = `<span>Computing ${proto.toUpperCase()}...</span>`; benchBtn.disabled = true; }
  showToast(`Computing ${proto.toUpperCase()} Simulation...`);
  const t0 = performance.now();

  try {
    const maxR = parseInt(document.getElementById("select-max-rounds")?.value || "1000");
    const res = await Api.runSimulation(State.nodes, proto, maxR, State.pathLossExp, State.obstaclePreset);
    player.loadedProtocol = proto; player.lastApiStatus = '200 OK';
    player.lastApiTimeMs = Math.round(performance.now() - t0); player.lastError = null;

    State.setSimulationHistory(res); loadFullSimulationCharts(res); recordLiveSimulationResult(res);
    player.loadFrames(res.frames); player.play();
    showToast(`Calculated ${res.rounds_completed} rounds for ${proto.toUpperCase()} (${player.lastApiTimeMs}ms). Playing...`);
  } catch (err) {
    console.error("Simulation failed:", err); player.lastApiStatus = 'Error'; player.lastError = err.message;
    showToast(`Simulation Error: ${err.message}`);
  } finally {
    if (startBtn) { startBtn.disabled = false; startBtn.innerHTML = `<span>Start ${proto.toUpperCase()} Routing</span>`; }
    if (benchBtn) { benchBtn.disabled = false; benchBtn.innerHTML = `<span>▶ Run Selected Protocol</span>`; }
  }
}

async function runCompareAllProtocols() {
  showToast("Running All 5 Protocols for Benchmark Overlay...");
  const protos = ["leach", "pegasis", "hybrid", "pso_hybrid", "ann_pso_hybrid"];
  const maxR = parseInt(document.getElementById("select-max-rounds")?.value || "1000");
  const results = {};
  for (const p of protos) {
    try { results[p] = await Api.runSimulation(State.nodes, p, maxR, State.pathLossExp, State.obstaclePreset); }
    catch (e) { console.warn(`Compare failed for ${p}`, e); }
  }
  overlayAllProtocolsComparison(results, State.routingProto);
  recordBatchSimulationResults(results);
  showToast("Multi-Protocol Comparison Overlay Complete!");
}

function updateAllPlayerUI(state, currIdx, totalFrames) {
  const playBtn = document.getElementById("btn-play-pause"), startBtn = document.getElementById("btn-start-routing");
  const statusLabel = document.getElementById("player-status-label"), scrubber = document.getElementById("timeline-slider");
  const stepFwd = document.getElementById("btn-step-fwd"), stepBwd = document.getElementById("btn-step-bwd");
  const hasFrames = totalFrames > 0;
  if (stepFwd) stepFwd.disabled = !hasFrames;
  if (stepBwd) stepBwd.disabled = !hasFrames;

  const playIcons = {
    PLAYING: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg><span>Pause</span>',
    PAUSED: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>Resume</span>',
    FINISHED: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>Replay</span>',
    IDLE: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>Play</span>'
  };
  if (playBtn) playBtn.innerHTML = playIcons[state] || playIcons.IDLE;
  if (startBtn) startBtn.innerHTML = `<span>${state === "PLAYING" ? "Pause" : state === "PAUSED" ? "Resume" : state === "FINISHED" ? "Replay" : "Start"} ${State.routingProto.toUpperCase()} Routing</span>`;
  if (statusLabel) statusLabel.textContent = !hasFrames ? `No frames loaded — click Start ${State.routingProto.toUpperCase()} Routing` : `Round ${currIdx + 1} / ${totalFrames} — ${state}`;
  if (scrubber) { scrubber.disabled = !hasFrames; scrubber.min = hasFrames ? 1 : 0; scrubber.max = hasFrames ? totalFrames : 0; scrubber.value = hasFrames ? currIdx + 1 : 0; }
}

function triggerEmpBlast() {
  sound.playTone(150, 0.4, "sawtooth"); showToast("Regional EMP Shockwave Triggered! -85% battery in blast zone.");
  State.nodes.forEach((n) => {
    if (Math.hypot(n.x - 50, n.y - 50) <= 30 && n.state !== "DEAD") {
      n.energy = Math.max(0, n.energy * 0.15);
      if (n.energy <= 0) n.state = "DEAD";
    }
  });
  State.setNodes([...State.nodes]); renderNodes();
}

function updateSliders(n, rs, rc, depType) {
  State.numNodes = n; State.sensingRadius = rs; State.commRadius = rc; State.deploymentType = depType;
  const setV = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  setV("slider-nodes", n); setV("num-nodes-input", n);
  setV("slider-rs", rs); setV("num-rs-input", rs);
  setV("slider-rc", rc); setV("num-rc-input", rc);
}

function bindInputAndSlider(sliderId, inputId, cb) {
  const slider = document.getElementById(sliderId), numInput = document.getElementById(inputId);
  if (slider && numInput) {
    slider.addEventListener("input", (e) => { numInput.value = e.target.value; cb(e.target.value); });
    numInput.addEventListener("input", (e) => { slider.value = e.target.value; cb(e.target.value); });
  }
}
function bindSelect(id, cb) { const el = document.getElementById(id); if (el) el.addEventListener("change", (e) => cb(e.target.value)); }
function bindClick(id, cb) { const el = document.getElementById(id); if (el) el.addEventListener("click", cb); }
