"""
Greedy Coverage-Preserving Oracle Optimizer.
Produces optimal ground-truth ACTIVE (1) and SLEEP (0) labels for ANN training.
"""

from typing import List, Dict, Any, Tuple
import time
import numpy as np
from src.coverage import get_grid_points, compute_coverage_mask


def run_greedy_oracle(
    nodes: List[Dict[str, Any]],
    area_size: Tuple[float, float] = (100.0, 100.0),
    grid_resolution: float = 2.0,
    coverage_epsilon: float = 1.0
) -> Tuple[np.ndarray, float, Dict[str, Any], Dict[str, Any]]:
    """
    Greedy optimization algorithm that puts redundant nodes to sleep while preserving coverage.

    Args:
        nodes: List of sensor nodes.
        area_size: Field dimensions in meters.
        grid_resolution: Evaluation grid step size in meters.
        coverage_epsilon: Maximum tolerable coverage drop in percentage points.

    Returns:
        Tuple of (binary labels array, execution time in ms, initial metrics, final metrics).
    """
    t_start = time.perf_counter()
    num_nodes = len(nodes)
    if num_nodes == 0:
        return np.array([]), 0.0, {}, {}

    grid_points, _ = get_grid_points(area_size, grid_resolution)
    total_points = len(grid_points)

    # Precompute coverage mask for each node: Shape (N, M)
    full_mask = compute_coverage_mask(nodes, grid_points, only_active=False)
    alive_mask = np.array([n.get("energy", 0.0) > 0.0 for n in nodes], dtype=bool)

    # Initialize active state: all alive nodes are ACTIVE (1)
    active_state = alive_mask.copy()

    def eval_metrics(curr_active: np.ndarray) -> Tuple[float, float]:
        active_cov = full_mask[curr_active]
        if len(active_cov) == 0:
            return 0.0, 0.0
        multiplicity = np.sum(active_cov, axis=0)
        cov_pts = np.sum(multiplicity >= 1)
        ov_pts = np.sum(multiplicity >= 2)
        cr = (cov_pts / total_points) * 100.0
        or_val = (ov_pts / max(1, cov_pts)) * 100.0 if cov_pts > 0 else 0.0
        return float(cr), float(or_val)

    # Initial baseline metrics with all alive nodes active
    cr_base, or_base = eval_metrics(active_state)
    cr_target = max(0.0, cr_base - coverage_epsilon)

    initial_metrics = {
        "coverage": round(cr_base, 2),
        "overlap": round(or_base, 2),
        "active_nodes": int(np.sum(active_state))
    }

    # Iterative greedy node pruning
    while True:
        curr_active_indices = np.where(active_state)[0]
        if len(curr_active_indices) <= 1:
            break

        best_candidate = None
        max_overlap_reduction = -np.inf
        lowest_energy = np.inf

        for idx in curr_active_indices:
            # Test putting candidate node to sleep
            test_active = active_state.copy()
            test_active[idx] = False
            cr_new, or_new = eval_metrics(test_active)

            # Pruning constraint: coverage must stay >= cr_target
            if cr_new >= cr_target:
                curr_cr, curr_or = eval_metrics(active_state)
                ov_reduction = curr_or - or_new
                node_energy = nodes[idx].get("energy", 0.5)

                # Pick node that maximizes overlap reduction (tie-breaker: lowest energy)
                if (ov_reduction > max_overlap_reduction) or (
                    abs(ov_reduction - max_overlap_reduction) < 1e-4 and node_energy < lowest_energy
                ):
                    max_overlap_reduction = ov_reduction
                    lowest_energy = node_energy
                    best_candidate = idx

        if best_candidate is not None and max_overlap_reduction >= 0.0:
            active_state[best_candidate] = False
        else:
            # No candidate can be removed without violating coverage threshold
            break

    cr_final, or_final = eval_metrics(active_state)
    final_metrics = {
        "coverage": round(cr_final, 2),
        "overlap": round(or_final, 2),
        "active_nodes": int(np.sum(active_state))
    }

    elapsed_ms = (time.perf_counter() - t_start) * 1000.0
    labels = active_state.astype(int)

    return labels, round(elapsed_ms, 2), initial_metrics, final_metrics
