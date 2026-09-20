"""
LEACH (Low-Energy Adaptive Clustering Hierarchy) Protocol Implementation.
Features probabilistic Cluster Head selection with rotational thresholds.
"""

from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from src.config import RadioConfig
from src.radio import transmit_packet, calc_tx_energy, calc_rx_energy, calc_aggregation_energy


def run_leach_round(
    nodes: List[Dict[str, Any]],
    round_idx: int,
    sink_pos: Tuple[float, float] = (50.0, 150.0),
    p_ch: float = 0.10,
    radio_config: Optional[RadioConfig] = None
) -> Dict[str, Any]:
    """
    Execute one round of LEACH clustered routing.

    Args:
        nodes: List of sensor nodes (modified in-place).
        round_idx: Current round number (0-indexed).
        sink_pos: Base Station coordinates (x, y).
        p_ch: Desired percentage of cluster heads.
        radio_config: Radio dissipation parameters.

    Returns:
        Round telemetry dictionary (packets delivered, dropped, energy spent, CH IDs).
    """
    if radio_config is None:
        radio_config = RadioConfig()

    k_bits = radio_config.packet_bits
    cycle_len = max(1, int(1.0 / p_ch))

    # Reset CH epoch history at the start of each cycle
    if round_idx % cycle_len == 0:
        for node in nodes:
            node["epoch_ch"] = False

    # Filter active alive nodes
    active_alive = [
        n for n in nodes
        if n.get("state") == "ACTIVE" and n.get("energy", 0.0) > 0.0
    ]

    # Reset node roles
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

    # 1. Cluster Head Selection using LEACH threshold T(n)
    cluster_heads = []
    t_n = p_ch / (1.0 - p_ch * (round_idx % cycle_len))

    for node in active_alive:
        if not node.get("epoch_ch", False):
            if np.random.rand() < t_n:
                node["role"] = "CH"
                node["epoch_ch"] = True
                cluster_heads.append(node)

    # Fallback: if no CH was elected, pick the highest energy active node
    if not cluster_heads:
        best_node = max(active_alive, key=lambda n: n["energy"])
        best_node["role"] = "CH"
        best_node["epoch_ch"] = True
        cluster_heads.append(best_node)

    ch_ids = [ch["id"] for ch in cluster_heads]

    # 2. Member Node Association: Each non-CH member joins the closest CH
    clusters: Dict[int, List[Dict[str, Any]]] = {ch["id"]: [] for ch in cluster_heads}
    non_ch_members = [n for n in active_alive if n["id"] not in ch_ids]

    links: List[List[int]] = []
    packets_delivered = 0
    packets_dropped = 0

    for member in non_ch_members:
        # Find nearest cluster head
        nearest_ch = min(
            cluster_heads,
            key=lambda ch: (member["x"] - ch["x"]) ** 2 + (member["y"] - ch["y"]) ** 2
        )
        dist_to_ch = float(np.sqrt((member["x"] - nearest_ch["x"]) ** 2 + (member["y"] - nearest_ch["y"]) ** 2))

        # Transmit packet to CH
        success = transmit_packet(member, nearest_ch, k_bits, dist_to_ch, radio_config)
        if success:
            clusters[nearest_ch["id"]].append(member)
            links.append([int(member["id"]), int(nearest_ch["id"]), 0])
        else:
            packets_dropped += 1

    # 3. Cluster Head Aggregation and Transmission to Base Station
    for ch in cluster_heads:
        if ch["energy"] <= 0.0 or ch["state"] == "DEAD":
            continue

        num_members = len(clusters[ch["id"]])
        # Aggregate member signals + CH's own reading
        e_agg = calc_aggregation_energy(k_bits, num_members + 1, radio_config)
        ch["energy"] = max(0.0, ch["energy"] - e_agg)

        # Transmit aggregated packet to Base Station
        dist_to_sink = float(np.sqrt((ch["x"] - sink_pos[0]) ** 2 + (ch["y"] - sink_pos[1]) ** 2))
        success = transmit_packet(ch, None, k_bits, dist_to_sink, radio_config)

        if success:
            packets_delivered += 1
            links.append([int(ch["id"]), -1, 2])
        else:
            packets_dropped += 1

    # Final energy spent in this round
    final_round_energy = sum(n["energy"] for n in nodes)
    energy_spent = max(0.0, initial_round_energy - final_round_energy)

    return {
        "packets_delivered": packets_delivered,
        "packets_dropped": packets_dropped,
        "cluster_heads": ch_ids,
        "energy_spent": round(float(energy_spent), 6),
        "links": links,
        "chain_order": []
    }
