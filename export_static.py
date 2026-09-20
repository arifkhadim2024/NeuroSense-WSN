"""
Static Data Precomputation and Export Script.
Precomputes scenarios, model metadata, and benchmark results to static_data/*.json for static hosting.
"""

import os
import json
from src.config import NetworkConfig, SCENARIO_PRESETS
from src.network import deploy_nodes
from src.coverage import calculate_coverage_metrics
from src.voronoi import compute_bounded_voronoi
from src.faults import OBSTACLE_PRESETS, JAMMER_PRESETS, POI_PRESETS
from src.ann.infer import export_ann_weights_json
from src.benchmark import run_phase1_ablation, run_protocol_benchmark


def export_all_static_data(output_dir: str = "static_data") -> None:
    """
    Precalculate and serialize all datasets required for offline / static web hosting.
    """
    os.makedirs(output_dir, exist_ok=True)
    print("Precomputing static datasets for offline deployment...")

    # 1. Export Scenarios & Fault presets
    scenarios_data = {
        "scenarios": SCENARIO_PRESETS,
        "obstacles": OBSTACLE_PRESETS,
        "jammers": JAMMER_PRESETS,
        "pois": POI_PRESETS
    }
    with open(os.path.join(output_dir, "scenarios.json"), "w") as f:
        json.dump(scenarios_data, f, indent=2)

    # 2. Export Standard Scenario 2 initial deployment
    cfg = NetworkConfig(num_nodes=50, sensing_radius=15.0, comm_radius=30.0)
    nodes = deploy_nodes(cfg, seed=42)
    cov_m = calculate_coverage_metrics(nodes, area_size=cfg.area_size, grid_resolution=cfg.grid_resolution)
    vor_cells = compute_bounded_voronoi(nodes, area_size=cfg.area_size)

    deploy_data = {
        "nodes": nodes,
        "coverage": cov_m,
        "voronoi": vor_cells,
        "obstacles": [],
        "seed": 42
    }
    with open(os.path.join(output_dir, "initial_deploy.json"), "w") as f:
        json.dump(deploy_data, f, indent=2)

    # 3. Export ANN weights & metrics
    ann_data = export_ann_weights_json(output_json_path=os.path.join(output_dir, "ann_model.json"))

    # 4. Export Multi-Seed Benchmarks & Ablation Table
    print("Running multi-seed benchmarks for static cache...")
    ablation = run_phase1_ablation()
    protocols = run_protocol_benchmark()
    bench_data = {
        "ablation_table": ablation,
        "protocol_table": protocols
    }
    with open(os.path.join(output_dir, "benchmark.json"), "w") as f:
        json.dump(bench_data, f, indent=2)

    print(f"Successfully exported all static datasets to '{output_dir}/'")

    # Also mirror into web/static_data for direct static edge hosting
    web_static_dir = os.path.join("web", "static_data")
    if output_dir != web_static_dir:
        os.makedirs(web_static_dir, exist_ok=True)
        import shutil
        for filename in ["scenarios.json", "initial_deploy.json", "ann_model.json", "benchmark.json"]:
            src_f = os.path.join(output_dir, filename)
            dst_f = os.path.join(web_static_dir, filename)
            if os.path.exists(src_f):
                shutil.copy2(src_f, dst_f)
        print(f"Successfully mirrored static datasets to '{web_static_dir}/'")


if __name__ == "__main__":
    export_all_static_data()
