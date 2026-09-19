# Energy-Efficient WSN Routing with ANN Node-State Prediction & Coverage Optimization

An advanced Wireless Sensor Network (WSN) routing framework combining **Artificial Neural Network (ANN) Node-State Prediction**, **Coverage-Preserving Active/Sleep Node Optimization**, **Sensing-Overlap Reduction**, and **Particle Swarm Optimization (PSO) Hybrid LEACH-PEGASIS Routing**.

---

## 1. Problem Statement

Wireless Sensor Networks (WSNs) consist of spatially distributed, battery-operated sensor nodes deployed to monitor physical or environmental conditions. In dense deployments, sensor nodes frequently have overlapping sensing fields, causing:
1. **Redundant Sensing & Transmission**: Multiple adjacent nodes sense and transmit duplicate data, wasting finite battery power.
2. **Accelerated Network Depletion**: High energy dissipation leads to premature node failure (low First Node Dead / FND).
3. **Severe Hot-Spot & Bottlenecks**: Nodes near cluster heads or base stations deplete energy rapidly.

### Research Objectives
- **Maximize/Preserve Sensing Coverage**: Ensure sensing field coverage stays within $\le 1.0\%$ of baseline.
- **Reduce Sensing Overlap**: Place redundant nodes into low-power sleep mode without compromising field monitoring.
- **Extend Network Lifetime**: Delay First Node Dead (FND) and Half Nodes Dead (HND) through optimized cluster head selection and energy-balanced hybrid data routing.

---

## 2. Proposed Architecture

```
                 +-----------------------------------+
                 |          WSN Deployment           |
                 |  (100 Nodes, Heterogeneous Energy)|
                 +-----------------+-----------------+
                                   |
                                   v
                 +-----------------------------------+
                 |    ANN Node-State Prediction      |
                 |  (Active vs. Sleep Classification)|
                 +-----------------+-----------------+
                                   |
                                   v
                 +-----------------------------------+
                 |  Coverage & Overlap Optimization  |
                 |  (Greedy Add & Overlap Pruning)   |
                 +-----------------+-----------------+
                                   |
                                   v
                 +-----------------------------------+
                 |    Active/Sleep Node Selection    |
                 | (Active: Routing | Sleep: Idle)   |
                 +-----------------+-----------------+
                                   |
                                   v
                 +-----------------------------------+
                 |   PSO Cluster-Head Selection      |
                 | (Energy, Sink, Intra, Cov, Overlap)|
                 +-----------------+-----------------+
                                   |
                                   v
                 +-----------------------------------+
                 |   Hybrid / PEGASIS-style Routing  |
                 | (Intra-cluster Chains + Multi-hop)|
                 +-----------------+-----------------+
                                   |
                                   v
                 +-----------------------------------+
                 |       Performance Evaluation      |
                 |  (Coverage, Overlap, FND, HND)    |
                 +-----------------------------------+
```

---

## 3. Methodological Details

### 3.1 ANN-Based Node-State Prediction
An Artificial Neural Network (Multilayer Perceptron) predicts whether a node should initially be **ACTIVE** ($1$) or in **SLEEP** mode ($0$).

- **Architecture**: `MLPClassifier(hidden_layer_sizes=(16, 8), activation="relu", solver="adam", learning_rate_init=0.001, max_iter=500, early_stopping=True)`
- **Preprocessing**: `StandardScaler` feature standardization
- **Input Features (6 Features)**:
  1. `energy`: Residual energy of the node ($E_i$).
  2. `sink_distance`: Euclidean distance to the Base Station ($d(i, \text{sink})$).
  3. `neighbors`: Number of neighbors within communication range ($2 \times R_s$).
  4. `coverage_contribution`: Fraction of grid points exclusively/uniquely covered by node $i$.
  5. `overlap_ratio`: Fraction of node $i$'s sensing area overlapping with neighbors.
  6. `node_density`: Local node density in the communication neighborhood.
- **Training Labels**: Derived heuristically based on sensing overlap and unique coverage contributions (*note: trained on analytical heuristic labels, not experimental ground-truth*).

### 3.2 Sensing Coverage & Overlap Formulations
Discretizing the sensing field $[0, W] \times [0, H]$ into grid points $G = \{(x_g, y_g)\}$ with resolution $\Delta = 2\text{ m}$:

- **Coverage ($C$)**: Percentage of grid points covered by at least one active sensor:
  $$C = \frac{|\{g \in G \mid \exists i \in S_{\text{active}}, \text{dist}(i, g) \le R_s\}|}{|G|} \times 100\%$$

- **Overlap ($O$)**: Percentage of covered grid points covered by more than one active sensor:
  $$O = \frac{|\{g \in G \mid |\{i \in S_{\text{active}} \mid \text{dist}(i, g) \le R_s\}| > 1\}|}{|\{g \in G \mid |\{i \in S_{\text{active}} \mid \text{dist}(i, g) \le R_s\}| \ge 1\}|} \times 100\%$$

### 3.3 Coverage-Preserving Optimization
To prevent ANN misclassifications from degrading sensing coverage:
1. Target coverage is set to:
   $$\text{Target Coverage} = \text{Baseline Coverage} - 1.0\%$$
2. **Greedy Addition**: If ANN active node coverage $< \text{Target Coverage}$, sleeping nodes providing the largest marginal coverage gain are iteratively activated.
3. **Greedy Pruning / Overlap Reduction**: Redundant active nodes are evaluated. If removing node $u$ leaves coverage $\ge \text{Target Coverage}$, the node whose removal minimizes sensing overlap is transitioned to sleep mode.

### 3.4 PSO-Hybrid Routing
- Only active nodes participate in routing; sleeping nodes remain idle and preserve their residual energy.
- Particle Swarm Optimization selects optimal Cluster Heads (CHs) using a multi-objective fitness function:
  $$\text{Fitness} = 2.0 \cdot \overline{E_{\text{CH}}} + 100.0 \cdot \left(\frac{1}{\overline{d_{\text{sink}}} + \epsilon}\right) + 50.0 \cdot \left(\frac{1}{\overline{d_{\text{intra}}} + \epsilon}\right) + 100.0 \cdot S_{\text{cov}} - 50.0 \cdot S_{\text{overlap}}$$
- Intra-cluster communication utilizes PEGASIS-style greedy nearest-neighbor chaining with data aggregation.

---

## 4. Experimental Setup

| Parameter | Value |
|:---|:---|
| Network Field Size | $100\text{ m} \times 100\text{ m}$ |
| Total Nodes ($N$) | 100 |
| Base Station (Sink) | $(50, 150)$ |
| Sensing Radius ($R_s$) | $10\text{ m}$ |
| Grid Resolution | $2\text{ m}$ ($51 \times 51 = 2601$ grid points) |
| Simulation Rounds | 1000 |
| Initial Energy ($E_0$) | $0.5\text{ J}$ |
| Heterogeneous Distribution | Normal ($70\%$), Advanced ($m_{\text{adv}}=0.2, \alpha=1.0$), Super ($m_{\text{sup}}=0.1, \beta=2.0$) |
| Radio Model | $E_{\text{TX}}=E_{\text{RX}}=50\text{ nJ/bit}$, $E_{\text{fs}}=50\text{ pJ/bit/m}^2$, $E_{\text{mp}}=0.0013\text{ pJ/bit/m}^4$, $E_{\text{DA}}=5\text{ nJ/bit}$ |
| PSO Parameters | 20 particles, 15 iterations, $\approx 5\%$ CH ratio |
| Random Evaluation Seeds | 42, 123, 456 |

---

## 5. Experimental Results

### 5.1 Per-Seed Experimental Results

| Seed | Protocol | Active Nodes | Sleep Nodes | Coverage (%) | Overlap (%) | FND (Rounds) | HND (Rounds) | LND (Rounds) | Throughput (Packets) |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **42** | Baseline PSO-Hybrid | 100 | 0 | 92.70% | 82.70% | 163 | 786 | 1000 | 69,721 |
| **42** | **ANN + PSO-Hybrid** | **60** | **40** | **91.70%** | **64.03%** | **157** | **1000** | **1000** | **48,814** |
| **123** | Baseline PSO-Hybrid | 100 | 0 | 94.16% | 81.14% | 135 | 910 | 1000 | 74,382 |
| **123** | **ANN + PSO-Hybrid** | **53** | **47** | **93.16%** | **48.91%** | **546** | **1000** | **1000** | **45,587** |
| **456** | Baseline PSO-Hybrid | 100 | 0 | 94.35% | 83.70% | 136 | 860 | 1000 | 70,457 |
| **456** | **ANN + PSO-Hybrid** | **55** | **45** | **93.35%** | **51.98%** | **573** | **1000** | **1000** | **49,925** |

### 5.2 Summary Comparison (3-Seed Average)

| Metric | Baseline PSO-Hybrid | ANN + PSO-Hybrid | Absolute Change | % Change | Key Findings |
|:---|:---:|:---:|:---:|:---:|:---|
| **Active Nodes** | 100.0 | **56.0** | -44.0 nodes | **-44.00%** | 44% of nodes safely placed into sleep mode |
| **Sleeping Nodes** | 0.0 | **44.0** | +44.0 nodes | +100.0% | Redundant nodes conserve 100% of battery |
| **Sensing Coverage** | 93.73% | **92.73%** | -1.00% | -1.07% | Strict preservation within 1.0% constraint |
| **Sensing Overlap** | 82.51% | **54.97%** | -27.54% | **-33.38%** | Substantial reduction in redundant sensing |
| **First Node Dead (FND)** | 144.67 | **425.33** | +280.67 rnds | **+194.01%** | Stability period extended by nearly 3x |
| **Half Nodes Dead (HND)** | 852.00 | **1000.00** | +148.00 rnds | **+17.37%** | Sustained through entire 1000-round boundary |
| **Last Node Dead (LND)** | 1000.00 | 1000.00 | 0.00 | 0.00% | LND not reached within 1000 rounds |
| **Throughput** | 71,520 | 48,109 | -23,411 pkts | -32.73% | Throughput tradeoff due to 44% sleeping nodes |
| **Simulation Runtime** | 252.69 s | **128.06 s** | -124.63 s | **-49.32%** | 49.3% faster simulation execution |

---

## 6. Key Analysis & Insights

1. **Overlap & Redundancy Reduction**: Average sensing overlap was reduced from $82.51\%$ to $54.97\%$ (a relative reduction of $33.38\%$), eliminating excessive duplicate packet generation.
2. **Active Node Reduction**: An average of $44$ nodes ($44\%$) are placed into sleep mode without violating the coverage constraint ($92.73\%$ vs. $93.73\%$, $\Delta = 1.0\%$).
3. **Network Stability Improvement (FND)**: The First Node Dead metric increased by $194.0\%$ ($144.67 \rightarrow 425.33$ rounds), significantly prolonging the initial uniform-sensing operational phase.
4. **Half Node Dead (HND)**: In all 3 test seeds, ANN + PSO-Hybrid maintained more than $50\%$ of active nodes alive through the full 1000-round simulation horizon.
5. **Throughput Interpretation**: Total packets delivered decreased from $71,520$ to $48,109$ packets. This reduction is expected and intentional: sleeping nodes do not generate or forward redundant packets.
6. **Execution Efficiency**: Smaller active topology reduced intra-cluster chaining and PSO candidate search space, decreasing runtime by $49.3\%$ ($252.69\text{ s} \rightarrow 128.06\text{ s}$).

---

## 7. Project Structure

```
.
├── optimization/
│   ├── __init__.py               # Optimization package initialization
│   ├── coverage.py               # Vectorized sensing coverage calculation
│   ├── overlap.py                # Vectorized sensing overlap calculation
│   ├── ann_selector.py           # ANN feature extraction, heuristic training & prediction
│   └── node_optimizer.py         # Coverage-preserving greedy optimization pipeline
├── results/
│   ├── csv/
│   │   ├── ann_training_data.csv             # 6-feature ANN training dataset with heuristic labels
│   │   ├── ann_node_selection.csv            # Per-node classification & optimization audit
│   │   ├── coverage_optimization_results.csv # Pre/post optimization metrics per seed
│   │   ├── final_3_seed_results.csv          # Per-seed comparison data
│   │   └── final_summary_results.csv         # Summary comparison and percentage changes
│   ├── graphs/
│   │   ├── average_coverage_comparison.png
│   │   ├── average_overlap_comparison.png
│   │   ├── average_active_nodes_comparison.png
│   │   ├── average_fnd_comparison.png
│   │   ├── average_hnd_comparison.png
│   │   ├── average_throughput_comparison.png
│   │   └── average_runtime_comparison.png
│   └── models/
│       ├── ann_node_selector.pkl # Trained Scikit-Learn MLPClassifier
│       └── ann_scaler.pkl        # Fitted StandardScaler
├── pso_hybrid.py                 # Core PSO-Hybrid WSN routing implementation
├── leach.py                      # Classical LEACH protocol
├── pegasis.py                    # Classical PEGASIS protocol
├── hybrid.py                     # Standard Hybrid LEACH-PEGASIS protocol
├── comparison.py                 # Multi-protocol lifecycle comparison script
├── res-energy table.csv          # Experimental 1000-round residual energy dataset (LEACH, PEGASIS, HYBRID, PSO-HYBRID)
├── generate_results.py           # Model training, CSV export & matplotlib graph generation
├── requirements.txt              # Project dependencies
├── web/                          # React + Vite web presentation dashboard
└── README.md                     # Comprehensive project documentation
```

---

## 8. Quick Start

### 8.1 Setup Environment
```bash
pip install -r requirements.txt
```

### 8.2 Train ANN, Generate CSV Results & Graphs
```bash
python generate_results.py
```

### 8.3 Run Protocol Comparisons
```bash
python comparison.py
python pso_hybrid.py
python leach.py
python pegasis.py
python hybrid.py
```

### 8.4 Launch Web Presentation Dashboard
```bash
cd web
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser.

---

## 9. Limitations & Future Work

- **Static vs. Dynamic Duty Cycling**: Current active/sleep states are determined at network initialization. Future work will investigate dynamic sleep-wake rotation as node energy depletes.
- **2D Planar Model**: The current sensing and propagation model assumes flat 2D terrain. Extensions to 3D sensing fields with terrain obstruction models are planned.
- **Mobile Sink & Edge AI**: Future iterations can incorporate reinforcement learning for mobile sink path planning in combination with distributed on-node neural inference.
