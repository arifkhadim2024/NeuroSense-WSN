# Behavioral Observations from Reference WSN Application
**Reference URL:** `https://energy-efficient-wsn-routing-ha6v.vercel.app/`
**Purpose:** Observe interactive behavior, visual layout, animations, sound synthesis, and routing telemetry to match and improve our NeuroSense-WSN v2 implementation.

---

## 1. 3D Viewport & Spatial Environment
- **Ground Field & Dimensions:** The sensing field represents a 100m × 100m Euclidean plane.
- **Base Station (Sink) Location:** Located at coordinate `(50, 150)`. The camera perspective is tilted and angled so that both the field `[0, 100] × [0, 100]` and the remote Sink node at `(50, 150)` remain simultaneously visible without clipping.
- **Camera Presets:**
  - *Perspective (Iso):* 45° elevated perspective looking towards the field and sink.
  - *Top-Down:* Orthographic / top overhead view of the 100m × 100m grid.
  - *Sink View:* Camera positioned behind/above the Sink looking down onto the network sensor field.
  - *360° Orbit:* Slow auto-rotation around the field center.

---

## 2. Visual Differentiation & Legends
- **Node State Representations:**
  - *Active Node:* Cyan sphere/dot with glowing translucent sensing disk (Rs radius).
  - *Sleeping Node:* Dim grey/muted sphere without sensing disk (or dashed boundary), distinct from dead nodes.
  - *Dead Node (0 J):* Red sphere with a prominent "X" badge marker indicating depletion.
  - *Cluster Head (CH):* Bright gold/yellow node with an expanding pulsing aura ring and a floating `"CH"` label.
  - *Chain Leader:* White ring or highlighted node communicating directly with the Sink.
  - *Base Station / Sink:* Large green diamond/tower marker at `(50, 150)` with beacon label `"BS (50, 150)"`.
- **Legend Box:** Permanent HUD box in the viewport explaining node colors, cluster roles, and link types.

---

## 3. Link Graph & Protocol-Specific Mechanics
- **LEACH Protocol:**
  - Star-shaped topology: Non-CH member nodes link to their nearest Cluster Head via thin cyan lines.
  - All Cluster Heads establish long direct transmission links to the Sink (green lines, dashed when distance $> d_0$).
- **PEGASIS Protocol:**
  - Single continuous Euclidean daisy-chain connecting all active nodes in greedy nearest-neighbor order (amber lines).
  - A designated Chain Leader sends an aggregated packet to the Sink via a direct link.
- **Hybrid / PSO-Hybrid Protocol:**
  - Clustered chains: Nodes are partitioned into clusters, forming intra-cluster micro-chains (amber lines).
  - The leader of each cluster chain relays to the Sink (or multi-hop through intermediate cluster heads).
- **Packet Travel Animation:**
  - Glowing photon dots travel along active links from leaf nodes through cluster chains/heads toward the Sink.
  - A subtle pulse/flash occurs at the Sink upon packet receipt.
  - Packet count throttled (maximum 150 concurrent dots) to maintain 60 FPS.
- **Chain Formation Animation:**
  - At $\le 1\times$ simulation speed, chain links draw progressively edge-by-edge ($\sim 25$ ms per edge) at round start before packet transmission.
  - At higher speeds ($\ge 4\times$), links render immediately to avoid lag.

---

## 4. Live Telemetry & Progressive Charts
- **Live HUD KPI Cards:** Coverage Ratio (CR), Overlap Redundancy (OR), Blindspot Ratio (HR), and Packets Received update dynamically every single frame.
- **Telemetry Strip:** Shows live operational round, alive count, active count, sleeping count, dead count, cluster heads, residual battery (J and %), energy used, and packet delivery.
- **Progressive Charts:**
  - Node lifetime curve (Alive / Active vs. Round).
  - Residual energy decay curve (J vs. Round).
  - Coverage ratio over time (dropping as critical nodes die).
  - Cumulative throughput (Packets to Sink vs. Round).
  - Energy consumption per round.
  - Charts update smoothly with a moving vertical scrub cursor line.
  - Clear markers for First Node Dead (FND), Half Nodes Dead (HND), and Last Node Dead (LND).

---

## 5. Web Audio API Sound Synthesis
- **No external audio files:** Purely synthesized using `AudioContext`, `OscillatorNode`, and `GainNode` with exponential decay envelopes.
- **Header Controls:** Speaker toggle icon (Mute/Unmute) and volume slider directly accessible in the top navigation bar.
- **Throttling:** Sound dispatch is rate-limited ($\le 8$ events/second) with priority given to major lifecycle events (node death, CH election, run completion) to avoid sonic clutter.
- **Audio Palette:**
  - Button click: Short 1200 Hz tick.
  - Sleep / Wake: Soft falling / rising frequency blips.
  - Cluster Head election: Two-tone ascending chime.
  - Chain edge build: Progressive pitch-ascending ticks.
  - Packet arrival at sink: 880 Hz sine chime with quick decay.
  - Node depletion: Low frequency thud + downward sweep.
  - Run completion: Harmonious C-E-G-C arpeggio.

---

## 6. NeuroSense-WSN v2 Enhancements (Our Extras)
- **Real ANN Sleep Scheduling:** Pre-trained MLP neural network inferring sleep probabilities based on spatial density, Voronoi cell area, residual energy, and sink distance.
- **Interactive Scrubber & Stepper:** Full state machine (`IDLE` $\to$ `PLAYING` $\rightleftharpoons$ `PAUSED` $\to$ `FINISHED`) enabling frame-by-frame forward/backward scrubbing with precomputed Python frame fidelity.
- **Multi-Protocol Overlay Comparison:** Real-time side-by-side benchmarking on identical initial energy distributions and seeds.
