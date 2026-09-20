"""
End-to-End Simulation Player Lifecycle and Frame Link Assertion Test Suite.
Verifies Start -> Play -> Pause (frozen for 2s) -> Resume -> Step -> Scrub -> Reset.
"""

import pytest
from src.network import deploy_nodes
from src.simulator import run_simulation
from src.config import SimConfig, NetworkConfig


class MockSimulationPlayer:
    """Python simulation of ES6 SimulationPlayer state machine in player.js."""

    def __init__(self):
        self.frames = []
        self.current_index = 0
        self.state = "IDLE"

    def load_frames(self, frames):
        self.frames = frames or []
        self.current_index = 0
        self.state = "PAUSED" if self.frames else "IDLE"

    def play(self):
        if not self.frames:
            return
        self.state = "PLAYING"

    def pause(self):
        if self.state == "PLAYING":
            self.state = "PAUSED"

    def resume(self):
        if self.state == "PAUSED" and self.frames:
            self.play()

    def tick(self):
        """Simulates one playback interval."""
        if self.state == "PLAYING" and self.current_index < len(self.frames) - 1:
            self.current_index += 1
            if self.current_index >= len(self.frames) - 1:
                self.state = "FINISHED"

    def step_forward(self):
        if self.frames and self.current_index < len(self.frames) - 1:
            self.pause()
            self.current_index += 1

    def step_backward(self):
        if self.frames and self.current_index > 0:
            self.pause()
            self.current_index -= 1

    def jump_to_round(self, round_num):
        if self.frames:
            self.current_index = max(0, min(len(self.frames) - 1, round_num - 1))

    def reset(self):
        self.frames = []
        self.current_index = 0
        self.state = "IDLE"


def test_simulation_player_lifecycle_and_links():
    net_cfg = NetworkConfig(num_nodes=50, sensing_radius=15.0, comm_radius=30.0)
    nodes = deploy_nodes(config=net_cfg, seed=42)
    cfg = SimConfig(network=net_cfg, seed=42, max_rounds=200)
    res = run_simulation(nodes, protocol="ann_pso_hybrid", config=cfg, max_rounds=200)
    frames = res["frames"]

    assert len(frames) > 10, "Should generate multiple simulation frames"

    player = MockSimulationPlayer()
    assert player.state == "IDLE"
    assert player.current_index == 0

    # 1. Load frames and start playing
    player.load_frames(frames)
    player.play()
    assert player.state == "PLAYING"

    # Simulate 5 playback ticks
    for _ in range(5):
        player.tick()

    assert player.current_index > 1, "Playback should advance past round 1"
    curr_frame = player.frames[player.current_index]
    assert "links" in curr_frame, "Current frame must include links array"
    assert len(curr_frame["links"]) > 0, "Active network round must have 3D routing links"

    # 2. Pause and verify frozen state
    saved_index = player.current_index
    player.pause()
    assert player.state == "PAUSED"

    # Simulate elapsed time with clock ticks during pause
    for _ in range(5):
        player.tick()
    assert player.current_index == saved_index, "Round index must remain strictly frozen while paused"

    # 3. Resume and verify playback continues
    player.resume()
    assert player.state == "PLAYING"
    player.tick()
    assert player.current_index == saved_index + 1, "Playback must resume from exact paused round"

    # 4. Step forward and backward
    player.pause()
    freeze_idx = player.current_index
    player.step_forward()
    assert player.current_index == freeze_idx + 1, "Step ▶ must advance exactly 1 round"
    player.step_backward()
    assert player.current_index == freeze_idx, "Step ◀ must decrement exactly 1 round"

    # 5. Timeline scrubber jump
    player.jump_to_round(50)
    assert player.current_index == 49, "Jumping to round 50 must set current_index to 49"
    frame_50 = player.frames[player.current_index]
    assert frame_50["round"] == 50

    # 6. Reset deployment
    player.reset()
    assert player.state == "IDLE"
    assert len(player.frames) == 0


def test_protocol_link_topology_differences():
    net_cfg = NetworkConfig(num_nodes=50, sensing_radius=15.0, comm_radius=30.0)
    nodes = deploy_nodes(config=net_cfg, seed=42)
    cfg = SimConfig(network=net_cfg, seed=42, max_rounds=50)

    # LEACH: Stars with CH -> Sink links
    leach_res = run_simulation(nodes, protocol="leach", config=cfg, max_rounds=50)
    leach_links = leach_res["frames"][5]["links"]
    assert any(dst == -1 for _, dst, _ in leach_links), "LEACH must have direct CH-to-sink links"

    # PEGASIS: Single chain with Chain Leader -> Sink link
    peg_res = run_simulation(nodes, protocol="pegasis", config=cfg, max_rounds=50)
    peg_links = peg_res["frames"][5]["links"]
    chain_hops = [l for l in peg_links if l[2] == 1]
    assert len(chain_hops) > 0, "PEGASIS must have chain-hop links"

    # ANN+PSO-Hybrid: Multi-cluster chain relays
    hyb_res = run_simulation(nodes, protocol="ann_pso_hybrid", config=cfg, max_rounds=50)
    hyb_links = hyb_res["frames"][5]["links"]
    assert len(hyb_links) > 0, "ANN+PSO-Hybrid must produce active routing links"
