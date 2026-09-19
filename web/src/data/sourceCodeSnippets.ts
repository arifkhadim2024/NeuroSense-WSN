export interface SourceFileSnippet {
  id: string;
  name: string;
  path: string;
  language: string;
  category: 'Routing' | 'Optimization' | 'Coverage' | 'Benchmark';
  description: string;
  code: string;
}

export const SOURCE_FILES: SourceFileSnippet[] = [
  {
    id: 'pso_hybrid',
    name: 'pso_hybrid.py',
    path: 'pso_hybrid.py',
    language: 'python',
    category: 'Routing',
    description: 'Metaheuristic Particle Swarm Optimization (PSO) based Hybrid LEACH-PEGASIS routing with heterogeneous energy and active/sleep topology management.',
    code: `import numpy as np
import os
import pandas as pd
from optimization.coverage import get_grid_coverage_mask

class PSOHybridWSN:
    """
    Particle Swarm Optimization (PSO) based Hybrid LEACH-PEGASIS WSN Routing Protocol.
    Features:
    - Heterogeneous Energy Model (Normal 0.5J, Advanced 1.0J, Super 1.5J)
    - PSO-based Cluster Head selection based on multi-objective fitness:
        * Residual Cluster-Head Energy
        * Cluster-Head to Sink Distance
        * Intra-Cluster Compactness Distance
        * Sensing Coverage & Sensing Overlap
    - Inter-cluster PEGASIS chain formation
    - Active / Sleep node management (sleeping nodes preserve 100% energy)
    - Multi-metric tracking (FND, HND, LND, Throughput, Energy Variance)
    """
    def __init__(self, num_nodes=100, x_max=100, y_max=100, E0=0.5, rmax=1000, sink=(50, 150),
                 heterogeneous=True, alpha=1.0, beta=2.0, m_adv=0.2, m_sup=0.1,
                 sensing_radius=10, grid_resolution=2, seed=None, active_indices=None):
        self.num_nodes = num_nodes
        self.x_max = x_max
        self.y_max = y_max
        self.E0 = E0
        self.rmax = rmax
        self.sink = np.array(sink)
        self.heterogeneous = heterogeneous
        self.alpha = alpha  # Extra energy factor for advanced nodes (1 + alpha)
        self.beta = beta    # Extra energy factor for super nodes (1 + beta)
        self.m_adv = m_adv  # Fraction of advanced nodes (20%)
        self.m_sup = m_sup  # Fraction of super nodes (10%)
        self.sensing_radius = sensing_radius
        self.grid_resolution = grid_resolution
        self.seed = seed
        self.active_indices = active_indices
        
        # First-Order Radio Model Parameters
        self.ETX = 50e-9      # Transmit energy per bit (50 nJ/bit)
        self.ERX = 50e-9      # Receive energy per bit (50 nJ/bit)
        self.Efs = 50e-12     # Free space amplifier (50 pJ/bit/m^2)
        self.Emp = 0.0013e-11 # Multi-path amplifier (0.0013 pJ/bit/m^4)
        self.EDA = 5e-9       # Data aggregation energy (5 nJ/bit/signal)
        self.k = 8000         # Packet size (8000 bits / 1000 bytes)
        self.d0 = np.sqrt(self.Efs / self.Emp) # Threshold distance (~87.7 m)
        
        self.nodes = []
        self.grid_mask = None
        self.init_network(seed=seed)

    def dist(self, node_a, node_b):
        return np.sqrt((node_a["x"] - node_b["x"])**2 + (node_a["y"] - node_b["y"])**2)

    def dist_to_sink(self, node):
        return np.sqrt((node["x"] - self.sink[0])**2 + (node["y"] - self.sink[1])**2)

    def pso_cluster_head_selection(self, alive_indices, num_ch=5, num_particles=20, max_iter=15):
        """
        PSO algorithm to find optimal cluster head configuration.
        Fitness = 2.0*E_score + 100.0*Sink_score + 50.0*Intra_score + 100.0*Coverage_score - 50.0*Overlap_score
        """
        if len(alive_indices) <= num_ch:
            return alive_indices

        particles = [np.random.choice(alive_indices, size=num_ch, replace=False) for _ in range(num_particles)]
        pbest = list(particles)
        pbest_fitness = [self.evaluate_fitness(p, alive_indices) for p in particles]
        
        gbest_idx = np.argmax(pbest_fitness)
        gbest = particles[gbest_idx].copy()
        gbest_fitness = pbest_fitness[gbest_idx]
        
        for _ in range(max_iter):
            for p_i in range(num_particles):
                if np.random.rand() < 0.3:
                    idx_to_change = np.random.randint(0, num_ch)
                    new_ch = np.random.choice(alive_indices)
                    if new_ch not in particles[p_i]:
                        particles[p_i][idx_to_change] = new_ch

                current_fitness = self.evaluate_fitness(particles[p_i], alive_indices)
                if current_fitness > pbest_fitness[p_i]:
                    pbest[p_i] = particles[p_i].copy()
                    pbest_fitness[p_i] = current_fitness
                    if current_fitness > gbest_fitness:
                        gbest = particles[p_i].copy()
                        gbest_fitness = current_fitness
                        
        return list(gbest)

    def evaluate_fitness(self, ch_list, alive_indices):
        """
        Composite fitness function balancing energy, sink proximity, compactness, coverage, and overlap.
        """
        if len(ch_list) == 0:
            return -1e9
        
        # 1. Residual Energy of CHs
        ch_energies = [self.nodes[idx]["E"] for idx in ch_list]
        avg_ch_energy = np.mean(ch_energies)
        
        # 2. Distance to Sink
        ch_sink_dists = [self.dist_to_sink(self.nodes[idx]) for idx in ch_list]
        avg_sink_dist = np.mean(ch_sink_dists)
        sink_score = 1.0 / (avg_sink_dist + 1e-5)
        
        # 3. Compactness
        non_ch = [idx for idx in alive_indices if idx not in ch_list]
        if non_ch:
            intra_dists = [min([self.dist(self.nodes[n_idx], self.nodes[ch]) for ch in ch_list]) for n_idx in non_ch]
            avg_intra_dist = np.mean(intra_dists)
            intra_score = 1.0 / (avg_intra_dist + 1e-5)
        else:
            intra_score = 1.0
            
        # 4 & 5. Coverage and Overlap
        if self.grid_mask is not None and len(self.grid_mask) > 0:
            ch_submask = self.grid_mask[ch_list]
            covered_pts = np.sum(np.any(ch_submask, axis=0))
            total_grid_pts = self.grid_mask.shape[1]
            coverage_score = covered_pts / (total_grid_pts + 1e-5)
            overlap_pts = np.sum(np.sum(ch_submask, axis=0) > 1)
            overlap_score = overlap_pts / (covered_pts + 1e-5)
        else:
            coverage_score, overlap_score = 0.5, 0.5
            
        fitness = (
            2.0 * avg_ch_energy
            + 100.0 * sink_score
            + 50.0 * intra_score
            + 100.0 * coverage_score
            - 50.0 * overlap_score
        )
        return fitness`
  },
  {
    id: 'ann_selector',
    name: 'ann_selector.py',
    path: 'optimization/ann_selector.py',
    language: 'python',
    category: 'Optimization',
    description: 'Artificial Neural Network (MLPClassifier) for intelligent node-state prediction based on 6 analytical features.',
    code: `import os
import numpy as np
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from .coverage import get_grid_coverage_mask

class ANNNodeSelector:
    """
    Artificial Neural Network (ANN) based sensor-node state predictor (ACTIVE vs. SLEEP).
    
    6 Analytical Input Features:
    1. energy: Residual energy of the sensor node
    2. sink_distance: Euclidean distance from node to Sink (50, 150)
    3. neighbors: Neighbor count within communication range (2 * sensing_radius)
    4. coverage_contribution: Fraction of grid points uniquely covered by this node
    5. overlap_ratio: Fraction of sensing area overlapping with other nodes
    6. node_density: Local node density in the immediate neighborhood
    """
    def __init__(
        self,
        hidden_layer_sizes=(16, 8),
        activation="relu",
        solver="adam",
        learning_rate_init=0.001,
        max_iter=500,
        random_state=42
    ):
        self.model = MLPClassifier(
            hidden_layer_sizes=hidden_layer_sizes,
            activation=activation,
            solver=solver,
            learning_rate_init=learning_rate_init,
            max_iter=max_iter,
            random_state=random_state
        )
        self.scaler = StandardScaler()
        self.is_fitted = False

    @staticmethod
    def extract_features(nodes, sink=(50, 150), area_width=100, area_height=100, sensing_radius=10, grid_resolution=2):
        coords = np.array([[n["x"], n["y"]] for n in nodes])
        energies = np.array([n.get("E", 0.5) for n in nodes])
        
        # 1. Energy, 2. Sink Distance
        sink_arr = np.array(sink)
        sink_distances = np.sqrt(np.sum((coords - sink_arr) ** 2, axis=1))
        
        # 3. Neighbors & 6. Local Node Density
        diffs = coords[:, np.newaxis, :] - coords[np.newaxis, :, :]
        dist_matrix = np.sqrt(np.sum(diffs ** 2, axis=2))
        comm_range = 2.0 * sensing_radius
        neighbor_counts = np.sum((dist_matrix <= comm_range) & (dist_matrix > 1e-6), axis=1)
        node_density = neighbor_counts / ((np.pi * (comm_range ** 2)) / 100.0)
        
        # 4. Coverage Contribution & 5. Overlap Ratio
        coverage_mask = get_grid_coverage_mask(nodes, area_width, area_height, sensing_radius, grid_resolution)
        total_covered = np.sum(coverage_mask, axis=1)
        overall_counts = np.sum(coverage_mask, axis=0)
        
        unique_contrib = np.sum(coverage_mask & (overall_counts == 1)[np.newaxis, :], axis=1)
        coverage_contribution = np.where(total_covered > 0, unique_contrib / total_covered, 0.0)
        
        overlap_points = np.sum(coverage_mask & (overall_counts > 1)[np.newaxis, :], axis=1)
        overlap_ratio = np.where(total_covered > 0, overlap_points / total_covered, 0.0)
        
        return np.column_stack([
            energies, sink_distances, neighbor_counts,
            coverage_contribution, overlap_ratio, node_density
        ])`
  },
  {
    id: 'node_optimizer',
    name: 'node_optimizer.py',
    path: 'optimization/node_optimizer.py',
    language: 'python',
    category: 'Optimization',
    description: 'Greedy coverage-preserving and overlap-reducing node optimizer enforcing strict delta <= 1.0% coverage constraint.',
    code: `import numpy as np
from .coverage import calculate_coverage
from .overlap import calculate_overlap

class CoverageOptimizer:
    """
    Coverage-Preserving Active/Sleep Node Selection with Sensing-Overlap Reduction.
    
    Pipeline:
    1. Start with ANN-predicted active/sleep states.
    2. Compute baseline coverage from all alive nodes.
    3. Target coverage = baseline_coverage - 1.0 (percentage points).
    4. Greedily add sleeping nodes if initial ANN coverage < target_coverage.
    5. Prune redundant active nodes to minimize overlap while keeping coverage >= target.
    """
    def __init__(self, area_width=100, area_height=100, sensing_radius=10, grid_resolution=2):
        self.area_width = area_width
        self.area_height = area_height
        self.sensing_radius = sensing_radius
        self.grid_resolution = grid_resolution

    def optimize(self, nodes, ann_predictions):
        alive_indices = [i for i, n in enumerate(nodes) if n.get("E", 1.0) > 0]
        alive_nodes = [nodes[i] for i in alive_indices]
        
        baseline_cov = calculate_coverage(alive_nodes, self.area_width, self.area_height, self.sensing_radius, self.grid_resolution)
        target_cov = max(0.0, baseline_cov - 1.0)
        
        active_set = set([i for i in alive_indices if ann_predictions[i] == 1])
        sleep_set = set([i for i in alive_indices if ann_predictions[i] == 0])
        
        # Step 1: Greedily add sleeping nodes until target coverage is met
        current_cov = calculate_coverage([nodes[i] for i in active_set], self.area_width, self.area_height, self.sensing_radius, self.grid_resolution)
        while current_cov < target_cov and sleep_set:
            best_node = max(sleep_set, key=lambda i: calculate_coverage([nodes[x] for x in active_set | {i}], self.area_width, self.area_height, self.sensing_radius, self.grid_resolution))
            active_set.add(best_node)
            sleep_set.remove(best_node)
            current_cov = calculate_coverage([nodes[i] for i in active_set], self.area_width, self.area_height, self.sensing_radius, self.grid_resolution)
            
        # Step 2: Prune redundant active nodes to minimize overlap
        improved = True
        while improved:
            improved = False
            best_removal = None
            best_overlap = calculate_overlap([nodes[i] for i in active_set], self.area_width, self.area_height, self.sensing_radius, self.grid_resolution)
            
            for candidate in list(active_set):
                tentative = active_set - {candidate}
                cov = calculate_coverage([nodes[i] for i in tentative], self.area_width, self.area_height, self.sensing_radius, self.grid_resolution)
                if cov >= target_cov:
                    ovl = calculate_overlap([nodes[i] for i in tentative], self.area_width, self.area_height, self.sensing_radius, self.grid_resolution)
                    if ovl < best_overlap:
                        best_overlap = ovl
                        best_removal = candidate
            
            if best_removal is not None:
                active_set.remove(best_removal)
                sleep_set.add(best_removal)
                improved = True
                
        return {
            "active_indices": sorted(list(active_set)),
            "sleep_indices": sorted(list(sleep_set)),
            "coverage": calculate_coverage([nodes[i] for i in active_set], self.area_width, self.area_height, self.sensing_radius, self.grid_resolution),
            "overlap": calculate_overlap([nodes[i] for i in active_set], self.area_width, self.area_height, self.sensing_radius, self.grid_resolution)
        }`
  },
  {
    id: 'coverage',
    name: 'coverage.py',
    path: 'optimization/coverage.py',
    language: 'python',
    category: 'Coverage',
    description: 'Grid-discretization spatial coverage model over the 100m x 100m sensor deployment field.',
    code: `import numpy as np

def calculate_coverage(nodes, area_width=100, area_height=100, sensing_radius=10, grid_resolution=2):
    """
    Calculate sensing coverage ratio of active nodes using 2m grid discretization.
    """
    if not nodes:
        return 0.0

    coords = [[n["x"], n["y"]] for n in nodes if n.get("E", 1.0) > 0]
    if not coords:
        return 0.0

    node_arr = np.array(coords)
    x_ticks = np.arange(0, area_width + 1e-5, grid_resolution)
    y_ticks = np.arange(0, area_height + 1e-5, grid_resolution)
    xx, yy = np.meshgrid(x_ticks, y_ticks)
    grid_points = np.column_stack((xx.ravel(), yy.ravel()))

    rs_sq = sensing_radius ** 2
    diffs = grid_points[:, np.newaxis, :] - node_arr[np.newaxis, :, :]
    dist_sq = np.sum(diffs ** 2, axis=2)
    is_covered = np.any(dist_sq <= rs_sq, axis=1)

    return float((np.sum(is_covered) / grid_points.shape[0]) * 100.0)`
  },
  {
    id: 'overlap',
    name: 'overlap.py',
    path: 'optimization/overlap.py',
    language: 'python',
    category: 'Coverage',
    description: 'Sensing overlap redundancy calculation among active sensors.',
    code: `import numpy as np

def calculate_overlap(nodes, area_width=100, area_height=100, sensing_radius=10, grid_resolution=2):
    """
    Calculate sensing overlap percentage (covered points covered by >1 sensor).
    """
    coords = [[n["x"], n["y"]] for n in nodes if n.get("E", 1.0) > 0]
    if len(coords) <= 1:
        return 0.0

    node_arr = np.array(coords)
    x_ticks = np.arange(0, area_width + 1e-5, grid_resolution)
    y_ticks = np.arange(0, area_height + 1e-5, grid_resolution)
    xx, yy = np.meshgrid(x_ticks, y_ticks)
    grid_points = np.column_stack((xx.ravel(), yy.ravel()))

    rs_sq = sensing_radius ** 2
    diffs = grid_points[:, np.newaxis, :] - node_arr[np.newaxis, :, :]
    sensors_per_point = np.sum(np.sum(diffs ** 2, axis=2) <= rs_sq, axis=1)

    covered = np.sum(sensors_per_point >= 1)
    overlap = np.sum(sensors_per_point > 1)

    return float((overlap / covered) * 100.0) if covered > 0 else 0.0`
  },
  {
    id: 'hybrid',
    name: 'hybrid.py',
    path: 'hybrid.py',
    language: 'python',
    category: 'Routing',
    description: 'Standard Hybrid LEACH-PEGASIS protocol with intra-cluster nearest neighbor chaining and cluster head forwarding.',
    code: `import numpy as np
import matplotlib.pyplot as plt

# Parameters
n = 100
xm, ym = 100, 100
Eo = 0.5
rmax = 1000
sink = np.array([50, 150])

# First-Order Radio Model
ETX = 50e-9
ERX = 50e-9
Efs = 50e-12
Emp = 0.0013e-11
EDA = 5e-9
k = 8000
do = np.sqrt(Efs / Emp)

# Simulation loop with rotational CH selection and PEGASIS chaining inside clusters
# Multi-hop between CHs if inter-CH distance < 75m, otherwise direct to BS.`
  },
  {
    id: 'leach',
    name: 'leach.py',
    path: 'leach.py',
    language: 'python',
    category: 'Routing',
    description: 'Low Energy Adaptive Clustering Hierarchy (LEACH) baseline protocol with probabilistic CH rotation.',
    code: `import numpy as np

# LEACH Threshold Function: T(n) = p / (1 - p * (r mod (1/p))) for n in G
# Member nodes transmit directly to chosen Cluster Head.
# Cluster Heads aggregate and transmit directly to Sink.`
  },
  {
    id: 'pegasis',
    name: 'pegasis.py',
    path: 'pegasis.py',
    language: 'python',
    category: 'Routing',
    description: 'Power-Efficient GAthering in Sensor Information Systems (PEGASIS) global greedy chain routing.',
    code: `import numpy as np

# Global nearest-neighbor chain formation connecting all active nodes.
# Token-passing along chain to rotating chain leader.
# Leader performs data aggregation and transmits single packet to Sink.`
  }
];
