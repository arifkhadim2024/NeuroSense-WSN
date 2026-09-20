"""
Network Topology and Node Deployment Module.
Handles node spatial placement, heterogeneous energy distribution, and neighborhood graphs.
"""

from typing import List, Dict, Any, Tuple, Optional
import copy
import numpy as np
from src.config import NetworkConfig


def deploy_nodes(
    config: Optional[NetworkConfig] = None,
    seed: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Deploy sensor nodes in the 2D field with heterogeneous initial battery energies.

    Args:
        config: Network configuration parameters (or default if None).
        seed: Random seed for deterministic and reproducible deployment.

    Returns:
        List of node dictionaries containing coordinates, energy, and state.
    """
    if config is None:
        config = NetworkConfig()

    rng = np.random.RandomState(seed)
    n = config.num_nodes
    w, h = config.area_size

    # 1. Spatial Coordinate Generation based on deployment pattern
    if config.deployment_type == "clustered":
        # Create 3 Gaussian cluster centers across the field
        centers = [(w * 0.25, h * 0.3), (w * 0.75, h * 0.35), (w * 0.5, h * 0.75)]
        coords = []
        for i in range(n):
            c_idx = i % len(centers)
            cx, cy = centers[c_idx]
            x = float(np.clip(rng.normal(cx, scale=w * 0.12), 2.0, w - 2.0))
            y = float(np.clip(rng.normal(cy, scale=h * 0.12), 2.0, h - 2.0))
            coords.append((x, y))
    elif config.deployment_type == "grid":
        # Regular grid with random spatial jitter
        grid_cols = int(np.ceil(np.sqrt(n)))
        grid_rows = int(np.ceil(n / grid_cols))
        dx = w / (grid_cols + 1)
        dy = h / (grid_rows + 1)
        coords = []
        idx = 0
        for r in range(1, grid_rows + 1):
            for c in range(1, grid_cols + 1):
                if idx >= n:
                    break
                jx = rng.uniform(-dx * 0.35, dx * 0.35)
                jy = rng.uniform(-dy * 0.35, dy * 0.35)
                x = float(np.clip(c * dx + jx, 2.0, w - 2.0))
                y = float(np.clip(r * dy + jy, 2.0, h - 2.0))
                coords.append((x, y))
                idx += 1
    else:  # Uniform random deployment
        xs = rng.uniform(2.0, w - 2.0, size=n)
        ys = rng.uniform(2.0, h - 2.0, size=n)
        coords = list(zip(xs.tolist(), ys.tolist()))

    # 2. Heterogeneous Battery Energy Distribution
    num_normal = int(np.round(config.normal_ratio * n))
    num_advanced = int(np.round(config.advanced_ratio * n))
    num_super = n - (num_normal + num_advanced)

    energy_types = (
        ["normal"] * num_normal +
        ["advanced"] * num_advanced +
        ["super"] * num_super
    )
    # Shuffle types deterministically to distribute heterogeneity across field
    rng.shuffle(energy_types)

    nodes = []
    for i in range(n):
        node_type = energy_types[i]
        if node_type == "super":
            e_init = config.e0 * (1.0 + config.beta)
        elif node_type == "advanced":
            e_init = config.e0 * (1.0 + config.alpha)
        else:
            e_init = config.e0

        x, y = coords[i]
        nodes.append({
            "id": i,
            "x": round(float(x), 2),
            "y": round(float(y), 2),
            "initial_energy": round(float(e_init), 4),
            "energy": round(float(e_init), 4),
            "type": node_type,
            "sensing_radius": float(config.sensing_radius),
            "comm_radius": float(config.comm_radius),
            "state": "ACTIVE",  # ACTIVE, SLEEP, or DEAD
            "role": "MEMBER"    # MEMBER, CH, or SINK
        })

    return nodes


def compute_distance_matrix(nodes: List[Dict[str, Any]]) -> np.ndarray:
    """
    Compute symmetric pairwise Euclidean distance matrix between all nodes.

    Args:
        nodes: List of sensor node dictionaries.

    Returns:
        2D NumPy array of shape (N, N) with Euclidean distances in meters.
    """
    coords = np.array([[n["x"], n["y"]] for n in nodes])
    diffs = coords[:, np.newaxis, :] - coords[np.newaxis, :, :]
    return np.sqrt(np.sum(diffs ** 2, axis=2))


def get_neighbors(
    nodes: List[Dict[str, Any]],
    comm_radius: float
) -> Dict[int, List[int]]:
    """
    Find list of neighbor node IDs within communication radius for each node.

    Args:
        nodes: List of sensor nodes.
        comm_radius: Maximum communication distance in meters.

    Returns:
        Dictionary mapping node ID to list of neighbor node IDs.
    """
    dist_mat = compute_distance_matrix(nodes)
    neighbors = {}
    for i, node in enumerate(nodes):
        # Neighbors are within comm_radius, excluding self
        nbr_mask = (dist_mat[i] <= comm_radius) & (dist_mat[i] > 1e-6)
        neighbors[node["id"]] = [nodes[j]["id"] for j in np.where(nbr_mask)[0]]
    return neighbors


def clone_nodes(nodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Create a deep copy of sensor nodes to guarantee identical initial state across runs.

    Args:
        nodes: Original list of sensor nodes.

    Returns:
        Exact independent copy of nodes.
    """
    return copy.deepcopy(nodes)
