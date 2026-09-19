import numpy as np
import os
import pandas as pd
from optimization.coverage import get_grid_coverage_mask

class PSOHybridWSN:
    """
    Particle Swarm Optimization (PSO) based Hybrid LEACH-PEGASIS WSN Routing Protocol.
    Features:
    - Heterogeneous Energy Model (Normal, Advanced, Super nodes)
    - PSO-based Cluster Head selection based on fitness:
        * Residual Cluster-Head Energy
        * Cluster-Head to Sink Distance
        * Intra-Cluster Compactness Distance
        * Sensing Coverage & Sensing Overlap
    - Inter-cluster PEGASIS chain formation
    - Active / Sleep node management (sleeping nodes preserve energy)
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
        self.alpha = alpha  # Extra energy factor for advanced nodes
        self.beta = beta    # Extra energy factor for super nodes
        self.m_adv = m_adv  # Fraction of advanced nodes
        self.m_sup = m_sup  # Fraction of super nodes
        self.sensing_radius = sensing_radius
        self.grid_resolution = grid_resolution
        self.seed = seed
        self.active_indices = active_indices
        
        # First Order Radio Model Parameters
        self.ETX = 50e-9      # Transmit energy per bit
        self.ERX = 50e-9      # Receive energy per bit
        self.Efs = 50e-12     # Free space transmitter amplifier
        self.Emp = 0.0013e-11 # Multi-path transmitter amplifier
        self.EDA = 5e-9       # Data aggregation energy per bit
        self.k = 8000         # Data packet size in bits
        self.d0 = np.sqrt(self.Efs / self.Emp) # Threshold distance
        
        self.nodes = []
        self.grid_mask = None
        self.init_network(seed=seed)

    def dist(self, node_a, node_b):
        return np.sqrt((node_a["x"] - node_b["x"])**2 + (node_a["y"] - node_b["y"])**2)

    def dist_to_sink(self, node):
        return np.sqrt((node["x"] - self.sink[0])**2 + (node["y"] - self.sink[1])**2)

    def init_network(self, seed=None):
        """
        Initialize sensor nodes and heterogeneous energy distribution.
        External seed can be supplied for reproducible multi-seed evaluations.
        """
        if seed is not None:
            np.random.seed(seed)
        elif self.seed is not None:
            np.random.seed(self.seed)
            
        self.nodes = []
        num_adv = int(self.num_nodes * self.m_adv) if self.heterogeneous else 0
        num_sup = int(self.num_nodes * self.m_sup) if self.heterogeneous else 0
        
        for i in range(self.num_nodes):
            x = np.random.rand() * self.x_max
            y = np.random.rand() * self.y_max
            
            node_type = 'normal'
            e_init = self.E0
            
            if self.heterogeneous:
                if i < num_sup:
                    node_type = 'super'
                    e_init = self.E0 * (1 + self.beta)
                elif i < num_sup + num_adv:
                    node_type = 'advanced'
                    e_init = self.E0 * (1 + self.alpha)
            
            self.nodes.append({
                "id": i,
                "x": x,
                "y": y,
                "E": e_init,
                "max_E": e_init,
                "type": node_type,
                "G": 0
            })
            
        # Precompute vectorized grid coverage mask for high-speed PSO evaluations
        self.grid_mask = get_grid_coverage_mask(
            self.nodes,
            area_width=self.x_max,
            area_height=self.y_max,
            sensing_radius=self.sensing_radius,
            grid_resolution=self.grid_resolution
        )

    def pso_cluster_head_selection(self, alive_indices, num_ch=5, num_particles=20, max_iter=15):
        """
        PSO algorithm to find optimal cluster head configuration.
        Fitness formulation:
        Fitness = 2.0 * E_score + 100.0 * Sink_score + 50.0 * Intra_score + 100.0 * Coverage_score - 50.0 * Overlap_score
        """
        if len(alive_indices) <= num_ch:
            return alive_indices

        # Particle represents indices of CHs
        particles = [np.random.choice(alive_indices, size=num_ch, replace=False) for _ in range(num_particles)]
        
        pbest = list(particles)
        pbest_fitness = [self.evaluate_fitness(p, alive_indices) for p in particles]
        
        gbest_idx = np.argmax(pbest_fitness)
        gbest = particles[gbest_idx].copy()
        gbest_fitness = pbest_fitness[gbest_idx]
        
        for _ in range(max_iter):
            for p_i in range(num_particles):
                # Random swap mutation for exploration
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
        Calculate composite fitness score for a candidate CH set incorporating:
        1. Residual energy
        2. CH-to-sink distance
        3. Intra-cluster compactness
        4. Sensing coverage
        5. Sensing overlap
        """
        if len(ch_list) == 0:
            return -1e9
        
        # 1. Average residual energy of chosen CHs
        ch_energies = [self.nodes[idx]["E"] for idx in ch_list]
        avg_ch_energy = np.mean(ch_energies)
        
        # 2. Average distance from CHs to Sink
        ch_sink_dists = [self.dist_to_sink(self.nodes[idx]) for idx in ch_list]
        avg_sink_dist = np.mean(ch_sink_dists)
        sink_score = 1.0 / (avg_sink_dist + 1e-5)
        
        # 3. Compactness: Avg distance of non-CH alive nodes to nearest CH
        non_ch = [idx for idx in alive_indices if idx not in ch_list]
        if non_ch:
            intra_dists = []
            for n_idx in non_ch:
                d = min([self.dist(self.nodes[n_idx], self.nodes[ch]) for ch in ch_list])
                intra_dists.append(d)
            avg_intra_dist = np.mean(intra_dists)
            intra_score = 1.0 / (avg_intra_dist + 1e-5)
        else:
            intra_score = 1.0
            
        # 4 & 5. Coverage and Overlap scores using precomputed grid masks
        if self.grid_mask is not None and len(self.grid_mask) > 0:
            ch_submask = self.grid_mask[ch_list]  # Shape (num_ch, total_grid_pts)
            covered_pts = np.sum(np.any(ch_submask, axis=0))
            total_grid_pts = self.grid_mask.shape[1]
            coverage_score = covered_pts / (total_grid_pts + 1e-5)
            
            coverage_counts = np.sum(ch_submask, axis=0)
            overlap_pts = np.sum(coverage_counts > 1)
            overlap_score = overlap_pts / (covered_pts + 1e-5)
        else:
            coverage_score = 0.5
            overlap_score = 0.5
            
        # Representative Composite Fitness Score
        fitness = (
            2.0 * avg_ch_energy
            + 100.0 * sink_score
            + 50.0 * intra_score
            + 100.0 * coverage_score
            - 50.0 * overlap_score
        )
        return fitness

    def run_simulation(self, active_indices=None):
        """
        Execute WSN simulation.
        If active_indices is provided, only those active nodes participate in routing.
        Sleeping nodes do not transmit or receive packets, and preserve their residual energy.
        """
        # Determine participating node pool
        if active_indices is not None:
            participating_indices = set(active_indices)
        elif self.active_indices is not None:
            participating_indices = set(self.active_indices)
        else:
            participating_indices = set(range(self.num_nodes))

        total_participating = len(participating_indices)

        alive_history = []
        energy_history = []
        throughput_history = []
        energy_std_history = []
        
        total_packets = 0
        fnd, hnd, lnd = None, None, None
        
        for r in range(self.rmax):
            # Only consider alive nodes within the active participating set
            alive_indices = [i for i in participating_indices if self.nodes[i]["E"] > 0]
            num_alive = len(alive_indices)
            
            # Track FND, HND, LND lifecycle metrics
            if fnd is None and num_alive < total_participating:
                fnd = r
            if hnd is None and num_alive <= total_participating // 2:
                hnd = r
            if lnd is None and num_alive == 0:
                lnd = r
                
            if num_alive == 0:
                alive_history.append(0)
                energy_history.append(0)
                throughput_history.append(total_packets)
                energy_std_history.append(0)
                continue
            
            # Select CHs using Particle Swarm Optimization
            num_ch = max(1, int(0.05 * num_alive))
            CH = self.pso_cluster_head_selection(alive_indices, num_ch=num_ch)
            
            # Form clusters around CHs
            clusters = {ch: [] for ch in CH}
            for idx in alive_indices:
                if idx not in CH:
                    nearest_ch = min(CH, key=lambda c: self.dist(self.nodes[idx], self.nodes[c]))
                    clusters[nearest_ch].append(idx)

            # Intra-cluster PEGASIS chain transmission
            round_packets = 0
            for ch, members in clusters.items():
                if members:
                    # Form chain among cluster members
                    chain = members.copy()
                    ordered = [chain.pop(0)]
                    while chain:
                        last = ordered[-1]
                        nearest = min(chain, key=lambda m: self.dist(self.nodes[last], self.nodes[m]))
                        ordered.append(nearest)
                        chain.remove(nearest)
                    
                    local_k = self.k
                    for i_c in range(len(ordered) - 1):
                        u, v = ordered[i_c], ordered[i_c + 1]
                        if self.nodes[u]["E"] > 0:
                            self.nodes[u]["E"] -= 0.00005
                            d = self.dist(self.nodes[u], self.nodes[v])
                            tx_e = local_k * self.ETX + (local_k * self.Emp * (d**4) if d > self.d0 else local_k * self.Efs * (d**2))
                            self.nodes[u]["E"] -= tx_e
                            if self.nodes[v]["E"] > 0:
                                self.nodes[v]["E"] -= (local_k * self.ERX + local_k * self.EDA)
                            local_k *= 0.9 # Aggregation
                            round_packets += 1

                    # Send to CH
                    last_m = ordered[-1]
                    if self.nodes[last_m]["E"] > 0:
                        self.nodes[last_m]["E"] -= 0.00005
                        d = self.dist(self.nodes[last_m], self.nodes[ch])
                        tx_e = local_k * self.ETX + (local_k * self.Emp * (d**4) if d > self.d0 else local_k * self.Efs * (d**2))
                        self.nodes[last_m]["E"] -= tx_e
                        if self.nodes[ch]["E"] > 0:
                            self.nodes[ch]["E"] -= (local_k * self.ERX + local_k * self.EDA)

            # CH transmission to BS (or multi-hop CH)
            for ch in CH:
                if self.nodes[ch]["E"] > 0:
                    d_bs = self.dist_to_sink(self.nodes[ch])
                    tx_e = self.k * self.ETX + (self.k * self.Emp * (d_bs**4) if d_bs > self.d0 else self.k * self.Efs * (d_bs**2))
                    self.nodes[ch]["E"] -= tx_e
                    round_packets += 1
                    
            total_packets += round_packets
            
            # Compute stats across participating nodes
            alive_count = sum(1 for idx in participating_indices if self.nodes[idx]["E"] > 0)
            alive_energies = [self.nodes[idx]["E"] for idx in participating_indices if self.nodes[idx]["E"] > 0]
            avg_energy = np.mean(alive_energies) if alive_count > 0 else 0
            energy_std = np.std(alive_energies) if alive_count > 0 else 0
            
            alive_history.append(alive_count)
            energy_history.append(avg_energy)
            throughput_history.append(total_packets)
            energy_std_history.append(energy_std)

        return {
            "alive": alive_history,
            "energy": energy_history,
            "throughput": throughput_history,
            "energy_std": energy_std_history,
            "metrics": {
                "FND": fnd if fnd is not None else self.rmax,
                "HND": hnd if hnd is not None else self.rmax,
                "LND": lnd if lnd is not None else self.rmax,
                "total_throughput": total_packets
            }
        }

if __name__ == "__main__":
    pso_sim = PSOHybridWSN()
    results = pso_sim.run_simulation()
    print("PSO-Hybrid Simulation Completed Successfully.")
    print("Metrics:", results["metrics"])
