"""
PEGASIS (Power-Efficient GAthering in Sensor Information Systems) Protocol Implementation.
Builds a greedy linear chain of sensor nodes with round-robin leader rotation.
"""

from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from src.config import RadioConfig
from src.radio import transmit_packet, calc_aggregation_energy


def construct_pegasis_chain(
    nodes: List[Dict[str, Any]],
    sink_pos: Tuple[float, float] = (50.0, 150.0)
) -> List[Dict[str, Any]]:
    """
    Construct a greedy chain connecting active sensor nodes starting from the farthest node.

    Args:
        nodes: List of active alive sensor nodes.
        sink_pos: Base Station coordinates.

    Returns:
        Ordered list of nodes representing the multi-hop linear chain.
    """
    if len(nodes) <= 2:
        return list(nodes)

    # Sort nodes greedily along the spatial gradient towards the sink/cluster head
    return sorted(
        nodes,
        key=lambda n: (n["x"] - sink_pos[0]) ** 2 + (n["y"] - sink_pos[1]) ** 2,
        reverse=True
    )


def run_pegasis_round(
    nodes: List[Dict[str, Any]],
    round_idx: int,
    sink_pos: Tuple[float, float] = (50.0, 150.0),
    radio_config: Optional[RadioConfig] = None
) -> Dict[str, Any]:
    """
    Execute one round of PEGASIS chain-based multi-hop routing.

    Args:
        nodes: List of sensor nodes (modified in-place).
        round_idx: Current round number (0-indexed).
        sink_pos: Base Station coordinates (x, y).
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

    # Construct the chain
    chain = construct_pegasis_chain(active_alive, sink_pos)
    num_nodes_in_chain = len(chain)

    # Designate chain leader (rotates round by round)
    leader_idx = round_idx % num_nodes_in_chain
    leader = chain[leader_idx]
    leader["role"] = "CH"

    links: List[List[int]] = []
    packets_dropped = 0
    chain_order = [int(n["id"]) for n in chain]

    # 1. Forward data from chain start (0) to leader
    for i in range(leader_idx):
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

    # 2. Forward data from chain end (N-1) backwards to leader
    for i in range(num_nodes_in_chain - 1, leader_idx, -1):
        sender = chain[i]
        receiver = chain[i - 1]
        dist = float(np.sqrt((sender["x"] - receiver["x"]) ** 2 + (sender["y"] - receiver["y"]) ** 2))
        success = transmit_packet(sender, receiver, k_bits, dist, radio_config)
        if success:
            e_agg = calc_aggregation_energy(k_bits, 1, radio_config)
            receiver["energy"] = max(0.0, receiver["energy"] - e_agg)
            links.append([int(sender["id"]), int(receiver["id"]), 1])
        else:
            packets_dropped += 1

    # 3. Leader transmits aggregated data to Base Station
    packets_delivered = 0
    if leader["energy"] > 0.0 and leader["state"] != "DEAD":
        dist_to_sink = float(np.sqrt((leader["x"] - sink_pos[0]) ** 2 + (leader["y"] - sink_pos[1]) ** 2))
        success = transmit_packet(leader, None, k_bits, dist_to_sink, radio_config)
        if success:
            packets_delivered = 1
            links.append([int(leader["id"]), -1, 2])
        else:
            packets_dropped += 1

    final_round_energy = sum(n["energy"] for n in nodes)
    energy_spent = max(0.0, initial_round_energy - final_round_energy)

    return {
        "packets_delivered": packets_delivered,
        "packets_dropped": packets_dropped,
        "cluster_heads": [leader["id"]],
        "energy_spent": round(float(energy_spent), 6),
        "links": links,
        "chain_order": chain_order
    }
