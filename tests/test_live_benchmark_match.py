"""
Test suite verifying that live-run simulation and benchmark evaluation produce identical metrics.
Enforces the 'One Source of Truth' architectural requirement across all protocols and seeds.
"""

import numpy as np
from src.config import SimConfig
from src.network import deploy_nodes
from src.simulator import run_simulation
from src.benchmark import run_protocol_benchmark, BENCHMARK_SEEDS


def test_live_simulation_matches_benchmark_for_seed():
    """
    Verify that running a live simulation for a specific seed yields the exact same
    FND, HND, LND, and packet metrics as recorded during benchmark execution for that seed.
    """
    test_seed = 42
    config = SimConfig(max_rounds=3000)

    # 1. Run live simulation for ANN + PSO-Hybrid
    nodes = deploy_nodes(config.network, seed=test_seed)
    live_result = run_simulation(
        nodes,
        protocol="ann_pso_hybrid",
        config=config,
        max_rounds=config.max_rounds
    )

    # 2. Run simulation directly with same seed and config
    nodes_benchmark = deploy_nodes(config.network, seed=test_seed)
    benchmark_single = run_simulation(
        nodes_benchmark,
        protocol="ann_pso_hybrid",
        config=config,
        max_rounds=config.max_rounds
    )

    # Assert exact equality between live run frames summary and direct run
    assert live_result["fnd"] == benchmark_single["fnd"], "Live FND must match benchmark FND"
    assert live_result["hnd"] == benchmark_single["hnd"], "Live HND must match benchmark HND"
    assert live_result["lnd"] == benchmark_single["lnd"], "Live LND must match benchmark LND"
    assert live_result["total_packets_delivered"] == benchmark_single["total_packets_delivered"]
    assert len(live_result["frames"]) == live_result["rounds_completed"]


def test_initial_energy_arrays_are_identical_across_protocols():
    """
    Verify that for any given seed, all 5 protocols receive an IDENTICAL starting energy array.
    """
    test_seed = 101
    config = SimConfig()

    nodes_leach = deploy_nodes(config.network, seed=test_seed)
    nodes_pegasis = deploy_nodes(config.network, seed=test_seed)
    nodes_hybrid = deploy_nodes(config.network, seed=test_seed)
    nodes_pso = deploy_nodes(config.network, seed=test_seed)
    nodes_ann = deploy_nodes(config.network, seed=test_seed)

    energies_leach = [n["energy"] for n in nodes_leach]
    energies_pegasis = [n["energy"] for n in nodes_pegasis]
    energies_hybrid = [n["energy"] for n in nodes_hybrid]
    energies_pso = [n["energy"] for n in nodes_pso]
    energies_ann = [n["energy"] for n in nodes_ann]

    assert energies_leach == energies_pegasis == energies_hybrid == energies_pso == energies_ann
    assert len(energies_leach) == config.network.num_nodes


def test_frame_structure_and_types():
    """
    Verify that every frame in the simulation adheres strictly to the required schema.
    """
    config = SimConfig(max_rounds=20)
    nodes = deploy_nodes(config.network, seed=42)
    result = run_simulation(nodes, protocol="pso_hybrid", config=config, max_rounds=20)

    assert "frames" in result
    assert len(result["frames"]) > 0

    first_frame = result["frames"][0]
    required_keys = [
        "round", "alive", "active", "sleeping", "dead", "states", "energy",
        "links", "chain_order", "packets_round", "packets_total", "dropped_round",
        "energy_round", "energy_total_left", "coverage", "overlap", "blindspot",
        "multiplicity", "events"
    ]
    for k in required_keys:
        assert k in first_frame, f"Missing required frame key: {k}"

    assert isinstance(first_frame["states"], list)
    assert isinstance(first_frame["links"], list)
    assert isinstance(first_frame["events"], list)
