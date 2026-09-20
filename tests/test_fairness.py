"""
Unit Tests for Benchmark Fairness, Energy Allocation, and Reproducibility.
"""

import pytest
import numpy as np
from src.config import NetworkConfig
from src.network import deploy_nodes, clone_nodes


def test_seed_reproducibility():
    """Verify that identical seeds produce identical node deployments."""
    cfg = NetworkConfig(num_nodes=50)
    nodes1 = deploy_nodes(cfg, seed=123)
    nodes2 = deploy_nodes(cfg, seed=123)

    assert len(nodes1) == len(nodes2)
    for n1, n2 in zip(nodes1, nodes2):
        assert n1["id"] == n2["id"]
        assert n1["x"] == n2["x"]
        assert n1["y"] == n2["y"]
        assert n1["energy"] == n2["energy"]
        assert n1["type"] == n2["type"]


def test_heterogeneous_energy_proportions():
    """Verify correct heterogeneous energy assignment (70% normal, 20% adv, 10% super)."""
    cfg = NetworkConfig(num_nodes=100, e0=0.5, alpha=1.0, beta=2.0)
    nodes = deploy_nodes(cfg, seed=42)

    normals = [n for n in nodes if n["type"] == "normal"]
    advs = [n for n in nodes if n["type"] == "advanced"]
    supers = [n for n in nodes if n["type"] == "super"]

    assert len(normals) == 70
    assert len(advs) == 20
    assert len(supers) == 10

    for n in normals:
        assert abs(n["energy"] - 0.5) < 1e-4
    for n in advs:
        assert abs(n["energy"] - 1.0) < 1e-4
    for n in supers:
        assert abs(n["energy"] - 1.5) < 1e-4


def test_identical_initial_energy_across_protocols():
    """Verify that cloning deployment gives identical initial energy arrays to all protocols."""
    cfg = NetworkConfig(num_nodes=50, e0=0.5)
    base_nodes = deploy_nodes(cfg, seed=999)

    leach_nodes = clone_nodes(base_nodes)
    pegasis_nodes = clone_nodes(base_nodes)
    hybrid_nodes = clone_nodes(base_nodes)

    leach_energies = [n["energy"] for n in leach_nodes]
    pegasis_energies = [n["energy"] for n in pegasis_nodes]
    hybrid_energies = [n["energy"] for n in hybrid_nodes]

    assert leach_energies == pegasis_energies == hybrid_energies
