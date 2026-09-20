"""
Configuration and Simulation Parameters for NeuroSense-WSN v2.
Defines all physical, radio, network, and optimization parameters in one place.
"""

from dataclasses import dataclass, field
from typing import Tuple, List, Dict, Any
import numpy as np


@dataclass
class RadioConfig:
    """First-order radio energy dissipation model parameters."""
    # Transmitter and receiver electronics energy (J/bit)
    e_elec: float = 50e-9
    # Free-space amplification parameter for d < d0 (J/bit/m^2)
    eps_fs: float = 10e-12
    # Multi-path amplification parameter for d >= d0 (J/bit/m^4)
    eps_mp: float = 0.0013e-12
    # Data aggregation energy per bit per signal (J/bit/signal)
    e_da: float = 5e-9
    # Standard data packet size in bits
    packet_bits: int = 4000
    # Control packet size in bits
    control_packet_bits: int = 200
    # Sleep power spent per round (fraction of active idle cost)
    sleep_energy_per_round: float = 1e-6
    # Active node sensing energy per round (J/round)
    sensing_energy_per_round: float = 5e-6
    # Path loss exponent (2.0 = free space, 2.5-4.0 = obstructed / urban)
    path_loss_exp: float = 2.0
    # Log-normal shadowing standard deviation in dB (0.0 = disabled)
    shadowing_std_db: float = 0.0

    @property
    def d0(self) -> float:
        """Crossover distance threshold where free-space transitions to multipath."""
        return float(np.sqrt(self.eps_fs / self.eps_mp))


@dataclass
class NetworkConfig:
    """Sensor network spatial layout and node property configuration."""
    # Field dimensions in meters (width, height)
    area_size: Tuple[float, float] = (100.0, 100.0)
    # Base station (sink) coordinates (x, y)
    sink_pos: Tuple[float, float] = (50.0, 150.0)
    # Total number of deployed sensor nodes
    num_nodes: int = 50
    # Sensing radius in meters (Rs)
    sensing_radius: float = 15.0
    # Communication radius in meters (Rc), default is 2 * Rs
    comm_radius: float = 30.0
    # Deployment distribution: 'random', 'clustered', or 'grid'
    deployment_type: str = "random"
    # Base initial battery energy for normal nodes in Joules
    e0: float = 0.5
    # Fraction of normal nodes (E0)
    normal_ratio: float = 0.70
    # Fraction of advanced nodes (E0 * (1 + alpha))
    advanced_ratio: float = 0.20
    # Fraction of super nodes (E0 * (1 + beta))
    super_ratio: float = 0.10
    # Energy multiplier for advanced nodes
    alpha: float = 1.0
    # Energy multiplier for super nodes
    beta: float = 2.0
    # Discrete grid resolution in meters for coverage evaluation
    grid_resolution: float = 1.0


@dataclass
class PSOConfig:
    """Multi-Objective Particle Swarm Optimization weights for Cluster Head selection."""
    num_particles: int = 12
    max_iterations: int = 12
    w_inertia: float = 0.72
    c_personal: float = 1.49
    c_social: float = 1.49
    # Fitness component weights (must sum to 1.0)
    w_energy: float = 0.35      # Maximizes residual battery
    w_sink_dist: float = 0.25   # Minimizes distance to Base Station
    w_intra_dist: float = 0.20  # Minimizes distance within clusters
    w_coverage: float = 0.10    # Maximizes active coverage
    w_overlap: float = 0.10     # Minimizes sensing overlap


@dataclass
class SimConfig:
    """Master simulation configuration combining all subsystem parameters."""
    network: NetworkConfig = field(default_factory=NetworkConfig)
    radio: RadioConfig = field(default_factory=RadioConfig)
    pso: PSOConfig = field(default_factory=PSOConfig)
    # Maximum number of simulation rounds to run (options: 500, 1000, 2000, 3000)
    max_rounds: int = 3000
    # Interval in rounds to re-evaluate sleep scheduling (dynamic rotation)
    sleep_rotation_interval: int = 50
    # Coverage preservation epsilon tolerance for sleep scheduler (percentage)
    coverage_epsilon: float = 1.0
    # Global random seed for reproducible experiments
    seed: int = 42


# Scenario presets for benchmark comparisons
SCENARIO_PRESETS: Dict[str, Dict[str, Any]] = {
    "s1": {
        "id": "s1",
        "name": "Scenario 1: Sparse Grid",
        "description": "N=30 nodes, Rs=10m. Tests low-redundancy spatial coverage.",
        "num_nodes": 30,
        "sensing_radius": 10.0,
        "comm_radius": 20.0,
        "deployment_type": "random"
    },
    "s2": {
        "id": "s2",
        "name": "Scenario 2: Standard Benchmark",
        "description": "N=50 nodes, Rs=15m. Standard research baseline topology.",
        "num_nodes": 50,
        "sensing_radius": 15.0,
        "comm_radius": 30.0,
        "deployment_type": "random"
    },
    "s3": {
        "id": "s3",
        "name": "Scenario 3: High Density Cluster",
        "description": "N=80 nodes, Rs=12m. High sensing overlap and dense clusters.",
        "num_nodes": 80,
        "sensing_radius": 12.0,
        "comm_radius": 24.0,
        "deployment_type": "clustered"
    },
    "s4": {
        "id": "s4",
        "name": "Scenario 4: Extended Network Array",
        "description": "N=100 nodes, Rs=15m. Large-scale multi-cluster deployment.",
        "num_nodes": 100,
        "sensing_radius": 15.0,
        "comm_radius": 30.0,
        "deployment_type": "grid"
    }
}
