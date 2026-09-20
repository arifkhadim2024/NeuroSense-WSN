"""
Sleep Scheduling Engine and Adaptive Coverage Guard.
Controls node sleep/wake duty cycles using baseline, heuristic, oracle, or ANN strategies.
"""

from typing import List, Dict, Any, Tuple, Optional
import time
import numpy as np
from src.config import NetworkConfig, SimConfig
from src.coverage import calculate_coverage_metrics, get_grid_points, compute_coverage_mask
from src.ann.oracle import run_greedy_oracle
from src.ann.infer import predict_node_states


def schedule_nodes(
    nodes: List[Dict[str, Any]],
    method: str = "ann_guard",
    config: Optional[SimConfig] = None,
    obstacles: Optional[List[Dict[str, Any]]] = None
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Apply a sleep scheduling algorithm to determine which sensor nodes remain ACTIVE vs SLEEP.

    Args:
        nodes: List of sensor nodes (modified in-place or copied).
        method: Scheduling strategy ('baseline', 'random', 'rule', 'greedy', 'ann', 'ann_guard').
        config: Simulation configuration.
        obstacles: Obstacles list.

    Returns:
        Tuple of (updated nodes list, telemetry dictionary).
    """
    t_start = time.perf_counter()
    if config is None:
        config = SimConfig()

    net_cfg = config.network
    alive_nodes = [n for n in nodes if n.get("energy", 0.0) > 0.0 and n.get("state") != "DEAD"]
    num_alive = len(alive_nodes)

    if num_alive == 0:
        return nodes, {
            "method": method, "active_count": 0, "sleep_count": 0,
            "coverage_ratio": 0.0, "overlap_ratio": 0.0, "guard_corrected_count": 0,
            "elapsed_ms": 0.0
        }

    grid_res = 2.0
    # 1. Baseline coverage with all alive nodes ACTIVE
    for n in alive_nodes:
        n["state"] = "ACTIVE"
    base_metrics = calculate_coverage_metrics(
        alive_nodes,
        area_size=net_cfg.area_size,
        grid_resolution=grid_res,
        only_active=True
    )
    cr_base = base_metrics["coverage_ratio"]
    cr_target = max(0.0, cr_base - config.coverage_epsilon)

    guard_corrected_count = 0
    predictions_prob: Optional[np.ndarray] = None

    # 2. Apply chosen scheduling strategy
    if method == "baseline":
        for n in alive_nodes:
            n["state"] = "ACTIVE"

    elif method == "random":
        rng = np.random.RandomState(config.seed)
        for n in alive_nodes:
            # 60% probability of remaining active
            n["state"] = "ACTIVE" if rng.rand() < 0.60 else "SLEEP"

    elif method == "rule":
        # Heuristic Rule: Node sleeps if it has >= 3 neighbors within Rs and energy <= local median
        coords = np.array([[n["x"], n["y"]] for n in alive_nodes])
        energies = np.array([n.get("energy", 0.5) for n in alive_nodes])
        diff = coords[:, None, :] - coords[None, :, :]
        dists = np.sqrt(np.sum(diff ** 2, axis=2))
        rs = net_cfg.sensing_radius
        for idx, n in enumerate(alive_nodes):
            neighbors = np.where((dists[idx] > 0) & (dists[idx] <= rs))[0]
            if len(neighbors) >= 3 and energies[idx] <= np.median(energies[neighbors]):
                n["state"] = "SLEEP"
            else:
                n["state"] = "ACTIVE"

    elif method == "greedy":
        labels, _, _, _ = run_greedy_oracle(
            alive_nodes,
            area_size=net_cfg.area_size,
            grid_resolution=grid_res,
            coverage_epsilon=config.coverage_epsilon
        )
        for idx, n in enumerate(alive_nodes):
            n["state"] = "ACTIVE" if labels[idx] == 1 else "SLEEP"

    elif method in ("ann", "ann_guard"):
        preds, probs, _, _ = predict_node_states(
            alive_nodes,
            config=net_cfg,
            obstacles=obstacles
        )
        predictions_prob = probs
        for idx, n in enumerate(alive_nodes):
            n["state"] = "ACTIVE" if preds[idx] == 1 else "SLEEP"
            n["ann_prob"] = round(float(probs[idx]), 3)

        # 3. Safety Net: Coverage Guard
        if method == "ann_guard":
            grid_points, _ = get_grid_points(net_cfg.area_size, grid_res)
            total_points = len(grid_points)
            full_mask = compute_coverage_mask(alive_nodes, grid_points, only_active=False)

            def get_current_cr():
                curr_active = np.array([n["state"] == "ACTIVE" for n in alive_nodes])
                if not np.any(curr_active):
                    return 0.0
                active_mask = full_mask[curr_active]
                cov_pts = np.sum(np.sum(active_mask, axis=0) >= 1)
                return (cov_pts / total_points) * 100.0

            curr_cr = get_current_cr()

            # If ANN prediction resulted in coverage below target, wake up key sleeping nodes
            while curr_cr < cr_target:
                sleeping_indices = [i for i, n in enumerate(alive_nodes) if n["state"] == "SLEEP"]
                if not sleeping_indices:
                    break

                best_node_idx = None
                best_marginal_gain = -1.0

                curr_active_mask = np.array([n["state"] == "ACTIVE" for n in alive_nodes])
                curr_covered = np.sum(full_mask[curr_active_mask], axis=0) >= 1 if np.any(curr_active_mask) else np.zeros(total_points, dtype=bool)

                for idx in sleeping_indices:
                    # Marginal points newly covered by waking node idx
                    new_pts = full_mask[idx] & (~curr_covered)
                    gain = np.sum(new_pts)
                    if gain > best_marginal_gain:
                        best_marginal_gain = gain
                        best_node_idx = idx

                if best_node_idx is not None and best_marginal_gain > 0:
                    alive_nodes[best_node_idx]["state"] = "ACTIVE"
                    guard_corrected_count += 1
                    curr_cr = get_current_cr()
                else:
                    break

    # 4. Final Telemetry Evaluation
    final_metrics = calculate_coverage_metrics(
        alive_nodes,
        area_size=net_cfg.area_size,
        grid_resolution=grid_res,
        only_active=True
    )

    active_count = sum(1 for n in alive_nodes if n["state"] == "ACTIVE")
    sleep_count = sum(1 for n in alive_nodes if n["state"] == "SLEEP")
    elapsed_ms = (time.perf_counter() - t_start) * 1000.0

    telemetry = {
        "method": method,
        "active_count": active_count,
        "sleep_count": sleep_count,
        "active_percentage": round((active_count / max(1, num_alive)) * 100.0, 1),
        "baseline_coverage": round(cr_base, 2),
        "coverage_ratio": final_metrics["coverage_ratio"],
        "overlap_ratio": final_metrics["overlap_ratio"],
        "blindspot_ratio": final_metrics["blindspot_ratio"],
        "multiplicity": final_metrics["multiplicity"],
        "guard_corrected_count": guard_corrected_count,
        "elapsed_ms": round(elapsed_ms, 2)
    }

    return nodes, telemetry
