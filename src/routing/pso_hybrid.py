"""
PSO-Hybrid Routing Protocol with Multi-Objective Cluster Head Optimization.
Uses Particle Swarm Optimization to balance residual energy, BS distance, and intra-cluster spread.
"""

from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from src.config import RadioConfig, PSOConfig
from src.radio import transmit_packet, calc_aggregation_energy
from src.routing.pegasis import construct_pegasis_chain


def select_cluster_heads_pso(
    active_nodes: List[Dict[str, Any]],
    num_ch: int,
    sink_pos: Tuple[float, float],
    pso_cfg: Optional[PSOConfig] = None
) -> List[Dict[str, Any]]:
    """
    Execute vectorized discrete Particle Swarm Optimization to pick optimal Cluster Heads.

    Args:
        active_nodes: List of currently active alive nodes.
        num_ch: Target number of Cluster Heads.
        sink_pos: Base Station coordinates.
        pso_cfg: PSO configuration weights and iterations.

    Returns:
        List of selected Cluster Head node dictionaries.
    """
    if pso_cfg is None:
        pso_cfg = PSOConfig()

    num_active = len(active_nodes)
    if num_active <= num_ch:
        return active_nodes.copy()

    coords = np.array([[n["x"], n["y"]] for n in active_nodes])
    energies = np.array([n.get("energy", 0.5) for n in active_nodes])
    sink_arr = np.array(sink_pos)
    all_sink_dists = np.sqrt(np.sum((coords - sink_arr) ** 2, axis=1))

    # Precomputed pairwise distance matrix for sub-millisecond intra-cluster evaluation
    diffs = coords[:, None, :] - coords[None, :, :]
    pairwise_dist = np.sqrt(np.sum(diffs ** 2, axis=2))
    max_diag = 180.0

    def get_fitness(indices: List[int]) -> float:
        ch_idx = np.array(indices, dtype=int)
        f_energy = max(0.0, 1.0 - (float(np.mean(energies[ch_idx])) / 1.0))
        f_sink = float(np.mean(all_sink_dists[ch_idx])) / max_diag
        # Minimum distance from all active nodes to their nearest CH
        min_to_ch = np.min(pairwise_dist[:, ch_idx], axis=1)
        f_intra = float(np.mean(min_to_ch)) / max_diag
        return float(
            pso_cfg.w_energy * f_energy +
            pso_cfg.w_sink_dist * f_sink +
            pso_cfg.w_intra_dist * f_intra
        )

    # Initialize swarm particles
    particles = []
    p_bests = []
    p_best_scores = []

    for _ in range(pso_cfg.num_particles):
        subset = list(np.random.choice(num_active, size=num_ch, replace=False))
        particles.append(subset)
        score = get_fitness(subset)
        p_bests.append(subset.copy())
        p_best_scores.append(score)

    g_best_idx = int(np.argmin(p_best_scores))
    g_best = p_bests[g_best_idx].copy()
    g_best_score = p_best_scores[g_best_idx]

    # Iterative Swarm Evolution
    for _ in range(pso_cfg.max_iterations):
        for i in range(pso_cfg.num_particles):
            current = particles[i]
            new_subset = set(current)
            if np.random.rand() < pso_cfg.c_personal / 3.0:
                new_subset = new_subset.union(np.random.choice(p_bests[i], size=1))
            if np.random.rand() < pso_cfg.c_social / 3.0:
                new_subset = new_subset.union(np.random.choice(g_best, size=1))

            candidate_list = list(new_subset)
            if len(candidate_list) > num_ch:
                candidate_list = list(np.random.choice(candidate_list, size=num_ch, replace=False))
            elif len(candidate_list) < num_ch:
                pool = [idx for idx in range(num_active) if idx not in candidate_list]
                needed = num_ch - len(candidate_list)
                if pool:
                    candidate_list.extend(np.random.choice(pool, size=min(needed, len(pool)), replace=False))

            particles[i] = candidate_list
            score = get_fitness(candidate_list)

            if score < p_best_scores[i]:
                p_bests[i] = candidate_list.copy()
                p_best_scores[i] = score
                if score < g_best_score:
                    g_best = candidate_list.copy()
                    g_best_score = score

    return [active_nodes[idx] for idx in g_best]


def run_pso_hybrid_round(
    nodes: List[Dict[str, Any]],
    round_idx: int,
    sink_pos: Tuple[float, float] = (50.0, 150.0),
    p_ch: float = 0.10,
    radio_config: Optional[RadioConfig] = None,
    pso_config: Optional[PSOConfig] = None
) -> Dict[str, Any]:
    """
    Execute one round of PSO-Hybrid routing.

    Args:
        nodes: List of sensor nodes (modified in-place).
        round_idx: Round index.
        sink_pos: Base Station coordinates.
        p_ch: Fraction of cluster heads.
        radio_config: Radio parameters.
        pso_config: PSO parameters.

    Returns:
        Round telemetry dictionary.
    """
    if radio_config is None:
        radio_config = RadioConfig()

    k_bits = radio_config.packet_bits
    active_alive = [n for n in nodes if n.get("state") == "ACTIVE" and n.get("energy", 0.0) > 0.0]

    for node in nodes:
        node["role"] = "MEMBER"

    # Sleeping nodes pay sleep energy
    for node in nodes:
        if node.get("state") == "SLEEP" and node.get("energy", 0.0) > 0.0:
            node["energy"] = max(0.0, node["energy"] - radio_config.sleep_energy_per_round)
            if node["energy"] <= 0.0:
                node["state"] = "DEAD"
        elif node.get("state") == "ACTIVE" and node.get("energy", 0.0) > 0.0:
            node["energy"] = max(0.0, node["energy"] - radio_config.sensing_energy_per_round)

    if not active_alive:
        return {"packets_delivered": 0, "packets_dropped": 0, "cluster_heads": [], "energy_spent": 0.0}

    initial_round_energy = sum(n["energy"] for n in nodes)

    # 1. PSO Cluster Head Selection (Re-run every 5 rounds or if no valid CHs)
    num_ch = max(1, int(np.round(p_ch * len(active_alive))))
    existing_chs = [n for n in active_alive if n.get("role") == "CH" and n.get("energy", 0.0) > 0.0]

    if (round_idx % 5 == 0) or len(existing_chs) < num_ch:
        cluster_heads = select_cluster_heads_pso(active_alive, num_ch, sink_pos, pso_config)
        for node in active_alive:
            node["role"] = "MEMBER"
        for ch in cluster_heads:
            ch["role"] = "CH"
    else:
        cluster_heads = existing_chs[:num_ch]

    ch_ids = [ch["id"] for ch in cluster_heads]

    # 2. Cluster Formation
    clusters: Dict[int, List[Dict[str, Any]]] = {ch["id"]: [] for ch in cluster_heads}
    non_ch_members = [n for n in active_alive if n["id"] not in ch_ids]

    for member in non_ch_members:
        nearest_ch = min(
            cluster_heads,
            key=lambda ch: (member["x"] - ch["x"]) ** 2 + (member["y"] - ch["y"]) ** 2
        )
        clusters[nearest_ch["id"]].append(member)

    links: List[List[int]] = []
    chain_order: List[int] = []
    packets_delivered = 0
    packets_dropped = 0

    # 3. Intra-Cluster PEGASIS Daisy-Chain Transmission
    for ch in cluster_heads:
        members = clusters[ch["id"]]
        if members:
            chain = construct_pegasis_chain(members, (ch["x"], ch["y"]))
            for n in chain:
                chain_order.append(int(n["id"]))
            chain_order.append(int(ch["id"]))

            for i in range(len(chain) - 1):
                sender = chain[i]
                receiver = chain[i + 1]
                dist = float(np.sqrt((sender["x"] - receiver["x"]) ** 2 + (sender["y"] - receiver["y"]) ** 2))
                success = transmit_packet(sender, receiver, k_bits, dist, radio_config)
                if success:
                    e_agg = calc_aggregation_energy(k_bits, 1, radio_config)
                    receiver["energy"] = max(0.0, receiver["energy"] - e_agg)
                    links.append([int(sender["id"]), int(receiver["id"]), 1])
                else:
                    packets_dropped += 1

            last_member = chain[-1]
            dist_to_ch = float(np.sqrt((last_member["x"] - ch["x"]) ** 2 + (last_member["y"] - ch["y"]) ** 2))
            success = transmit_packet(last_member, ch, k_bits, dist_to_ch, radio_config)
            if success:
                e_agg = calc_aggregation_energy(k_bits, len(members), radio_config)
                ch["energy"] = max(0.0, ch["energy"] - e_agg)
                links.append([int(last_member["id"]), int(ch["id"]), 0])
            else:
                packets_dropped += 1
        else:
            chain_order.append(int(ch["id"]))

        # 4. CH aggregates and transmits to Base Station
        if ch["energy"] > 0.0 and ch["state"] != "DEAD":
            dist_to_sink = float(np.sqrt((ch["x"] - sink_pos[0]) ** 2 + (ch["y"] - sink_pos[1]) ** 2))
            success = transmit_packet(ch, None, k_bits, dist_to_sink, radio_config)
            if success:
                packets_delivered += 1
                links.append([int(ch["id"]), -1, 2])
            else:
                packets_dropped += 1

    final_round_energy = sum(n["energy"] for n in nodes)
    energy_spent = max(0.0, initial_round_energy - final_round_energy)

    return {
        "packets_delivered": packets_delivered,
        "packets_dropped": packets_dropped,
        "cluster_heads": ch_ids,
        "energy_spent": round(float(energy_spent), 6),
        "links": links,
        "chain_order": chain_order
    }
