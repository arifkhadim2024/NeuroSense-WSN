"""
Unit Tests for Radio Dissipation Model and Energy Conservation.
"""

import pytest
import numpy as np
from src.config import RadioConfig
from src.radio import (
    calc_tx_energy,
    calc_rx_energy,
    calc_aggregation_energy,
    transmit_packet
)


def test_d0_threshold():
    """Verify crossover distance d0 calculation."""
    cfg = RadioConfig(eps_fs=10e-12, eps_mp=0.0013e-12)
    expected_d0 = np.sqrt(10e-12 / 0.0013e-12)
    assert abs(cfg.d0 - expected_d0) < 1e-4
    assert abs(cfg.d0 - 87.7058) < 0.01


def test_tx_energy_free_space():
    """Verify free-space transmission energy when distance < d0."""
    cfg = RadioConfig(e_elec=50e-9, eps_fs=10e-12, eps_mp=0.0013e-12, path_loss_exp=2.0)
    k = 4000
    d = 20.0  # d < d0 (~87.7m)
    expected = (k * 50e-9) + (k * 10e-12 * (20.0 ** 2))
    computed = calc_tx_energy(k, d, cfg)
    assert abs(computed - expected) < 1e-12


def test_tx_energy_multipath():
    """Verify multipath transmission energy when distance >= d0."""
    cfg = RadioConfig(e_elec=50e-9, eps_fs=10e-12, eps_mp=0.0013e-12, path_loss_exp=2.0)
    k = 4000
    d = 100.0  # d >= d0
    expected = (k * 50e-9) + (k * 0.0013e-12 * (100.0 ** 4))
    computed = calc_tx_energy(k, d, cfg)
    assert abs(computed - expected) < 1e-12


def test_rx_and_aggregation_energy():
    """Verify reception and data aggregation formulas."""
    cfg = RadioConfig(e_elec=50e-9, e_da=5e-9)
    k = 4000
    expected_rx = 4000 * 50e-9
    assert abs(calc_rx_energy(k, cfg) - expected_rx) < 1e-12

    expected_agg = 5 * 4000 * 5e-9
    assert abs(calc_aggregation_energy(k, 5, cfg) - expected_agg) < 1e-12


def test_energy_conservation_in_transmission():
    """Verify that transmission deducts exact computed energy from sender and receiver."""
    cfg = RadioConfig(e_elec=50e-9, eps_fs=10e-12, path_loss_exp=2.0)
    sender = {"id": 0, "x": 10.0, "y": 10.0, "energy": 0.5, "state": "ACTIVE"}
    receiver = {"id": 1, "x": 30.0, "y": 10.0, "energy": 0.5, "state": "ACTIVE"}

    d = 20.0
    k = 4000
    e_tx = calc_tx_energy(k, d, cfg)
    e_rx = calc_rx_energy(k, cfg)

    initial_total = sender["energy"] + receiver["energy"]
    success = transmit_packet(sender, receiver, k, d, cfg)

    assert success is True
    final_total = sender["energy"] + receiver["energy"]
    spent = initial_total - final_total

    assert abs(spent - (e_tx + e_rx)) < 1e-12
    assert abs(sender["energy"] - (0.5 - e_tx)) < 1e-12
    assert abs(receiver["energy"] - (0.5 - e_rx)) < 1e-12
