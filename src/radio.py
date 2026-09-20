"""
First-Order Radio Energy Dissipation and Channel Propagation Model.
Calculates exact transmission, reception, aggregation, and idle energy consumption.
"""

from typing import Tuple, Dict, Any, Optional
import numpy as np
from src.config import RadioConfig


def calc_tx_energy(
    k_bits: int,
    distance: float,
    config: Optional[RadioConfig] = None
) -> float:
    """
    Calculate transmission energy dissipation based on distance and packet length.

    Args:
        k_bits: Packet payload size in bits.
        distance: Distance to receiver in meters.
        config: Radio configuration parameters (or default if None).

    Returns:
        Energy consumed in Joules.
    """
    if config is None:
        config = RadioConfig()

    d0 = config.d0
    e_elec = config.e_elec * k_bits

    # Apply log-normal shadowing if enabled (sigma > 0)
    effective_dist = distance
    if config.shadowing_std_db > 0.0:
        shadowing_factor = 10.0 ** (np.random.normal(0, config.shadowing_std_db) / 10.0)
        effective_dist = max(1.0, distance * shadowing_factor)

    # Path loss model with crossover threshold d0
    if config.path_loss_exp != 2.0:
        # Generalized path loss exponent
        e_amp = config.eps_fs * (effective_dist ** config.path_loss_exp)
    elif effective_dist < d0:
        # Free-space propagation (d^2)
        e_amp = config.eps_fs * (effective_dist ** 2)
    else:
        # Two-ray multipath fading propagation (d^4)
        e_amp = config.eps_mp * (effective_dist ** 4)

    return float(e_elec + (k_bits * e_amp))


def calc_rx_energy(
    k_bits: int,
    config: Optional[RadioConfig] = None
) -> float:
    """
    Calculate energy dissipated by receiving electronics.

    Args:
        k_bits: Received packet size in bits.
        config: Radio configuration parameters.

    Returns:
        Energy consumed in Joules.
    """
    if config is None:
        config = RadioConfig()
    return float(config.e_elec * k_bits)


def calc_aggregation_energy(
    k_bits: int,
    num_signals: int,
    config: Optional[RadioConfig] = None
) -> float:
    """
    Calculate energy dissipated during data aggregation / compression at Cluster Head.

    Args:
        k_bits: Data packet size in bits.
        num_signals: Number of incoming member signals to aggregate.
        config: Radio configuration parameters.

    Returns:
        Energy consumed in Joules.
    """
    if config is None:
        config = RadioConfig()
    return float(config.e_da * k_bits * max(1, num_signals))


def transmit_packet(
    sender: Dict[str, Any],
    receiver: Optional[Dict[str, Any]],
    k_bits: int,
    distance: float,
    config: Optional[RadioConfig] = None,
    is_in_jammer: bool = False
) -> bool:
    """
    Simulate a transmission: deducts tx energy from sender, rx energy from receiver.

    Args:
        sender: Sender node dictionary.
        receiver: Receiver node dictionary (or None if transmitting to Base Station).
        k_bits: Packet length in bits.
        distance: Distance in meters between sender and receiver.
        config: Radio model configuration.
        is_in_jammer: Whether link is affected by active RF jammer interference.

    Returns:
        True if packet is successfully delivered; False if dropped or sender died.
    """
    if sender["energy"] <= 0 or sender["state"] == "DEAD":
        return False

    # Calculate and deduct transmission energy from sender
    e_tx = calc_tx_energy(k_bits, distance, config)
    sender["energy"] = max(0.0, sender["energy"] - e_tx)
    if sender["energy"] <= 0.0:
        sender["state"] = "DEAD"
        return False

    # Check for packet loss due to jammer interference or extreme distance
    if is_in_jammer:
        drop_prob = 0.85
        if np.random.rand() < drop_prob:
            return False

    # Deduct reception energy from receiver node if it is a sensor (not Base Station)
    if receiver is not None and receiver["state"] != "DEAD":
        e_rx = calc_rx_energy(k_bits, config)
        receiver["energy"] = max(0.0, receiver["energy"] - e_rx)
        if receiver["energy"] <= 0.0:
            receiver["state"] = "DEAD"

    return True
