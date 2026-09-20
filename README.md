# NeuroSense-WSN v2: ANN-Powered Energy-Efficient WSN Laboratory

[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/backend-Flask%20REST%20API-green.svg)](https://flask.palletsprojects.com/)
[![Three.js](https://img.shields.io/badge/frontend-Three.js%20WebGL-black.svg)](https://threejs.org/)
[![Tests](https://img.shields.io/badge/tests-23%2F23%20Passing-emerald.svg)](tests/)

An end-to-end research simulation environment and interactive WebGL laboratory for **Energy-Efficient Wireless Sensor Networks (WSNs)**. Implements a Two-Phase Optimization Framework:
1. **Phase 1 (Sleep Scheduling)**: 8-feature Artificial Neural Network (MLP) + Deterministic Coverage Guard safety net preserving $\ge 95\%$ coverage while putting redundant sensors to sleep.
2. **Phase 2 (Multi-Hop Routing)**: Particle Swarm Optimization (PSO) Cluster Head election + intra-cluster daisy chaining + multi-hop sink delivery.

---

## 📚 Master Documentation & Guides
- 📖 **[Master Project eBook & Research Handbook (EBOOK_PROJECT_GUIDE.md)](EBOOK_PROJECT_GUIDE.md)**: Complete guide explaining theoretical foundations, mathematical derivations, algorithms, and system workflows.
- 🎓 **[Comprehensive Viva & Oral Defense Q&A (VIVA_QA.md)](VIVA_QA.md)**: 30+ detailed questions & answers covering radio physics, ANN features, and routing protocols.
- 🏗️ **[System Architecture & Design (ARCHITECTURE.md)](ARCHITECTURE.md)**: Internal code modularity, typed config, and strict $< 300$ line design rules.

---

## 🚀 Quickstart

```bash
# 1. Clone the repository
git clone https://github.com/arifkhadim2024/NeuroSense-WSN.git
cd NeuroSense-WSN

# 2. Install dependencies
pip install -r requirements.txt

# 3. Launch the Flask + WebGL Workbench (Port 5001 or 5000)
PORT=5001 python app.py
```
Open **`http://localhost:5001`** (or `http://localhost:5000`) in any modern web browser.

---

## 🧪 Automated Testing & Static Export

```bash
# Run all 23 unit, fairness, radio physics, and e2e parity tests
pytest -v tests/

# Export precomputed static JSON benchmarks
python export_static.py
```

---

## 📊 Empirical Benchmark Results (500 Rounds, N=50)

| Protocol | Rounds | Packets Delivered | Total Energy Spent | Packets / Joule | Empirical Assessment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **LEACH Protocol** | 500 | 2,500 pkts | 13.207 J | **189.3 pkts/J** | Cluster head rotation • Rapid battery depletion |
| **PEGASIS Protocol** | 500 | 500 pkts | 12.523 J | **39.9 pkts/J** | Linear chain relay • Leader bottleneck |
| **Hybrid LEACH-PEGASIS** | 500 | 2,500 pkts | 13.162 J | **189.9 pkts/J** | Intra-cluster daisy chain aggregation |
| **PSO-Hybrid** | 500 | 2,500 pkts | 12.313 J | **203.0 pkts/J** | High packet throughput • Continuous active mesh |
| **ANN + PSO-Hybrid (Proposed)** | 500 | 1,500 pkts | 6.430 J | **233.3 pkts/J** | **Ultra-low power (51% energy saved) • Extended lifetime** |

---

## 🎮 Interactive WebGL Features
- **3D Field Topology Viewport**: Real-time 60 FPS Three.js rendering with 360° motion, stable perspective, top-down, and sink views.
- **2D Multiplicity Heatmap & Bounded Voronoi**: 1.0m grid evaluation with polygon area tooltips.
- **Interactive ANN Laboratory**: Live forward-pass synapse illumination and scenario testing.
- **Simulation Playback Engine**: Scrub timeline, change speeds ($0.25\times - 16\times$), and inspect packet routing links.

---
*Developed for Advanced Energy-Efficient WSN Research.*
