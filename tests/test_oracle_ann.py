"""
Unit Tests for Feature Extraction, Oracle Optimizer, ANN Training, and Coverage Guard.
"""

import pytest
import os
import numpy as np
from src.config import NetworkConfig, SimConfig
from src.network import deploy_nodes
from src.ann.features import extract_node_features, FEATURE_NAMES
from src.ann.oracle import run_greedy_oracle
from src.ann.train import train_ann_model
from src.ann.infer import predict_node_states, export_ann_weights_json
from src.scheduler import schedule_nodes


def test_feature_extraction_shape_and_ranges():
    """Verify that feature extraction extracts 8 normalized features per node."""
    cfg = NetworkConfig(num_nodes=30)
    nodes = deploy_nodes(cfg, seed=42)
    feats = extract_node_features(nodes, area_size=cfg.area_size, sink_pos=cfg.sink_pos)

    assert feats.shape == (30, len(FEATURE_NAMES))
    # Check energy ratio in [0, 1]
    assert np.all((feats[:, 0] >= 0.0) & (feats[:, 0] <= 1.0))
    # Check normalized sink distance in [0, 1]
    assert np.all((feats[:, 1] >= 0.0) & (feats[:, 1] <= 1.0))
    # Check overlap ratio in [0, 1]
    assert np.all((feats[:, 4] >= 0.0) & (feats[:, 4] <= 1.0))


def test_greedy_oracle_coverage_preservation():
    """Verify that greedy oracle preserves coverage within epsilon while reducing active nodes."""
    cfg = NetworkConfig(num_nodes=40, sensing_radius=15.0)
    nodes = deploy_nodes(cfg, seed=101)
    labels, _, init_m, final_m = run_greedy_oracle(
        nodes,
        area_size=cfg.area_size,
        grid_resolution=2.0,
        coverage_epsilon=1.0
    )

    assert len(labels) == 40
    # Final coverage must be at least baseline coverage - 1.0%
    assert final_m["coverage"] >= (init_m["coverage"] - 1.0)
    # Active nodes should be reduced or equal
    assert final_m["active_nodes"] <= init_m["active_nodes"]


def test_coverage_guard_safety_net():
    """Verify that coverage guard wakes sleeping nodes if coverage drops below threshold."""
    sim_cfg = SimConfig(coverage_epsilon=1.0)
    sim_cfg.network.num_nodes = 50
    nodes = deploy_nodes(sim_cfg.network, seed=777)

    updated_nodes, telemetry = schedule_nodes(
        nodes,
        method="ann_guard",
        config=sim_cfg
    )

    # Telemetry should confirm coverage is preserved within epsilon of baseline
    assert telemetry["coverage_ratio"] >= (telemetry["baseline_coverage"] - 1.05)
    assert telemetry["active_count"] > 0
