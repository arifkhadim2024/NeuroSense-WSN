# NeuroSense-WSN — ANN Neural Classifier & Interactive 3D Section Animations

We have implemented the **ANN (Artificial Neural Network) Node-State Prediction & Sleep Scheduling** architecture and integrated **Interactive 3D Perspective Section Animations** across all cards and viewports.

---

## 1. ANN (Artificial Neural Network) Integration

| Feature | Details |
| :--- | :--- |
| **Dedicated Tab**: `ANN & Sleep Pruning` | Located directly in the top navigation bar with the Brain icon. Opens the comprehensive **`ANNNeuralLab`** view. |
| **ANN Architecture Visualizer** | Interactive **Multi-Layer Perceptron (MLP 6-12-8-2)** diagram with Feed-Forward Softmax activations showing live synaptic weight propagation and Active/Sleep predictions. |
| **6-Feature Vector Space** | Interactive diagnostic inspector for the 6 input features: $x_1$ (Residual Energy Ratio, $+2.0$), $x_2$ (Distance to Sink, $-0.02$), $x_3$ (Local Node Degree, $+1.5$), $x_4$ (Unique Coverage Factor, $+3.0$), $x_5$ (Overlap Redundancy, $-1.8$), and $x_6$ (Spatial Cluster Density, $+1.2$). |
| **ANN Algorithm Selector** | Updated in the Simulation Parameters panel: `Proposed: ANN + PSO-Hybrid (Deep Sleep Scheduling)`, `ANN Node Classifier + Greedy Pruning (Δ ≤ 1.0%)`. |
| **3D ANN Node Diagnostics** | Hovering over any sensor node in the 3D visualizer displays `ANN Prediction: ACTIVE (98.4%)` or `ANN Prediction: SLEEP (Redundancy Pruned)` in the floating holographic tooltip. |
| **Phase 1 Action** | `Execute ANN Sleep Pruning & Repositioning` button in the right-side control panel. |

---

## 2. Interactive 3D Perspective Section Animations (`TiltCard3D`)

- **Card & Section 3D Tilt**: Moving the cursor over any UI section (3D Canvas container, Simulation Parameters panel, Coverage Heatmap, Voronoi Partition card, Metrics cards, or Neural Network layers) applies real-time 3D perspective tilt (`perspective(1000px) rotateX(...) rotateY(...) scale3d(1.015, 1.015, 1.015) translateZ(6px)`).
- **Dynamic Glare Reflection**: A radial glare spotlight tracks the cursor position across each card surface.
- **Micro-Audio Chirp**: Hovering over interactive cards plays a high-tech digital audio blip (`playAudioOnHover={true}`).
- **3D Canvas Parallax**: Moving the cursor inside the 3D field tilts and elevates the targeted sensor nodes with glowing cyan beacon rings.

---

## 3. Verification
- `npm run build` ran with **0 errors**.
- Dev server is running live on **`http://localhost:5173/`**.
