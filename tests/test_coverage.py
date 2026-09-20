"""
Unit Tests for Vectorized Coverage, Overlap, and Multiplicity Metrics.
"""

import pytest
import numpy as np
from src.coverage import calculate_coverage_metrics, get_grid_points, compute_coverage_mask


def test_hand_checked_toy_coverage_single_node():
    """Verify exact hand-checked analytical coverage for a single central node."""
    # Field 10m x 10m with 1m resolution (11 x 11 = 121 points)
    area_size = (10.0, 10.0)
    grid_resolution = 1.0

    # Node at (5, 5) with Rs = 2.0m covers exactly 13 grid points:
    # (5,5), (5+-1, 5), (5, 5+-1), (5+-1, 5+-1), (5+-2, 5), (5, 5+-2)
    nodes = [{"id": 0, "x": 5.0, "y": 5.0, "sensing_radius": 2.0, "energy": 0.5, "state": "ACTIVE"}]

    metrics = calculate_coverage_metrics(nodes, area_size=area_size, grid_resolution=grid_resolution)

    assert metrics["covered_points"] == 13
    assert metrics["total_points"] == 121
    assert abs(metrics["coverage_ratio"] - (13 / 121 * 100.0)) < 0.05
    assert metrics["overlap_ratio"] == 0.0
    assert metrics["multiplicity"] == 1.0


def test_hand_checked_overlap_two_nodes():
    """Verify that co-located nodes produce 100% overlap and multiplicity 2.0."""
    area_size = (10.0, 10.0)
    nodes = [
        {"id": 0, "x": 5.0, "y": 5.0, "sensing_radius": 2.0, "energy": 0.5, "state": "ACTIVE"},
        {"id": 1, "x": 5.0, "y": 5.0, "sensing_radius": 2.0, "energy": 0.5, "state": "ACTIVE"}
    ]

    metrics = calculate_coverage_metrics(nodes, area_size=area_size, grid_resolution=1.0)
    assert metrics["covered_points"] == 13
    assert metrics["overlap_ratio"] == 100.0
    assert metrics["multiplicity"] == 2.0


def test_inactive_and_dead_nodes_excluded():
    """Verify that sleeping and dead nodes do not contribute to active coverage."""
    area_size = (10.0, 10.0)
    nodes = [
        {"id": 0, "x": 5.0, "y": 5.0, "sensing_radius": 2.0, "energy": 0.5, "state": "SLEEP"},
        {"id": 1, "x": 5.0, "y": 5.0, "sensing_radius": 2.0, "energy": 0.0, "state": "DEAD"}
    ]

    metrics = calculate_coverage_metrics(nodes, area_size=area_size, grid_resolution=1.0, only_active=True)
    assert metrics["covered_points"] == 0
    assert metrics["coverage_ratio"] == 0.0
    assert metrics["overlap_ratio"] == 0.0
