import numpy as np
import matplotlib.pyplot as plt

# =====================================================
# ================= HYBRID LEACH-PEGASIS ==============
# =====================================================

# PARAMETERS
n = 100
xm, ym = 100, 100
Eo = 0.5
rmax = 1000

# RADIO PARAMETERS
ETX = 50e-9
ERX = 50e-9
Efs = 50e-12
Emp = 0.0013e-11
EDA = 5e-9
k = 8000

do = np.sqrt(Efs / Emp)

# BASE STATION
sink = np.array([50, 150])

def dist(a, b):
    return np.sqrt((a["x"] - b["x"])**2 + (a["y"] - b["y"])**2)

def init_nodes(initial_energy=Eo, use_csv=False, default_num_nodes=n, x_max=xm, y_max=ym):
    S = []
    for _ in range(default_num_nodes):
        S.append({
            "x": np.random.rand() * x_max,
            "y": np.random.rand() * y_max,
            "E": initial_energy,
            "G": 0
        })
    return S, default_num_nodes

S_hybrid, n_hybrid = init_nodes(use_csv=True)
hybrid_alive = []
hybrid_energy = []

for r in range(rmax):

    # CH selection logic using rotational selection of top energy nodes.
    energies = [node["E"] for node in S_hybrid]
    sorted_nodes = np.argsort(energies)[::-1] # Sort by energy in descending order

    num_ch = max(1, int(0.05 * n_hybrid)) # 5% of nodes are CHs, at least 1.
    # Rotate CHs based on current round
    CH = sorted_nodes[(r * num_ch) % n_hybrid : (r * num_ch) % n_hybrid + num_ch].tolist()
    CH = [ch_idx for ch_idx in CH if S_hybrid[ch_idx]["E"] > 0] # Only include alive CHs

    clusters = {ch: [] for ch in CH}

    for i, node in enumerate(S_hybrid):
        if node["E"] > 0 and i not in CH: # Only assign alive non-CH nodes
            if CH: # Only assign if there are cluster heads
                nearest = min(CH, key=lambda c: dist(node, S_hybrid[c]))
                clusters[nearest].append(i)
            else:
                # If no cluster heads, direct-to-BS handled below
                pass

    for ch, members in clusters.items():
        if S_hybrid[ch]["E"] <= 0: # Skip if CH is dead
            continue

        # PEGASIS chain formation within the cluster
        if members: # Only form chain if there are members
            chain = members.copy()
            ordered = [chain.pop(0)] # Start chain with first member for simplicity

            while chain:
                last = ordered[-1]
                nearest = min(chain, key=lambda i: dist(S_hybrid[last], S_hybrid[i]))
                ordered.append(nearest)
                chain.remove(nearest)

            local_k = k # Initial data packet size

            # Data transmission along chain to CH
            for i_chain in range(len(ordered)-1):
                a, b = ordered[i_chain], ordered[i_chain+1]

                if S_hybrid[a]["E"] > 0: # Ensure sending node is alive
                    S_hybrid[a]["E"] -= 0.00005 # Keeping this small energy drain

                    d = dist(S_hybrid[a], S_hybrid[b])

                    if d > do:
                        S_hybrid[a]["E"] -= (local_k*ETX + local_k*Emp*d**4)
                    else:
                        S_hybrid[a]["E"] -= (local_k*ETX + local_k*Efs*d**2)

                    if S_hybrid[b]["E"] > 0: # Ensure receiving node is alive
                        S_hybrid[b]["E"] -= (local_k*ERX + local_k*EDA)

                    local_k *= 0.8 # Aggregation factor

            # Last node in chain transmits to CH
            last_node_in_chain = ordered[-1]
            if S_hybrid[last_node_in_chain]["E"] > 0:
                S_hybrid[last_node_in_chain]["E"] -= 0.00005

                d = dist(S_hybrid[last_node_in_chain], S_hybrid[ch])

                if d > do:
                    S_hybrid[last_node_in_chain]["E"] -= (local_k*ETX + local_k*Emp*d**4)
                else:
                    S_hybrid[last_node_in_chain]["E"] -= (local_k*ETX + local_k*Efs*d**2)

                if S_hybrid[ch]["E"] > 0: # Ensure CH is alive
                    S_hybrid[ch]["E"] -= (local_k*ERX + local_k*EDA)

    # CH to BS transmission (or multi-hop to another CH first)
    for ch_idx in CH:
        if S_hybrid[ch_idx]["E"] > 0: # Only alive CHs can transmit
            transmit_to_bs = True

            # Multi-hop CH to CH (distance limited)
            other_alive_chs = [c for c in CH if c != ch_idx and S_hybrid[c]["E"] > 0]
            if other_alive_chs:
                nearest_ch_for_multihop = min(other_alive_chs, key=lambda c: dist(S_hybrid[ch_idx], S_hybrid[c]))
                d_ch_to_nearest_ch = dist(S_hybrid[ch_idx], S_hybrid[nearest_ch_for_multihop])

                if d_ch_to_nearest_ch < 75: # Multi-hop if close enough
                    S_hybrid[ch_idx]["E"] -= 0.00005

                    if d_ch_to_nearest_ch > do:
                        S_hybrid[ch_idx]["E"] -= (k*ETX + k*Emp*d_ch_to_nearest_ch**4)
                    else:
                        S_hybrid[ch_idx]["E"] -= (k*ETX + k*Efs*d_ch_to_nearest_ch**2)

                    if S_hybrid[nearest_ch_for_multihop]["E"] > 0:
                        S_hybrid[nearest_ch_for_multihop]["E"] -= (k*ERX + k*EDA)
                    transmit_to_bs = False

            if transmit_to_bs: # Transmit directly to BS if no multi-hop or too far for multi-hop
                S_hybrid[ch_idx]["E"] -= 0.00005

                d_ch_to_bs = dist(S_hybrid[ch_idx], {"x":sink[0],"y":sink[1]})
                if d_ch_to_bs > do:
                    S_hybrid[ch_idx]["E"] -= (k*ETX + k*Emp*d_ch_to_bs**4)
                else:
                    S_hybrid[ch_idx]["E"] -= (k*ETX + k*Efs*d_ch_to_bs**2)

    # Energy consumption for nodes that couldn't find a CH or are CHs but couldn't multihop
    for i, node in enumerate(S_hybrid):
        if node["E"] > 0 and i not in CH and i not in [val for sublist in clusters.values() for val in sublist]:
            node["E"] -= 0.00005
            d = dist(node, {"x":sink[0],"y":sink[1]})
            if d > do:
                node["E"] -= (k*ETX + k*Emp*d**4)
            else:
                node["E"] -= (k*ETX + k*Efs*d**2)

    alive = sum(1 for node in S_hybrid if node["E"] > 0)
    total = sum(node["E"] for node in S_hybrid if node["E"] > 0)

    hybrid_alive.append(alive)
    hybrid_energy.append(total/alive if alive>0 else 0)

if __name__ == "__main__":
    plt.plot(hybrid_alive, label="Alive Nodes")
    plt.xlabel("Rounds")
    plt.ylabel("Number of Nodes")
    plt.title("Hybrid LEACH-PEGASIS Protocol")
    plt.legend()
    plt.grid()
    plt.savefig('hybrid_output.png')
    plt.close()
    print("Hybrid simulation completed. Graph saved as hybrid_output.png")
