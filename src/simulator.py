"""
Full Lifecycle WSN Simulation Engine with Frame-by-Frame Telemetry.
Executes multi-round simulations with dynamic sleep rotation, link graphs, and discrete events.
"""

from typing import List, Dict, Any, Tuple, Optional
import time
import numpy as np
from src.config import SimConfig
from src.network import clone_nodes
from src.coverage import get_grid_points, compute_coverage_mask
from src.scheduler import schedule_nodes
from src.routing.leach import run_leach_round
from src.routing.pegasis import run_pegasis_round
from src.routing.hybrid import run_hybrid_round
from src.routing.pso_hybrid import run_pso_hybrid_round


def run_simulation(
    nodes: List[Dict[str, Any]],
    protocol: str = "ann_pso_hybrid",
    config: Optional[SimConfig] = None,
    obstacles: Optional[List[Dict[str, Any]]] = None,
    jammers: Optional[List[Dict[str, Any]]] = None,
    max_rounds: Optional[int] = None
) -> Dict[str, Any]:
    """
    Run an end-to-end multi-round lifecycle simulation generating per-round frames.

    Args:
        nodes: Initial sensor nodes.
        protocol: Routing protocol ('leach', 'pegasis', 'hybrid', 'pso_hybrid', 'ann_pso_hybrid').
        config: Master simulation configuration.
        obstacles: Obstacles list.
        jammers: RF jammers list.
        max_rounds: Maximum number of rounds (defaults to config.max_rounds).

    Returns:
        Dictionary containing frames list, summary metrics, and milestone rounds.
    """
    t_start = time.perf_counter()
    if config is None:
        config = SimConfig()

    # Ensure deterministic reproducible simulation execution for given seed
    np.random.seed(config.seed)

    rounds_limit = max_rounds or config.max_rounds
    working_nodes = clone_nodes(nodes)
    for n in working_nodes:
        if "initial_energy" in n and float(n["initial_energy"]) > 0:
            n["energy"] = float(n["initial_energy"])
        elif "energy" not in n or float(n.get("energy", 0)) <= 0:
            n["energy"] = float(config.network.e0)
            n["initial_energy"] = float(config.network.e0)
        n["state"] = "ACTIVE"
        n["role"] = "MEMBER"
    total_nodes = len(working_nodes)
    sink_pos = config.network.sink_pos

    # Precompute spatial coverage mask for sub-millisecond per-round metric updates
    grid_res = 2.0
    grid_points, _ = get_grid_points(config.network.area_size, grid_res)
    total_grid_pts = len(grid_points)
    static_cov_mask = compute_coverage_mask(working_nodes, grid_points, only_active=False)

    # Lifecycle Milestones (None until reached)
    fnd: Optional[int] = None
    hnd: Optional[int] = None
    lnd: Optional[int] = None

    frames: List[Dict[str, Any]] = []
    history_rounds: List[int] = []
    history_alive: List[int] = []
    history_active: List[int] = []
    history_sleep: List[int] = []
    history_energy: List[float] = []
    history_packets: List[int] = []
    history_dropped: List[int] = []
    history_energy_spent: List[float] = []
    history_coverage: List[float] = []
    history_overlap: List[float] = []

    cumulative_packets = 0
    cumulative_dropped = 0

    # Initial Sleep Scheduling for ANN-based proposed protocol
    is_ann_protocol = protocol in ("ann_pso_hybrid", "ann_hybrid")
    prev_states = [2] * total_nodes  # Initially active

    if is_ann_protocol:
        working_nodes, _ = schedule_nodes(
            working_nodes,
            method="ann_guard",
            config=config,
            obstacles=obstacles
        )
    else:
        for n in working_nodes:
            n["state"] = "ACTIVE"

    for r in range(rounds_limit):
        alive_before = [n for n in working_nodes if n.get("energy", 0.0) > 0.0 and n.get("state") != "DEAD"]
        num_alive_before = len(alive_before)

        if num_alive_before == 0:
            if lnd is None:
                lnd = r
            break

        events: List[str] = []

        # Dynamic Sleep Rotation every K rounds for ANN proposed protocol
        if is_ann_protocol and (r > 0) and (r % config.sleep_rotation_interval == 0):
            old_sleep_ids = {n["id"] for n in working_nodes if n.get("state") == "SLEEP"}
            working_nodes, _ = schedule_nodes(
                working_nodes,
                method="ann_guard",
                config=config,
                obstacles=obstacles
            )
            new_sleep_ids = {n["id"] for n in working_nodes if n.get("state") == "SLEEP"}
            for sid in (new_sleep_ids - old_sleep_ids):
                events.append(f"node_slept:{sid}")
            for wid in (old_sleep_ids - new_sleep_ids):
                events.append(f"node_woke:{wid}")

        # Execute Round Routing Protocol
        if protocol == "leach":
            telemetry = run_leach_round(working_nodes, r, sink_pos=sink_pos, radio_config=config.radio)
        elif protocol == "pegasis":
            telemetry = run_pegasis_round(working_nodes, r, sink_pos=sink_pos, radio_config=config.radio)
        elif protocol == "hybrid":
            telemetry = run_hybrid_round(working_nodes, r, sink_pos=sink_pos, radio_config=config.radio)
        elif protocol in ("pso_hybrid", "ann_pso_hybrid"):
            telemetry = run_pso_hybrid_round(
                working_nodes,
                r,
                sink_pos=sink_pos,
                radio_config=config.radio,
                pso_config=config.pso
            )
        else:
            telemetry = run_hybrid_round(working_nodes, r, sink_pos=sink_pos, radio_config=config.radio)

        # Update node DEAD states and track events
        for idx, n in enumerate(working_nodes):
            if n.get("energy", 0.0) <= 0.0 and n.get("state") != "DEAD":
                n["state"] = "DEAD"
                events.append(f"node_died:{n['id']}")

        for ch_id in telemetry.get("cluster_heads", []):
            events.append(f"ch_elected:{ch_id}")

        # Derive node states for this frame: 0=dead, 1=sleep, 2=active, 3=CH, 4=chain leader
        current_state_codes = []
        is_pegasis = (protocol == "pegasis")
        for n in working_nodes:
            if n.get("state") == "DEAD" or n.get("energy", 0.0) <= 0.0:
                current_state_codes.append(0)
            elif n.get("state") == "SLEEP":
                current_state_codes.append(1)
            elif n.get("role") == "CH":
                current_state_codes.append(4 if is_pegasis else 3)
            else:
                current_state_codes.append(2)

        num_dead = sum(1 for c in current_state_codes if c == 0)
        num_sleep = sum(1 for c in current_state_codes if c == 1)
        num_active = sum(1 for c in current_state_codes if c in (2, 3, 4))
        num_alive = num_active + num_sleep

        total_energy_left = sum(n["energy"] for n in working_nodes)
        cumulative_packets += telemetry["packets_delivered"]
        cumulative_dropped += telemetry["packets_dropped"]

        # Track Milestones (1-indexed round)
        if fnd is None and num_alive < total_nodes:
            fnd = r + 1
        if hnd is None and num_alive <= (total_nodes // 2):
            hnd = r + 1
        if lnd is None and num_alive == 0:
            lnd = r + 1

        # Fast Vectorized Coverage & Overlap Recomputation on Active Nodes
        active_indices = np.array([c in (2, 3, 4) for c in current_state_codes])
        if np.any(active_indices):
            active_cov = static_cov_mask[active_indices]
            pt_multiplicity = np.sum(active_cov, axis=0)
            covered_pts = np.sum(pt_multiplicity >= 1)
            overlap_pts = np.sum(pt_multiplicity >= 2)
            cr_val = round(float((covered_pts / total_grid_pts) * 100.0), 1)
            or_val = round(float((overlap_pts / max(1, covered_pts)) * 100.0), 1)
            hr_val = round(float(100.0 - cr_val), 1)
            k_val = round(float(np.mean(pt_multiplicity[pt_multiplicity >= 1])), 2)
        else:
            cr_val, or_val, hr_val, k_val = 0.0, 0.0, 100.0, 0.0

        # Build Frame Object
        frame = {
            "round": r + 1,
            "alive": num_alive,
            "active": num_active,
            "sleeping": num_sleep,
            "dead": num_dead,
            "states": current_state_codes,
            "energy": [round(float(n["energy"]), 4) for n in working_nodes],
            "links": telemetry.get("links", []),
            "chain_order": telemetry.get("chain_order", []),
            "packets_round": telemetry["packets_delivered"],
            "packets_total": cumulative_packets,
            "dropped_round": telemetry["packets_dropped"],
            "energy_round": round(float(telemetry["energy_spent"]), 4),
            "energy_total_left": round(float(total_energy_left), 4),
            "coverage": cr_val,
            "overlap": or_val,
            "blindspot": hr_val,
            "multiplicity": k_val,
            "events": events
        }
        frames.append(frame)

        # History arrays for lightweight chart payloads
        history_rounds.append(r + 1)
        history_alive.append(num_alive)
        history_active.append(num_active)
        history_sleep.append(num_sleep)
        history_energy.append(round(float(total_energy_left), 4))
        history_packets.append(cumulative_packets)
        history_dropped.append(cumulative_dropped)
        history_energy_spent.append(round(float(telemetry["energy_spent"]), 5))
        history_coverage.append(cr_val)
        history_overlap.append(or_val)

        prev_states = current_state_codes

    elapsed_s = (time.perf_counter() - t_start)
    total_energy_spent = sum(f.get("energy_round", 0.0) for f in frames)
    final_energy = frames[-1]["energy_total_left"] if frames else 0.0
    packets_per_joule = round(cumulative_packets / max(0.001, total_energy_spent), 1)

    return {
        "protocol": protocol,
        "total_nodes": total_nodes,
        "rounds_completed": len(frames),
        "fnd": fnd,
        "hnd": hnd,
        "lnd": lnd,
        "total_packets_delivered": cumulative_packets,
        "total_packets_dropped": cumulative_dropped,
        "total_energy_spent": round(float(total_energy_spent), 4),
        "final_total_energy": round(float(final_energy), 4),
        "packets_per_joule": packets_per_joule,
        "final_residual_energy": final_energy,
        "mean_coverage": round(float(np.mean(history_coverage)), 1) if history_coverage else 0.0,
        "final_coverage": history_coverage[-1] if history_coverage else 0.0,
        "elapsed_seconds": round(elapsed_s, 2),
        "frames": frames,
        "history": {
            "rounds": history_rounds,
            "alive": history_alive,
            "active": history_active,
            "sleep": history_sleep,
            "energy": history_energy,
            "packets": history_packets,
            "dropped": history_dropped,
            "energy_spent": history_energy_spent,
            "coverage": history_coverage,
            "overlap": history_overlap
        },
        "final_nodes": working_nodes
    }
