# NeuroSense-WSN v2: 30 Essential Viva Questions & Answers

### 1. What is the primary objective of NeuroSense-WSN v2?
To maximize the operational lifetime of a Wireless Sensor Network by using an Artificial Neural Network (ANN) to identify redundant sensors and put them to sleep, while maintaining at least 99% of initial spatial coverage.

### 2. What is the difference between Phase 1 and Phase 2 in this project?
- **Phase 1 (Sleep Scheduling)**: Decides which nodes are ACTIVE and which are in SLEEP mode.
- **Phase 2 (Multi-Hop Routing)**: Active nodes form clusters and chains to deliver packets to the Base Station.

### 3. What first-order radio model is used for energy dissipation?
The Heinzelman model: $E_{tx}(k, d) = k \cdot E_{elec} + k \cdot \varepsilon_{fs} \cdot d^2$ for $d < d_0$, and $k \cdot E_{elec} + k \cdot \varepsilon_{mp} \cdot d^4$ for $d \ge d_0$. Reception costs $E_{rx}(k) = k \cdot E_{elec}$.

### 4. What is the crossover threshold $d_0$ and what is its value?
$d_0 = \sqrt{\varepsilon_{fs} / \varepsilon_{mp}} = \sqrt{10\text{ pJ} / 0.0013\text{ pJ}} \approx 87.7\text{ meters}$.

### 5. What are the 8 features fed into the ANN?
1. Residual Energy Ratio ($E / E_{initial}$)
2. Distance to Base Station
3. Neighbor Count within $R_c$
4. Unique Coverage Contribution Ratio
5. Overlap Ratio
6. Local Node Density
7. Nearest Active Neighbor Distance
8. Obstacle Blocked Sensing Ratio

### 6. How are the ground-truth training labels generated?
By a **Greedy Oracle Optimizer** (`src/ann/oracle.py`) that iteratively tests putting redundant nodes to sleep while maintaining network coverage within $\varepsilon = 1.0\%$ of baseline.

### 7. Why train an ANN if we already have the Greedy Oracle?
The Greedy Oracle requires repeated global coverage matrix recalculations ($O(N^2)$) taking $\approx 70\text{ ms}$. The trained ANN performs instant vector matrix multiplication in $\approx 8\text{ ms}$ (an 8.4x speedup).

### 8. What is the architecture of the ANN?
A Multi-Layer Perceptron (`MLPClassifier`) with architecture `[8 -> 16 -> 8 -> 1]`, ReLU activations in hidden layers, and Adam optimization.

### 9. How do we ensure honest ANN evaluation?
The dataset is split by **deployment seed** rather than by node. The test set consists entirely of unseen sensor network topologies.

### 10. What is the safety-net Coverage Guard?
If the ANN's predictions leave any small coverage gap ($CR < CR_{target}$), the Coverage Guard iteratively awakens the sleeping nodes providing the largest marginal coverage gain until the target is met.

### 11. What are the heterogeneous energy ratios?
- 70% Normal nodes ($E_0 = 0.5\text{ J}$)
- 20% Advanced nodes ($E_0 \times (1 + \alpha) = 1.0\text{ J}$)
- 10% Super nodes ($E_0 \times (1 + \beta) = 1.5\text{ J}$)

### 12. Why is it critical that all protocols start from identical energy arrays?
To prevent unfair benchmarking. If PSO-Hybrid started with higher initial energy, its longer lifetime would be an artifact of unfair initialization rather than algorithmic superiority.

### 13. How does LEACH select Cluster Heads?
Using a probabilistic threshold $T(n) = \frac{p}{1 - p \cdot (r \bmod (1/p))}$ among nodes that have not been CHs in the current cycle.

### 14. What is the main weakness of LEACH?
Non-CH nodes transmit directly to Cluster Heads in a single hop, which drains substantial energy when clusters are large, and CHs dissipate large amounts of power transmitting long distances to the Base Station.

### 15. How does PEGASIS work?
Nodes form a greedy linear chain where each node transmits only to its nearest neighbor. A rotating leader aggregates all data and sends one packet to the sink.

### 16. What is the main drawback of PEGASIS?
High latency due to sequential token passing along the long chain and vulnerability if a link breaks.

### 17. How does the Hybrid LEACH-PEGASIS protocol work?
Nodes are divided into clusters, and within each cluster, nodes form a small PEGASIS daisy-chain to the Cluster Head.

### 18. How does PSO-Hybrid select Cluster Heads?
Using Particle Swarm Optimization to minimize a multi-objective fitness function balancing residual battery, distance to Base Station, and intra-cluster spread.

### 19. What are the weights in the PSO fitness function?
- Energy ($w_E = 0.35$)
- Base Station Distance ($w_{BS} = 0.25$)
- Intra-Cluster Distance ($w_{intra} = 0.20$)
- Coverage & Overlap ($w_{cov} = 0.10, w_{ov} = 0.10$)

### 20. What is Dynamic Sleep Rotation?
Every $K = 50$ rounds, the sleep scheduler re-evaluates the network. Active nodes that have depleted energy are swapped with well-rested sleeping nodes, balancing energy dissipation.

### 21. What does FND stand for?
**First Node Dead**: The round number when the very first sensor in the network exhausts its battery.

### 22. What does HND stand for?
**Half Nodes Dead**: The round number when 50% of the deployed sensors have died.

### 23. What does LND stand for?
**Last Node Dead**: The round number when the final remaining sensor dies.

### 24. What is the relationship between sensing radius $R_s$ and communication radius $R_c$?
To ensure that a network with complete sensing coverage also maintains full communication connectivity, $R_c \ge 2 \cdot R_s$.

### 25. How is Coverage Ratio (CR) calculated?
$$CR = \frac{\text{Grid points covered by } \ge 1 \text{ active node}}{\text{Total field grid points}} \times 100\%$$

### 26. How is Overlap Ratio (OR) calculated?
$$OR = \frac{\text{Grid points covered by } \ge 2 \text{ active nodes}}{\text{Total covered points}} \times 100\%$$

### 27. What is Mean Multiplicity $K$?
The average number of active sensors monitoring each covered point ($K = \sum \text{multiplicity} / \text{covered points}$).

### 28. How does an RF Jammer affect the network?
Nodes within the jammer's interference radius experience severe packet loss ($85\%$ drop probability).

### 29. What does the EMP blast feature simulate?
A cyber-physical high-energy electromagnetic pulse draining 85% of battery power for nodes within a $30\text{m}$ blast radius.

### 30. Why was plain JavaScript chosen for the frontend instead of React/TypeScript?
To eliminate all build tools, npm packages, and bundlers, allowing the application to open instantly with zero compilation while keeping all scientific computation strictly in Python.

### 31. How does the Frame-Based Architecture enforce "One Source of Truth"?
Python runs the simulation once and returns a list of per-round `frames` containing exact node states (0=dead, 1=sleep, 2=active, 3=CH, 4=leader), residual energies, link graph tuples `[src, dst, kind]`, chain orders, and recomputed coverage metrics. JavaScript never computes physics or metrics separately; the 3D field, HUD cards, charts, and tables all read directly from these identical Python frames.

### 32. How does the Playback Controller work and why is timeline scrubbing instantaneous?
The playback engine uses a state machine (`IDLE` → `PLAYING` ⇄ `PAUSED` → `FINISHED`). Because all lifecycle rounds are precomputed in Python memory, dragging the timeline scrubber jumps to frame index $n$ and renders the exact historical network state with $O(1)$ lookup time and zero lag.

### 33. How do you explain PEGASIS & Hybrid Chain Formation in 1 minute?
1. **Greedy Construction**: Starting from the node farthest from the target (Cluster Head or Sink), the algorithm greedily connects each node to its closest unvisited neighbor until all active members form a continuous chain.
2. **Daisy-Chain Aggregation**: Packets travel hop-by-hop along the chain (amber lines). Each intermediate node receives incoming data, fuses it with its local reading ($E_{da} = 5\text{ nJ/bit/signal}$), and forwards a single packet.
3. **Sink Relay**: The designated Cluster Head or Leader transmits the final aggregated payload to the Base Station at $(50, 150)$ (green line).
4. **Energy Advantage**: Neighbor hop distances are very short ($d \ll d_0 = 87.7\text{m}$), minimizing free-space radio dissipation ($\varepsilon_{fs} \cdot d^2$) across the field.
