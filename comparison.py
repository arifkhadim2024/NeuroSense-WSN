import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
import os
import json
from pso_hybrid import PSOHybridWSN

np.random.seed(42)

# ================= PARAMETERS =================
n = 100
xm, ym = 100, 100
Eo = 0.5
p = 0.1
rmax = 1000

ETX = 50e-9
ERX = 50e-9
Efs = 50e-12
Emp = 0.0013e-11
EDA = 5e-9
k = 8000

do = np.sqrt(Efs / Emp)
sink = np.array([50, 150])

# ================= FUNCTIONS =================
def dist(a, b):
    return np.sqrt((a["x"] - b["x"])**2 + (a["y"] - b["y"])**2)

def init_nodes(initial_energy=Eo, use_csv=False, default_num_nodes=n, x_max=xm, y_max=ym):
    S = []
    num_nodes_actual = default_num_nodes
    if use_csv:
        csv_path = '/content/WSN_Dataset.csv'
        if os.path.exists(csv_path):
            try:
                df_nodes = pd.read_csv(csv_path)
                num_nodes_actual = len(df_nodes)
                for i in range(num_nodes_actual):
                    S.append({
                        "x": df_nodes.loc[i, 'X_Coordinate'],
                        "y": df_nodes.loc[i, 'Y_Coordinate'],
                        "E": initial_energy,
                        "G": 0
                    })
                print(f"Initialized {num_nodes_actual} nodes from dataset")
            except Exception as e:
                print(f"Fallback to random coordinates: {e}")
                for _ in range(default_num_nodes):
                    S.append({
                        "x": np.random.rand() * x_max,
                        "y": np.random.rand() * y_max,
                        "E": initial_energy,
                        "G": 0
                    })
        else:
            for _ in range(default_num_nodes):
                S.append({
                    "x": np.random.rand() * x_max,
                    "y": np.random.rand() * y_max,
                    "E": initial_energy,
                    "G": 0
                })
    else:
        for _ in range(default_num_nodes):
            S.append({
                "x": np.random.rand() * x_max,
                "y": np.random.rand() * y_max,
                "E": initial_energy,
                "G": 0
            })
    return S, num_nodes_actual

# Helper to compute lifecycle metrics (FND, HND, LND)
def compute_lifecycle_metrics(alive_list, total_nodes):
    fnd, hnd, lnd = None, None, None
    for r, alive in enumerate(alive_list):
        if fnd is None and alive < total_nodes:
            fnd = r
        if hnd is None and alive <= total_nodes // 2:
            hnd = r
        if lnd is None and alive == 0:
            lnd = r
            break
    max_rounds = len(alive_list)
    return {
        "FND": fnd if fnd is not None else max_rounds,
        "HND": hnd if hnd is not None else max_rounds,
        "LND": lnd if lnd is not None else max_rounds,
    }

# =====================================================
# 1. LEACH PROTOCOL
# =====================================================
S_leach, n_leach = init_nodes(use_csv=True)
leach_alive = []
leach_energy = []
leach_throughput = []
leach_packets = 0

for r in range(rmax):
    if r % int(1/p) == 0:
        for node in S_leach:
            node["G"] = 0

    CH = []
    for i, node in enumerate(S_leach):
        if node["E"] > 0 and node["G"] == 0:
            if np.random.rand() <= p:
                node["G"] = int(1/p)
                CH.append(i)

    for i, node in enumerate(S_leach):
        if node["E"] <= 0: continue
        node["E"] -= 0.00005

        if CH:
            nearest = min(CH, key=lambda c: dist(node, S_leach[c]))
            d = dist(node, S_leach[nearest])
            if d > do:
                node["E"] -= (k * ETX + k * Emp * d**4)
            else:
                node["E"] -= (k * ETX + k * Efs * d**2)
            S_leach[nearest]["E"] -= (k * ERX + k * EDA)
            leach_packets += 1
        else:
            d = dist(node, {"x": sink[0], "y": sink[1]})
            if d > do:
                node["E"] -= (k * ETX + k * Emp * d**4)
            else:
                node["E"] -= (k * ETX + k * Efs * d**2)
            leach_packets += 1

    for c in CH:
        if S_leach[c]["E"] > 0:
            d = dist(S_leach[c], {"x": sink[0], "y": sink[1]})
            if d > do:
                S_leach[c]["E"] -= (k * ETX + k * Emp * d**4)
            else:
                S_leach[c]["E"] -= (k * ETX + k * Efs * d**2)
            leach_packets += 1

    alive = sum(1 for node in S_leach if node["E"] > 0)
    total = sum(node["E"] for node in S_leach if node["E"] > 0)
    leach_alive.append(alive)
    leach_energy.append(total / alive if alive > 0 else 0)
    leach_throughput.append(leach_packets)

# =====================================================
# 2. PEGASIS PROTOCOL
# =====================================================
S_pegasis, n_pegasis = init_nodes(use_csv=True)
pegasis_alive = []
pegasis_energy = []
pegasis_throughput = []
pegasis_packets = 0

def create_chain(S_nodes):
    alive_nodes_indices = [i for i, node in enumerate(S_nodes) if node["E"] > 0]
    if not alive_nodes_indices:
        return []
    distances_to_sink_for_alive = [np.sqrt((S_nodes[i]["x"] - sink[0])**2 + (S_nodes[i]["y"] - sink[1])**2) for i in alive_nodes_indices]
    farthest_node_idx_in_alive_list = np.argmax(distances_to_sink_for_alive)
    start_node_original_idx = alive_nodes_indices[farthest_node_idx_in_alive_list]

    chain = [start_node_original_idx]
    remaining_alive_nodes_indices = [idx for idx in alive_nodes_indices if idx != start_node_original_idx]

    while remaining_alive_nodes_indices:
        last_node_in_chain = chain[-1]
        nearest_node_original_idx = min(remaining_alive_nodes_indices, key=lambda i: dist(S_nodes[last_node_in_chain], S_nodes[i]))
        chain.append(nearest_node_original_idx)
        remaining_alive_nodes_indices.remove(nearest_node_original_idx)
    return chain

for r in range(rmax):
    chain = create_chain(S_pegasis)
    if not chain:
        pegasis_alive.append(0)
        pegasis_energy.append(0)
        pegasis_throughput.append(pegasis_packets)
        continue

    leader = chain[r % len(chain)]
    for i in range(len(chain) - 1):
        a, b = chain[i], chain[i + 1]
        if S_pegasis[a]["E"] > 0:
            S_pegasis[a]["E"] -= 0.00005
            d = dist(S_pegasis[a], S_pegasis[b])
            if d > do:
                S_pegasis[a]["E"] -= (k * ETX + k * Emp * d**4)
            else:
                S_pegasis[a]["E"] -= (k * ETX + k * Efs * d**2)
            if S_pegasis[b]["E"] > 0:
                S_pegasis[b]["E"] -= (k * ERX + k * EDA)
            pegasis_packets += 1

    if S_pegasis[leader]["E"] > 0:
        d = dist(S_pegasis[leader], {"x": sink[0], "y": sink[1]})
        if d > do:
            S_pegasis[leader]["E"] -= (k * ETX + k * Emp * d**4)
        else:
            S_pegasis[leader]["E"] -= (k * ETX + k * Efs * d**2)
        pegasis_packets += 1

    alive = sum(1 for node in S_pegasis if node["E"] > 0)
    total = sum(node["E"] for node in S_pegasis if node["E"] > 0)
    pegasis_alive.append(alive)
    pegasis_energy.append(total / alive if alive > 0 else 0)
    pegasis_throughput.append(pegasis_packets)

# =====================================================
# 3. HYBRID PROTOCOL (Standard)
# =====================================================
S_hybrid, n_hybrid = init_nodes(use_csv=True)
hybrid_alive = []
hybrid_energy = []
hybrid_throughput = []
hybrid_packets = 0

for r in range(rmax):
    energies = [node["E"] for node in S_hybrid]
    sorted_nodes = np.argsort(energies)[::-1]
    num_ch = max(1, int(0.05 * n_hybrid))
    CH = sorted_nodes[(r * num_ch) % n_hybrid : (r * num_ch) % n_hybrid + num_ch].tolist()
    CH = [ch_idx for ch_idx in CH if S_hybrid[ch_idx]["E"] > 0]

    clusters = {ch: [] for ch in CH}
    for i, node in enumerate(S_hybrid):
        if node["E"] > 0 and i not in CH:
            if CH:
                nearest = min(CH, key=lambda c: dist(node, S_hybrid[c]))
                clusters[nearest].append(i)

    for ch, members in clusters.items():
        if S_hybrid[ch]["E"] <= 0: continue
        if members:
            chain = members.copy()
            ordered = [chain.pop(0)]
            while chain:
                last = ordered[-1]
                nearest = min(chain, key=lambda i: dist(S_hybrid[last], S_hybrid[i]))
                ordered.append(nearest)
                chain.remove(nearest)

            local_k = k
            for i_chain in range(len(ordered) - 1):
                a, b = ordered[i_chain], ordered[i_chain + 1]
                if S_hybrid[a]["E"] > 0:
                    S_hybrid[a]["E"] -= 0.00005
                    d = dist(S_hybrid[a], S_hybrid[b])
                    if d > do:
                        S_hybrid[a]["E"] -= (local_k * ETX + local_k * Emp * d**4)
                    else:
                        S_hybrid[a]["E"] -= (local_k * ETX + local_k * Efs * d**2)
                    if S_hybrid[b]["E"] > 0:
                        S_hybrid[b]["E"] -= (local_k * ERX + local_k * EDA)
                    local_k *= 0.8
                    hybrid_packets += 1

            last_node_in_chain = ordered[-1]
            if S_hybrid[last_node_in_chain]["E"] > 0:
                S_hybrid[last_node_in_chain]["E"] -= 0.00005
                d = dist(S_hybrid[last_node_in_chain], S_hybrid[ch])
                if d > do:
                    S_hybrid[last_node_in_chain]["E"] -= (local_k * ETX + local_k * Emp * d**4)
                else:
                    S_hybrid[last_node_in_chain]["E"] -= (local_k * ETX + local_k * Efs * d**2)
                if S_hybrid[ch]["E"] > 0:
                    S_hybrid[ch]["E"] -= (local_k * ERX + local_k * EDA)

    for ch_idx in CH:
        if S_hybrid[ch_idx]["E"] > 0:
            d_ch_to_bs = dist(S_hybrid[ch_idx], {"x": sink[0], "y": sink[1]})
            if d_ch_to_bs > do:
                S_hybrid[ch_idx]["E"] -= (k * ETX + k * Emp * d_ch_to_bs**4)
            else:
                S_hybrid[ch_idx]["E"] -= (k * ETX + k * Efs * d_ch_to_bs**2)
            hybrid_packets += 1

    alive = sum(1 for node in S_hybrid if node["E"] > 0)
    total = sum(node["E"] for node in S_hybrid if node["E"] > 0)
    hybrid_alive.append(alive)
    hybrid_energy.append(total / alive if alive > 0 else 0)
    hybrid_throughput.append(hybrid_packets)

# =====================================================
# 4. PSO-HYBRID PROTOCOL (Advanced Metaheuristic)
# =====================================================
pso_sim = PSOHybridWSN(num_nodes=n, E0=Eo, rmax=rmax, sink=(sink[0], sink[1]), heterogeneous=True)
pso_results = pso_sim.run_simulation()
pso_alive = pso_results["alive"]
pso_energy = pso_results["energy"]
pso_throughput = pso_results["throughput"]

# =====================================================
# METRICS & EXPORT
# =====================================================
leach_metrics = compute_lifecycle_metrics(leach_alive, n)
pegasis_metrics = compute_lifecycle_metrics(pegasis_alive, n)
hybrid_metrics = compute_lifecycle_metrics(hybrid_alive, n)
pso_metrics = pso_results["metrics"]

leach_metrics["total_throughput"] = leach_packets
pegasis_metrics["total_throughput"] = pegasis_packets
hybrid_metrics["total_throughput"] = hybrid_packets

metrics_summary = {
    "LEACH": leach_metrics,
    "PEGASIS": pegasis_metrics,
    "HYBRID": hybrid_metrics,
    "PSO_HYBRID": pso_metrics
}

# Export CSV table for residual energy
energy_df = pd.DataFrame({
    "Round": np.arange(1, rmax + 1),
    "LEACH": leach_energy,
    "PEGASIS": pegasis_energy,
    "HYBRID": hybrid_energy,
    "PSO_HYBRID": pso_energy
})
energy_df.to_csv("res-energy table.csv", index=False)

# Export metrics JSON for web consumption
os.makedirs("web/public", exist_ok=True)
with open("web/public/simulation_metrics.json", "w") as f:
    json.dump(metrics_summary, f, indent=2)

print("=== SIMULATION COMPLETED SUCCESSFULLY ===")
print("Comprehensive Protocol Metrics:")
print(json.dumps(metrics_summary, indent=2))