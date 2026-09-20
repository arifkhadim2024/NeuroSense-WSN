"""
ANN Inference Engine and JSON Weights Export Module.
Exports the complete neural network architecture and parameters for browser visualization.
"""

from typing import List, Dict, Any, Tuple, Optional
import os
import json
import time
import joblib
import numpy as np
from src.config import NetworkConfig
from src.network import deploy_nodes
from src.ann.features import extract_node_features, FEATURE_NAMES
from src.ann.oracle import run_greedy_oracle
from src.ann.train import train_ann_model


def load_ann_artifacts(
    model_dir: str = "models"
) -> Tuple[Any, Any]:
    """Load serialized MLPClassifier and StandardScaler, training if missing."""
    model_path = os.path.join(model_dir, "ann_model.pkl")
    scaler_path = os.path.join(model_dir, "ann_scaler.pkl")

    if not os.path.exists(model_path) or not os.path.exists(scaler_path):
        train_ann_model(model_dir=model_dir)

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    return model, scaler


def predict_node_states(
    nodes: List[Dict[str, Any]],
    config: Optional[NetworkConfig] = None,
    obstacles: Optional[List[Dict[str, Any]]] = None,
    model: Optional[Any] = None,
    scaler: Optional[Any] = None
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, float]:
    """
    Predict ACTIVE (1) or SLEEP (0) state for each sensor node using the trained ANN.

    Args:
        nodes: List of sensor nodes.
        config: Network configuration.
        obstacles: Obstacles list.
        model: Optional pre-loaded MLPClassifier.
        scaler: Optional pre-loaded StandardScaler.

    Returns:
        Tuple of (binary predictions array, active probabilities array, raw features (N, 8), elapsed ms).
    """
    t0 = time.perf_counter()
    if config is None:
        config = NetworkConfig()

    if model is None or scaler is None:
        model, scaler = load_ann_artifacts()

    features = extract_node_features(
        nodes,
        area_size=config.area_size,
        sink_pos=config.sink_pos,
        grid_resolution=config.grid_resolution,
        obstacles=obstacles
    )

    if len(features) == 0:
        return np.array([]), np.array([]), np.empty((0, 8)), 0.0

    features_scaled = scaler.transform(features)
    probabilities = model.predict_proba(features_scaled)[:, 1]
    predictions = (probabilities >= 0.50).astype(int)
    elapsed_ms = (time.perf_counter() - t0) * 1000.0

    return predictions, probabilities, features, round(elapsed_ms, 2)


def export_ann_weights_json(
    model_dir: str = "models",
    output_json_path: str = "models/ann_weights.json"
) -> Dict[str, Any]:
    """
    Export neural network weights, biases, and metadata to JSON for the web frontend.

    Args:
        model_dir: Directory containing trained model artifacts.
        output_json_path: Output JSON destination.

    Returns:
        Dictionary of exported ANN model metadata.
    """
    model, scaler = load_ann_artifacts(model_dir)

    # 1. Extract layer weights and biases from scikit-learn MLPClassifier
    # coefs_ has [ (8, 16), (16, 8), (8, 1) ]
    # intercepts_ has [ (16,), (8,), (1,) ]
    weights = [w.tolist() for w in model.coefs_]
    biases = [b.tolist() for b in model.intercepts_]
    layer_sizes = [model.coefs_[0].shape[0]] + list(model.hidden_layer_sizes) + [1]

    # 2. Measure real Oracle vs ANN execution speedup over test runs
    oracle_times = []
    ann_times = []
    test_cfg = NetworkConfig(num_nodes=50)

    for s in [5001, 5002, 5003]:
        t_nodes = deploy_nodes(test_cfg, seed=s)
        _, t_oracle, _, _ = run_greedy_oracle(t_nodes, grid_resolution=2.0)
        _, _, _, t_ann = predict_node_states(t_nodes, test_cfg, model=model, scaler=scaler)
        oracle_times.append(t_oracle)
        ann_times.append(t_ann)

    avg_oracle_ms = round(float(np.mean(oracle_times)), 2)
    avg_ann_ms = round(float(np.mean(ann_times)), 2)
    speedup = round(avg_oracle_ms / max(0.01, avg_ann_ms), 1)

    # Re-train to retrieve fresh test evaluation dictionary
    eval_results = train_ann_model(model_dir=model_dir)

    export_data = {
        "layer_sizes": layer_sizes,
        "feature_names": FEATURE_NAMES,
        "weights": weights,
        "biases": biases,
        "scaler": {
            "mean": [round(float(m), 5) for m in scaler.mean_],
            "scale": [round(float(s), 5) for s in scaler.scale_]
        },
        "metrics": eval_results["metrics"],
        "importances": eval_results["importances"],
        "baselines": eval_results["baselines"],
        "speedup": {
            "oracle_avg_ms": avg_oracle_ms,
            "ann_avg_ms": avg_ann_ms,
            "speedup_factor": speedup
        }
    }

    os.makedirs(os.path.dirname(output_json_path), exist_ok=True)
    with open(output_json_path, "w") as f:
        json.dump(export_data, f, indent=2)

    print(f"Exported ANN weights and metadata to {output_json_path}")
    print(f"Speedup: Oracle = {avg_oracle_ms}ms vs ANN = {avg_ann_ms}ms ({speedup}x speedup)")
    return export_data


if __name__ == "__main__":
    export_ann_weights_json()
