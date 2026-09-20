"""
Analytical 8-Feature Extraction Engine for Sensor Nodes.
Computes real geometric, topological, energy, and redundancy metrics for each node.
"""

from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from src.coverage import get_grid_points, compute_coverage_mask
from src.faults import compute_obstacle_blocked_ratio


FEATURE_NAMES = [
    "residual_energy_ratio",
    "sink_distance",
    "neighbors_count",
    "unique_coverage_ratio",
    "overlap_ratio",
    "local_density",
    "nearest_active_dist",
    "obstacle_blocked_ratio"
]


def extract_node_features(
    nodes: List[Dict[str, Any]],
    area_size: Tuple[float, float] = (100.0, 100.0),
    sink_pos: Tuple[float, float] = (50.0, 150.0),
    grid_resolution: float = 2.0,
    obstacles: Optional[List[Dict[str, Any]]] = None
) -> np.ndarray:
    """
    Extract the 8 normalized analytical features for all sensor nodes in the network.

    Args:
        nodes: List of sensor node dictionaries.
        area_size: Field dimensions (width, height) in meters.
        sink_pos: Base Station coordinates (x, y).
        grid_resolution: Step size in meters for discrete coverage matrix.
        obstacles: Optional list of obstacles.

    Returns:
        2D NumPy array of shape (N, 8) with computed feature values.
    """
    num_nodes = len(nodes)
    if num_nodes == 0:
        return np.empty((0, len(FEATURE_NAMES)), dtype=float)

    if obstacles is None:
        obstacles = []

    w, h = area_size
    max_diag = float(np.sqrt((w - sink_pos[0]) ** 2 + (h - sink_pos[1]) ** 2 + w ** 2 + h ** 2))

    coords = np.array([[n["x"], n["y"]] for n in nodes])
    energies = np.array([n.get("energy", 0.5) for n in nodes])
    init_energies = np.array([n.get("initial_energy", 0.5) for n in nodes])
    sensing_radii = np.array([n.get("sensing_radius", 15.0) for n in nodes])
    comm_radii = np.array([n.get("comm_radius", 30.0) for n in nodes])

    # 1. Residual Energy Ratio (E / E_initial)
    energy_ratios = np.where(init_energies > 0, energies / init_energies, 0.0)

    # 2. Sink Distance (normalized to [0, 1])
    sink_arr = np.array(sink_pos)
    sink_dists = np.sqrt(np.sum((coords - sink_arr) ** 2, axis=1))
    norm_sink_dists = sink_dists / max(1.0, max_diag)

    # Pairwise Inter-node Distances
    diffs = coords[:, np.newaxis, :] - coords[np.newaxis, :, :]
    dist_mat = np.sqrt(np.sum(diffs ** 2, axis=2))
    np.fill_diagonal(dist_mat, np.inf)

    # 3. Neighbors Count within Rc
    is_alive = energies > 0
    alive_dist_mat = dist_mat.copy()
    alive_dist_mat[:, ~is_alive] = np.inf
    comm_mask = (alive_dist_mat <= comm_radii[:, np.newaxis])
    neighbor_counts = np.sum(comm_mask, axis=1)

    # 6. Local Node Density (neighbors per unit comm area normalized to 100m^2)
    comm_areas = np.pi * (comm_radii ** 2)
    local_density = neighbor_counts / (comm_areas / 100.0)

    # 7. Nearest Active Neighbor Distance (normalized by field diagonal)
    field_diag = float(np.sqrt(w ** 2 + h ** 2))
    nearest_dists = np.min(alive_dist_mat, axis=1)
    nearest_dists = np.where(np.isinf(nearest_dists), field_diag, nearest_dists)
    norm_nearest_dists = np.clip(nearest_dists / field_diag, 0.0, 1.0)

    # 4 & 5. Unique Coverage and Overlap Ratios via Grid Mask
    grid_points, _ = get_grid_points(area_size, grid_resolution)
    cov_mask = compute_coverage_mask(nodes, grid_points, only_active=False)
    # Only consider alive nodes in coverage mask
    cov_mask = cov_mask & is_alive[:, np.newaxis]

    points_covered_by_each = np.sum(cov_mask, axis=1)
    total_coverage_per_point = np.sum(cov_mask, axis=0)

    # Unique coverage: points where total_coverage_per_point == 1
    unique_point_mask = cov_mask & (total_coverage_per_point == 1)[np.newaxis, :]
    unique_counts = np.sum(unique_point_mask, axis=1)
    unique_ratios = np.where(
        points_covered_by_each > 0,
        unique_counts / points_covered_by_each,
        0.0
    )

    # Overlap ratio: points covered by this node where total_coverage_per_point > 1
    overlap_point_mask = cov_mask & (total_coverage_per_point > 1)[np.newaxis, :]
    overlap_counts = np.sum(overlap_point_mask, axis=1)
    overlap_ratios = np.where(
        points_covered_by_each > 0,
        overlap_counts / points_covered_by_each,
        0.0
    )

    # 8. Obstacle Blocked Sensing Ratio
    blocked_ratios = np.array([
        compute_obstacle_blocked_ratio(n, obstacles) for n in nodes
    ])

    features = np.column_stack((
        energy_ratios,
        norm_sink_dists,
        neighbor_counts,
        unique_ratios,
        overlap_ratios,
        local_density,
        norm_nearest_dists,
        blocked_ratios
    ))

    return features
