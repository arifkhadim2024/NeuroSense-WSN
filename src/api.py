"""
Flask REST API Endpoints Module.
Provides lightweight JSON endpoints for the plain JavaScript frontend.
"""

from typing import Dict, Any
import os
import json
from flask import Blueprint, request, jsonify, Response
from src.config import NetworkConfig, SimConfig, SCENARIO_PRESETS
from src.network import deploy_nodes
from src.coverage import calculate_coverage_metrics
from src.voronoi import compute_bounded_voronoi
from src.faults import OBSTACLE_PRESETS, JAMMER_PRESETS, POI_PRESETS
from src.ann.infer import predict_node_states, export_ann_weights_json
from src.ann.train import train_ann_model
from src.scheduler import schedule_nodes
from src.simulator import run_simulation
from src.benchmark import run_phase1_ablation, run_protocol_benchmark

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

api_bp = Blueprint("api", __name__, url_prefix="/api")


@api_bp.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint for Vercel / server monitoring."""
    return jsonify({
        "status": "ok",
        "service": "NeuroSense-WSN API",
        "version": "2.0.0"
    })


@api_bp.route("/scenarios", methods=["GET"])
def get_scenarios():
    """Return all benchmark deployment and obstacle presets."""
    return jsonify({
        "scenarios": SCENARIO_PRESETS,
        "obstacles": {k: v for k, v in OBSTACLE_PRESETS.items()},
        "jammers": {k: v for k, v in JAMMER_PRESETS.items()},
        "pois": {k: v for k, v in POI_PRESETS.items()}
    })


@api_bp.route("/deploy", methods=["POST"])
def deploy():
    """Deploy sensor nodes given network configuration parameters."""
    data = request.get_json() or {}
    cfg = NetworkConfig(
        num_nodes=int(data.get("num_nodes", 50)),
        sensing_radius=float(data.get("sensing_radius", 15.0)),
        comm_radius=float(data.get("comm_radius", 30.0)),
        deployment_type=str(data.get("deployment_type", "random"))
    )
    seed = int(data.get("seed", 42))
    obs_key = str(data.get("obstacle_preset", "none"))
    obstacles = OBSTACLE_PRESETS.get(obs_key, [])

    nodes = deploy_nodes(cfg, seed=seed)
    coverage_m = calculate_coverage_metrics(
        nodes,
        area_size=cfg.area_size,
        grid_resolution=cfg.grid_resolution,
        only_active=True
    )
    voronoi_cells = compute_bounded_voronoi(nodes, area_size=cfg.area_size)

    return jsonify({
        "nodes": nodes,
        "coverage": coverage_m,
        "voronoi": voronoi_cells,
        "obstacles": obstacles,
        "seed": seed
    })


@api_bp.route("/ann/model", methods=["GET"])
def get_ann_model():
    """Return exported ANN model weights, metrics, and architecture."""
    weights_path = os.path.join(BASE_DIR, "models", "ann_weights.json")
    if not os.path.exists(weights_path):
        export_ann_weights_json()
    with open(weights_path, "r") as f:
        data = json.load(f)
    return jsonify(data)


@api_bp.route("/ann/train", methods=["POST"])
def retrain_ann():
    """Trigger ANN retraining and return updated metrics."""
    res = train_ann_model()
    export_ann_weights_json()
    return jsonify(res)


@api_bp.route("/ann/predict", methods=["POST"])
def predict():
    """Predict ACTIVE/SLEEP state and probabilities for provided nodes."""
    data = request.get_json() or {}
    nodes = data.get("nodes", [])
    obs_key = data.get("obstacle_preset", "none")
    obstacles = OBSTACLE_PRESETS.get(obs_key, [])

    preds, probs, feats, elapsed_ms = predict_node_states(nodes, obstacles=obstacles)
    return jsonify({
        "predictions": preds.tolist(),
        "probabilities": [round(float(p), 4) for p in probs],
        "features": feats.tolist(),
        "elapsed_ms": elapsed_ms
    })


@api_bp.route("/phase1", methods=["POST"])
def run_phase1():
    """Execute sleep scheduling algorithm on current nodes."""
    data = request.get_json() or {}
    nodes = data.get("nodes", [])
    method = str(data.get("method", "ann_guard"))
    obs_key = str(data.get("obstacle_preset", "none"))
    obstacles = OBSTACLE_PRESETS.get(obs_key, [])

    sim_cfg = SimConfig()
    sim_cfg.network.num_nodes = len(nodes)
    if "sensing_radius" in data:
        sim_cfg.network.sensing_radius = float(data["sensing_radius"])

    updated_nodes, telemetry = schedule_nodes(
        nodes,
        method=method,
        config=sim_cfg,
        obstacles=obstacles
    )
    voronoi_cells = compute_bounded_voronoi(updated_nodes, area_size=sim_cfg.network.area_size)

    return jsonify({
        "nodes": updated_nodes,
        "telemetry": telemetry,
        "voronoi": voronoi_cells
    })


@api_bp.route("/simulate", methods=["POST"])
def simulate():
    """Run full lifecycle simulation for a protocol."""
    data = request.get_json() or {}
    nodes = data.get("nodes", [])
    protocol = str(data.get("protocol", "ann_pso_hybrid"))
    max_rounds = int(data.get("max_rounds", 3000))
    obs_key = str(data.get("obstacle_preset", "none"))
    obstacles = OBSTACLE_PRESETS.get(obs_key, [])

    sim_cfg = SimConfig(max_rounds=max_rounds)
    sim_cfg.network.num_nodes = len(nodes)
    if "path_loss_exp" in data:
        sim_cfg.radio.path_loss_exp = float(data["path_loss_exp"])

    results = run_simulation(
        nodes,
        protocol=protocol,
        config=sim_cfg,
        obstacles=obstacles,
        max_rounds=max_rounds
    )
    return jsonify(results)


@api_bp.route("/benchmark", methods=["POST"])
def benchmark():
    """Execute multi-seed Phase 1 ablation and protocol benchmark."""
    data = request.get_json() or {}
    max_rounds = int(data.get("max_rounds", 3000))
    force = bool(data.get("force", False))
    cache_path = os.path.join(BASE_DIR, "static_data", "benchmark.json")

    if not force and max_rounds == 3000 and os.path.exists(cache_path):
        with open(cache_path, "r") as f:
            return jsonify(json.load(f))

    cfg = SimConfig(max_rounds=max_rounds)
    ablation = run_phase1_ablation(config=cfg)
    protocols = run_protocol_benchmark(config=cfg)
    result = {
        "ablation_table": ablation,
        "protocol_table": protocols,
        "config_summary": f"N={cfg.network.num_nodes}, Rs={int(cfg.network.sensing_radius)}m, α={cfg.radio.path_loss_exp:.1f}, seeds=5, rounds up to {max_rounds}"
    }
    if max_rounds == 3000:
        try:
            with open(cache_path, "w") as f:
                json.dump(result, f, indent=2)
        except Exception:
            pass
    return jsonify(result)


@api_bp.route("/source/<path:filename>", methods=["GET"])
def get_source(filename: str):
    """Serve source code text for code viewer."""
    safe_files = {
        "config.py": "src/config.py",
        "network.py": "src/network.py",
        "radio.py": "src/radio.py",
        "coverage.py": "src/coverage.py",
        "voronoi.py": "src/voronoi.py",
        "faults.py": "src/faults.py",
        "scheduler.py": "src/scheduler.py",
        "features.py": "src/ann/features.py",
        "oracle.py": "src/ann/oracle.py",
        "train.py": "src/ann/train.py",
        "infer.py": "src/ann/infer.py",
        "leach.py": "src/routing/leach.py",
        "pegasis.py": "src/routing/pegasis.py",
        "hybrid.py": "src/routing/hybrid.py",
        "pso_hybrid.py": "src/routing/pso_hybrid.py",
        "simulator.py": "src/simulator.py",
        "benchmark.py": "src/benchmark.py"
    }
    rel_path = safe_files.get(filename)
    if not rel_path:
        return jsonify({"error": "File not found"}), 404

    file_path = os.path.join(BASE_DIR, rel_path)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    with open(file_path, "r") as f:
        code_text = f.read()
    return Response(code_text, mimetype="text/plain")
