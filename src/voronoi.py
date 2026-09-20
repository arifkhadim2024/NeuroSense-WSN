"""
Bounded 2D Voronoi Diagram Tessellation Module.
Computes polygonal territory partitions for spatial density analysis.
"""

from typing import List, Dict, Any, Tuple
import numpy as np
from scipy.spatial import Voronoi


def compute_bounded_voronoi(
    nodes: List[Dict[str, Any]],
    area_size: Tuple[float, float] = (100.0, 100.0)
) -> List[Dict[str, Any]]:
    """
    Generate bounded Voronoi cell polygons for sensor nodes within field boundaries.

    Args:
        nodes: List of sensor nodes.
        area_size: Field dimensions (width, height) in meters.

    Returns:
        List of dictionaries with node ID, polygon coordinates, and cell area.
    """
    w, h = area_size
    valid_nodes = [n for n in nodes if n.get("state") != "DEAD"]
    if len(valid_nodes) < 3:
        return []

    points = np.array([[n["x"], n["y"]] for n in valid_nodes])

    # Mirror boundary points to effectively clip Voronoi diagram to [0, w] x [0, h]
    mirror_points = [
        points,
        np.column_stack((-points[:, 0], points[:, 1])),
        np.column_stack((2 * w - points[:, 0], points[:, 1])),
        np.column_stack((points[:, 0], -points[:, 1])),
        np.column_stack((points[:, 0], 2 * h - points[:, 1]))
    ]
    augmented_points = np.vstack(mirror_points)

    try:
        vor = Voronoi(augmented_points)
    except Exception:
        return []

    cells = []
    for i, node in enumerate(valid_nodes):
        region_idx = vor.point_region[i]
        region = vor.regions[region_idx]

        if not region or -1 in region:
            continue

        polygon = [vor.vertices[v].tolist() for v in region]
        # Clip vertices strictly within boundary box [0, w] x [0, h]
        clipped_poly = []
        for x, y in polygon:
            cx = max(0.0, min(float(w), float(x)))
            cy = max(0.0, min(float(h), float(y)))
            clipped_poly.append([round(cx, 2), round(cy, 2)])

        if len(clipped_poly) >= 3:
            # Approximate polygon area using Shoelace formula
            px = np.array([p[0] for p in clipped_poly])
            py = np.array([p[1] for p in clipped_poly])
            area = 0.5 * np.abs(np.dot(px, np.roll(py, 1)) - np.dot(py, np.roll(px, 1)))

            cells.append({
                "node_id": node["id"],
                "polygon": clipped_poly,
                "area": round(float(area), 2)
            })

    return cells
