"""
Vectorized Spatial Coverage, Overlap, and Multiplicity Evaluation Module.
Uses fast 2D grid matrix operations to evaluate sensing metrics and blind spots.
"""

from typing import List, Dict, Any, Tuple, Optional
import numpy as np


def get_grid_points(
    area_size: Tuple[float, float] = (100.0, 100.0),
    grid_resolution: float = 1.0
) -> Tuple[np.ndarray, Tuple[int, int]]:
    """
    Generate uniform 2D grid points covering the sensing field.

    Args:
        area_size: Field dimensions (width, height) in meters.
        grid_resolution: Spacing between adjacent grid points in meters.

    Returns:
        Tuple of (points array of shape (M, 2), (num_rows, num_cols)).
    """
    w, h = area_size
    xs = np.arange(0.0, w + 1e-5, grid_resolution)
    ys = np.arange(0.0, h + 1e-5, grid_resolution)
    grid_x, grid_y = np.meshgrid(xs, ys)
    points = np.column_stack((grid_x.ravel(), grid_y.ravel()))
    return points, (len(ys), len(xs))


def compute_coverage_mask(
    nodes: List[Dict[str, Any]],
    grid_points: np.ndarray,
    only_active: bool = True
) -> np.ndarray:
    """
    Compute binary coverage boolean mask for all nodes against all grid points.

    Args:
        nodes: List of sensor nodes.
        grid_points: 2D array of grid coordinates of shape (M, 2).
        only_active: If True, only nodes with state == 'ACTIVE' and energy > 0 are included.

    Returns:
        Boolean array of shape (N, M) indicating if node i covers point j.
    """
    num_nodes = len(nodes)
    num_points = len(grid_points)

    if num_nodes == 0 or num_points == 0:
        return np.zeros((num_nodes, num_points), dtype=bool)

    coords = np.array([[n["x"], n["y"]] for n in nodes])
    radii = np.array([n.get("sensing_radius", 15.0) for n in nodes])

    # Filter out inactive or dead nodes if requested
    valid_mask = np.ones(num_nodes, dtype=bool)
    if only_active:
        for i, n in enumerate(nodes):
            if n.get("state", "ACTIVE") != "ACTIVE" or n.get("energy", 0.0) <= 0.0:
                valid_mask[i] = False

    # Compute Euclidean distance from each node to each grid point
    # Shape: (N, 1, 2) - (1, M, 2) -> (N, M, 2)
    diff = coords[:, np.newaxis, :] - grid_points[np.newaxis, :, :]
    dist_sq = np.sum(diff ** 2, axis=2)
    radii_sq = radii[:, np.newaxis] ** 2

    # Boolean coverage condition: distance <= sensing_radius
    mask = (dist_sq <= radii_sq) & valid_mask[:, np.newaxis]
    return mask


def calculate_coverage_metrics(
    nodes: List[Dict[str, Any]],
    area_size: Tuple[float, float] = (100.0, 100.0),
    grid_resolution: float = 1.0,
    only_active: bool = True
) -> Dict[str, Any]:
    """
    Compute full spatial coverage telemetry (CR, OR, HR, Mean Multiplicity K).

    Args:
        nodes: List of sensor nodes.
        area_size: Field dimensions in meters.
        grid_resolution: Grid step size in meters.
        only_active: Whether to restrict calculation to active alive nodes.

    Returns:
        Dictionary of coverage telemetry and multiplicity grid.
    """
    grid_points, grid_shape = get_grid_points(area_size, grid_resolution)
    mask = compute_coverage_mask(nodes, grid_points, only_active=only_active)

    total_points = len(grid_points)
    if total_points == 0:
        return {"coverage_ratio": 0.0, "overlap_ratio": 0.0, "blindspot_ratio": 100.0, "multiplicity": 0.0}

    # Count number of active nodes covering each grid point
    point_multiplicity = np.sum(mask, axis=0)  # Shape (M,)
    covered_points = np.sum(point_multiplicity >= 1)
    overlap_points = np.sum(point_multiplicity >= 2)

    coverage_ratio = float((covered_points / total_points) * 100.0)
    overlap_ratio = float((overlap_points / max(1, covered_points)) * 100.0) if covered_points > 0 else 0.0
    blindspot_ratio = float(100.0 - coverage_ratio)
    mean_multiplicity = float(np.mean(point_multiplicity[point_multiplicity >= 1])) if covered_points > 0 else 0.0

    # Reshape multiplicity array into 2D grid matrix for heatmap rendering
    multiplicity_matrix = point_multiplicity.reshape(grid_shape).tolist()

    return {
        "coverage_ratio": round(coverage_ratio, 2),
        "overlap_ratio": round(overlap_ratio, 2),
        "blindspot_ratio": round(blindspot_ratio, 2),
        "multiplicity": round(mean_multiplicity, 2),
        "covered_points": int(covered_points),
        "total_points": int(total_points),
        "multiplicity_grid": multiplicity_matrix
    }
