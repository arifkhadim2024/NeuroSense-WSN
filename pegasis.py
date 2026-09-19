import numpy as np
import matplotlib.pyplot as plt

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

# INITIALIZE NODES
S = []
for i in range(n):
    node = {
        "x": np.random.rand() * xm,
        "y": np.random.rand() * ym,
        "E": Eo
    }
    S.append(node)

alive_nodes = []
dead_nodes = []

# DISTANCE FUNCTION
def distance(a, b):
    return np.sqrt((a["x"] - b["x"])**2 + (a["y"] - b["y"])**2)

# CREATE CHAIN (GREEDY)
def create_chain(S):
    nodes = list(range(len(S)))
    chain = []

    # start from farthest node
    distances = [np.sqrt((S[i]["x"] - sink[0])**2 + (S[i]["y"] - sink[1])**2) for i in nodes]
    current = np.argmax(distances)

    chain.append(current)
    nodes.remove(current)

    while nodes:
        last = chain[-1]
        nearest = min(nodes, key=lambda i: distance(S[last], S[i]))
        chain.append(nearest)
        nodes.remove(nearest)

    return chain

# MAIN LOOP
for r in range(rmax):

    # create chain every round
    chain = create_chain(S)

    # select leader
    leader = chain[r % len(chain)]

    # DATA TRANSMISSION ALONG CHAIN
    for i in range(len(chain)-1):
        a = chain[i]
        b = chain[i+1]

        if S[a]["E"] > 0:
            dist = distance(S[a], S[b])

            if dist > do:
                S[a]["E"] -= (k*ETX + k*Emp*dist**4)
            else:
                S[a]["E"] -= (k*ETX + k*Efs*dist**2)

            S[b]["E"] -= (k*ERX + k*EDA)

    # LEADER TO BASE STATION
    if S[leader]["E"] > 0:
        dist = np.sqrt((S[leader]["x"] - sink[0])**2 + (S[leader]["y"] - sink[1])**2)

        if dist > do:
            S[leader]["E"] -= (k*ETX + k*Emp*dist**4)
        else:
            S[leader]["E"] -= (k*ETX + k*Efs*dist**2)

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
plt.title("PEGASIS Protocol")
plt.legend()
plt.grid()
plt.savefig('pegasis_output.png')
plt.close()
print("PEGASIS simulation completed. Graph saved as pegasis_output.png")