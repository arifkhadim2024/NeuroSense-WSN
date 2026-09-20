/**
 * API Client Module with Automatic Offline / Static Hosting Fallback.
 * Gracefully switches between live Flask API and precomputed static_data/*.json.
 */

const API_BASE = "/api";
const STATIC_BASE = "/static_data";
async function request(endpoint, options = {}, staticFallback = null) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Attempt fallback if available
  }

  // Static Fallback for Vercel / GitHub Pages
  if (staticFallback) {
    try {
      const res = await fetch(`${STATIC_BASE}/${staticFallback}`);
      if (res.ok) return await res.json();
    } catch (fallbackErr) {
      console.warn(`[API] Fallback failed for ${staticFallback}`);
    }
  }
  throw new Error(`API request failed for ${endpoint}`);
}

export const Api = {
  async fetchScenarios() {
    return await request("/scenarios", { method: "GET" }, "scenarios.json");
  },

  async deployNetwork(params) {
    return await request(
      "/deploy",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      },
      "initial_deploy.json"
    );
  },

  async fetchAnnModel() {
    return await request("/ann/model", { method: "GET" }, "ann_model.json");
  },

  async predictAnn(nodes, obstaclePreset = "none") {
    return await request("/ann/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodes, obstacle_preset: obstaclePreset })
    });
  },

  async runPhase1Schedule(nodes, method = "ann_guard", obstaclePreset = "none", sensingRadius = 15.0) {
    return await request("/phase1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nodes,
        method,
        obstacle_preset: obstaclePreset,
        sensing_radius: sensingRadius
      })
    });
  },

  async runSimulation(nodes, protocol = "ann_pso_hybrid", maxRounds = 3000, pathLossExp = 2.0, obstaclePreset = "none") {
    return await request("/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nodes,
        protocol,
        max_rounds: maxRounds,
        path_loss_exp: pathLossExp,
        obstacle_preset: obstaclePreset
      })
    });
  },

  async fetchBenchmarks(maxRounds = 3000) {
    return await request("/benchmark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ max_rounds: maxRounds })
    }, "benchmark.json");
  },

  async fetchSourceCode(filename) {
    try {
      const res = await fetch(`${API_BASE}/source/${filename}`);
      if (res.ok) return await res.text();
    } catch (err) {
      console.warn(`Could not load live source for ${filename}`);
    }
    return `# Source code for ${filename} (live server needed for full module view)`;
  }
};
