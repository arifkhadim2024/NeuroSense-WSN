"""
Multi-Seed Synthetic Dataset Generator for ANN Imitation Learning.
Runs the greedy oracle over diverse network topologies to produce training data.
"""

from typing import Optional
import os
import pandas as pd
import numpy as np
from src.config import NetworkConfig
from src.network import deploy_nodes
from src.faults import OBSTACLE_PRESETS
from src.ann.features import extract_node_features, FEATURE_NAMES
from src.ann.oracle import run_greedy_oracle


def build_ann_dataset(
    num_deployments: int = 200,
    start_seed: int = 1000,
    output_csv_path: str = "data/ann_training_data.csv"
) -> pd.DataFrame:
    """
    Generate diverse multi-seed WSN deployments and compute features with true oracle labels.

    Args:
        num_deployments: Number of distinct topology deployments (>= 200).
        start_seed: Base random seed for reproducibility.
        output_csv_path: Output CSV file path.

    Returns:
        Pandas DataFrame containing features, deployment seed, node ID, and label.
    """
    os.makedirs(os.path.dirname(output_csv_path), exist_ok=True)
    records = []

    node_counts = [30, 50, 80, 100]
    sensing_radii = [10.0, 12.0, 15.0]
    dep_types = ["random", "clustered", "grid"]
    obs_keys = ["none", "central-lake", "dual-walls", "corner-zones"]

    print(f"Generating dataset across {num_deployments} deployments...")

    for i in range(num_deployments):
        seed = start_seed + i
        n = node_counts[i % len(node_counts)]
        rs = sensing_radii[i % len(sensing_radii)]
        rc = 2.0 * rs
        dep_type = dep_types[i % len(dep_types)]
        obs_key = obs_keys[i % len(obs_keys)]
        obstacles = OBSTACLE_PRESETS[obs_key]

        cfg = NetworkConfig(
            num_nodes=n,
            sensing_radius=rs,
            comm_radius=rc,
            deployment_type=dep_type
        )
        nodes = deploy_nodes(cfg, seed=seed)

        # 1. Extract 8 features per node
        features = extract_node_features(
            nodes,
            area_size=cfg.area_size,
            sink_pos=cfg.sink_pos,
            grid_resolution=2.0,
            obstacles=obstacles
        )

        # 2. Run greedy oracle to obtain ground-truth ACTIVE/SLEEP labels
        labels, _, _, _ = run_greedy_oracle(
            nodes,
            area_size=cfg.area_size,
            grid_resolution=2.0,
            coverage_epsilon=1.0
        )

        for node_idx, node in enumerate(nodes):
            row_dict = {
                "seed": seed,
                "node_id": node["id"],
                "node_count": n,
                "sensing_radius": rs,
                "deployment_type": dep_type,
                "obstacle_preset": obs_key,
                "label": int(labels[node_idx])
            }
            for feat_idx, feat_name in enumerate(FEATURE_NAMES):
                row_dict[feat_name] = float(features[node_idx, feat_idx])
            records.append(row_dict)

    df = pd.DataFrame(records)
    df.to_csv(output_csv_path, index=False)
    print(f"Dataset generated with {len(df)} samples across {num_deployments} seeds.")
    print(f"Class distribution: Active (1) = {sum(df['label'] == 1)}, Sleep (0) = {sum(df['label'] == 0)}")
    return df


if __name__ == "__main__":
    build_ann_dataset(num_deployments=200, start_seed=1000)
