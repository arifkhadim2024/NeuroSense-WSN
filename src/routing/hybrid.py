"""
Hybrid LEACH-PEGASIS Routing Protocol Implementation.
Combines LEACH cluster partitioning with intra-cluster PEGASIS chain aggregation.
"""

from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from src.config import RadioConfig
from src.radio import transmit_packet, calc_aggregation_energy
from src.routing.pegasis import construct_pegasis_chain


def run_hybrid_round(
    nodes: List[Dict[str, Any]],
    round_idx: int,
    sink_pos: Tuple[float, float] = (50.0, 150.0),
    p_ch: float = 0.10,
    radio_config: Optional[RadioConfig] = None
) -> Dict[str, Any]:
    """
    Execute one round of Hybrid LEACH-PEGASIS routing.

    Args:
        nodes: List of sensor nodes (modified in-place).
        round_idx: Current round number (0-indexed).
        sink_pos: Base Station coordinates (x, y).
        p_ch: Desired percentage of cluster heads (default 10%).
        radio_config: Radio parameters.

    Returns:
        Round telemetry dictionary.
    """
    if radio_config is None:
        radio_config = RadioConfig()

    k_bits = radio_config.packet_bits

    # Filter active alive nodes
    active_alive = [
        n for n in nodes
        if n.get("state") == "ACTIVE" and n.get("energy", 0.0) > 0.0
    ]

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

    # 1. Cluster Head Selection: Pick top energy active nodes with rotation
    num_ch = max(1, int(np.round(p_ch * len(active_alive))))
    sorted_by_energy = sorted(active_alive, key=lambda n: n["energy"], reverse=True)
    # Rotate window based on round index
    start_idx = (round_idx * num_ch) % len(sorted_by_energy)
    cluster_heads = [
        sorted_by_energy[(start_idx + i) % len(sorted_by_energy)]
        for i in range(num_ch)
    ]

    for ch in cluster_heads:
        ch["role"] = "CH"

    ch_ids = [ch["id"] for ch in cluster_heads]

    # 2. Cluster Formation: Assign members to nearest CH
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

    # 3. Intra-Cluster PEGASIS Chain Formation & Hop-by-Hop Transmission
    for ch in cluster_heads:
        members = clusters[ch["id"]]
        if members:
            # Build chain among members ending at CH
            chain = construct_pegasis_chain(members, (ch["x"], ch["y"]))
            for n in chain:
                chain_order.append(int(n["id"]))
            chain_order.append(int(ch["id"]))

            # Forward data along member chain towards CH
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

            # Last member in chain forwards to CH
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
