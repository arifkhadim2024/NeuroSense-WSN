"""
Environmental Constraints, Obstacles, RF Jammer, and Cyber-Physical Faults Module.
Implements line-of-sight obstruction, jammer interference zones, EMP blast, and POIs.
"""

from typing import List, Dict, Any, Tuple
import numpy as np


OBSTACLE_PRESETS: Dict[str, List[Dict[str, Any]]] = {
    "none": [],
    "central-lake": [
        {"type": "rect", "x": 40.0, "y": 40.0, "w": 20.0, "h": 20.0, "label": "Central Hazard / Lake"}
    ],
    "dual-walls": [
        {"type": "rect", "x": 25.0, "y": 15.0, "w": 5.0, "h": 50.0, "label": "Facility Wall Alpha"},
        {"type": "rect", "x": 70.0, "y": 35.0, "w": 5.0, "h": 50.0, "label": "Facility Wall Beta"}
    ],
    "corner-zones": [
        {"type": "rect", "x": 0.0, "y": 0.0, "w": 25.0, "h": 25.0, "label": "SW Basin"},
        {"type": "rect", "x": 75.0, "y": 75.0, "w": 25.0, "h": 25.0, "label": "NE Basin"}
    ]
}

JAMMER_PRESETS: Dict[str, List[Dict[str, Any]]] = {
    "none": [],
    "central-jammer": [
        {"id": "j1", "x": 50.0, "y": 50.0, "radius": 22.0, "power": 1.0, "label": "Central Jammer"}
    ],
    "dual-jammers": [
        {"id": "j1", "x": 30.0, "y": 45.0, "radius": 16.0, "power": 1.0, "label": "West Jammer"},
        {"id": "j2", "x": 70.0, "y": 55.0, "radius": 16.0, "power": 1.0, "label": "East Jammer"}
    ]
}

POI_PRESETS: Dict[str, List[Dict[str, Any]]] = {
    "none": [],
    "high-value-assets": [
        {"id": "p1", "x": 25.0, "y": 30.0, "name": "Asset Alpha"},
        {"id": "p2", "x": 75.0, "y": 75.0, "name": "Asset Beta"},
        {"id": "p3", "x": 50.0, "y": 45.0, "name": "Asset Gamma"}
    ],
    "perimeter-patrol": [
        {"id": "p1", "x": 15.0, "y": 85.0, "name": "North Perimeter"},
        {"id": "p2", "x": 85.0, "y": 15.0, "name": "South Perimeter"}
    ],
    "dynamic-convoy": [
        {"id": "p1", "x": 20.0, "y": 50.0, "name": "Convoy Unit 1"},
        {"id": "p2", "x": 50.0, "y": 50.0, "name": "Convoy Unit 2"},
        {"id": "p3", "x": 80.0, "y": 50.0, "name": "Convoy Unit 3"}
    ]
}


def is_point_in_obstacle(x: float, y: float, obstacles: List[Dict[str, Any]]) -> bool:
    """Check if point (x, y) lies inside any rectangular or circular obstacle."""
    for obs in obstacles:
        if obs.get("type") == "rect":
            ox, oy, ow, oh = obs["x"], obs["y"], obs["w"], obs["h"]
            if ox <= x <= ox + ow and oy <= y <= oy + oh:
                return True
        elif obs.get("type") == "circle":
            cx, cy, r = obs["x"], obs["y"], obs["radius"]
            if (x - cx) ** 2 + (y - cy) ** 2 <= r ** 2:
                return True
    return False


def is_in_jammer_range(x: float, y: float, jammers: List[Dict[str, Any]]) -> bool:
    """Check if point (x, y) falls within active RF jammer interference range."""
    for jammer in jammers:
        jx, jy, jr = jammer["x"], jammer["y"], jammer["radius"]
        if (x - jx) ** 2 + (y - jy) ** 2 <= jr ** 2:
            return True
    return False


def compute_obstacle_blocked_ratio(
    node: Dict[str, Any],
    obstacles: List[Dict[str, Any]],
    num_samples: int = 16
) -> float:
    """
    Calculate the fraction of a node's sensing disk obstructed by obstacles.

    Args:
        node: Sensor node dictionary with x, y, and sensing_radius.
        obstacles: List of obstacle dictionaries.
        num_samples: Radial sampling points for fast angular integration.

    Returns:
        Fraction between 0.0 (completely clear) and 1.0 (completely blocked).
    """
    if not obstacles:
        return 0.0

    nx, ny = node["x"], node["y"]
    rs = node.get("sensing_radius", 15.0)

    blocked = 0
    angles = np.linspace(0, 2 * np.pi, num_samples, endpoint=False)
    for r_frac in [0.33, 0.66, 1.0]:
        for theta in angles:
            sx = nx + r_frac * rs * np.cos(theta)
            sy = ny + r_frac * rs * np.sin(theta)
            if is_point_in_obstacle(sx, sy, obstacles):
                blocked += 1

    total_samples = num_samples * 3
    return round(float(blocked / total_samples), 3)


def apply_emp_blast(
    nodes: List[Dict[str, Any]],
    blast_center: Tuple[float, float] = (50.0, 50.0),
    blast_radius: float = 30.0,
    energy_drain_fraction: float = 0.85
) -> int:
    """
    Simulate an EMP blast event draining battery energy of nodes within blast radius.

    Args:
        nodes: List of sensor nodes.
        blast_center: (x, y) ground zero coordinate.
        blast_radius: Radius of effect in meters.
        energy_drain_fraction: Portion of current battery energy destroyed (0.0 to 1.0).

    Returns:
        Count of sensor nodes damaged by the blast.
    """
    bx, by = blast_center
    affected_count = 0
    for node in nodes:
        if node["state"] == "DEAD":
            continue
        dist = np.sqrt((node["x"] - bx) ** 2 + (node["y"] - by) ** 2)
        if dist <= blast_radius:
            node["energy"] = max(0.0, node["energy"] * (1.0 - energy_drain_fraction))
            if node["energy"] <= 0.0:
                node["state"] = "DEAD"
            affected_count += 1
    return affected_count
