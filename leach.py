import numpy as np
import matplotlib.pyplot as plt

# PARAMETERS
n = 100
xm, ym = 100, 100
Eo = 0.5
p = 0.1
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

# INITIALIZE NODES
S = []
for i in range(n):
    node = {
        "x": np.random.rand() * xm,
        "y": np.random.rand() * ym,
        "E": Eo,
        "G": 0
    }
    S.append(node)

alive_nodes = []
dead_nodes = []

# MAIN LOOP
for r in range(rmax):

    # Reset G
    if r % int(1/p) == 0:
        for node in S:
            node["G"] = 0

    cluster_heads = []

    # CH SELECTION
    for i, node in enumerate(S):
        if node["E"] > 0 and node["G"] == 0:
            if np.random.rand() <= p:
                node["G"] = int(1/p)
                cluster_heads.append(i)

    # NORMAL NODES
    for i, node in enumerate(S):
        if node["E"] > 0:

            min_dist = float('inf')
            ch_index = -1

            for c in cluster_heads:
                dist = np.sqrt((node["x"] - S[c]["x"])**2 + (node["y"] - S[c]["y"])**2)
                if dist < min_dist:
                    min_dist = dist
                    ch_index = c

            if ch_index != -1 and ch_index != i:
                if min_dist > do:
                    node["E"] -= (k*ETX + k*Emp*min_dist**4)
                else:
                    node["E"] -= (k*ETX + k*Efs*min_dist**2)

                S[ch_index]["E"] -= (k*ERX + k*EDA)

            else:
                dist = np.sqrt((node["x"] - sink[0])**2 + (node["y"] - sink[1])**2)

                if dist > do:
                    node["E"] -= (k*ETX + k*Emp*dist**4)
                else:
                    node["E"] -= (k*ETX + k*Efs*dist**2)

    # CH TO BS
    for c in cluster_heads:
        if S[c]["E"] > 0:
            dist = np.sqrt((S[c]["x"] - sink[0])**2 + (S[c]["y"] - sink[1])**2)

            if dist > do:
                S[c]["E"] -= (k*ETX + k*Emp*dist**4)
            else:
                S[c]["E"] -= (k*ETX + k*Efs*dist**2)

    # COUNT
    alive = sum(1 for node in S if node["E"] > 0)
    dead = n - alive

    alive_nodes.append(alive)
    dead_nodes.append(dead)

# PLOT
plt.plot(alive_nodes, label="Alive Nodes")
plt.plot(dead_nodes, label="Dead Nodes")
plt.xlabel("Rounds")
plt.ylabel("Number of Nodes")
plt.title("LEACH Protocol (Python)")
plt.legend()
plt.grid()
plt.savefig('leach_output.png')
plt.close()
print("LEACH simulation completed. Graph saved as leach_output.png")