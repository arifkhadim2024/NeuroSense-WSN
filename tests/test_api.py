"""
Unit Tests for Flask REST API Endpoints and Payloads.
"""

import pytest
import json
from app import create_app


@pytest.fixture
def client():
    """Create Flask test client fixture."""
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_api_scenarios(client):
    """Verify /api/scenarios endpoint returns presets."""
    res = client.get("/api/scenarios")
    assert res.status_code == 200
    data = res.get_json()
    assert "scenarios" in data
    assert "s1" in data["scenarios"]
    assert "s2" in data["scenarios"]


def test_api_deploy(client):
    """Verify /api/deploy endpoint deploys nodes and returns coverage."""
    payload = {
        "num_nodes": 30,
        "sensing_radius": 15.0,
        "seed": 42
    }
    res = client.post("/api/deploy", json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert "nodes" in data
    assert len(data["nodes"]) == 30
    assert "coverage" in data
    assert data["coverage"]["coverage_ratio"] > 0


def test_api_ann_model(client):
    """Verify /api/ann/model endpoint returns layer architecture and weights."""
    res = client.get("/api/ann/model")
    assert res.status_code == 200
    data = res.get_json()
    assert "layer_sizes" in data
    assert data["layer_sizes"] == [8, 16, 8, 1]
    assert "weights" in data
    assert "metrics" in data


def test_api_phase1_schedule(client):
    """Verify /api/phase1 sleep scheduling endpoint."""
    # Deploy nodes first
    dep_res = client.post("/api/deploy", json={"num_nodes": 40, "seed": 42})
    nodes = dep_res.get_json()["nodes"]

    res = client.post("/api/phase1", json={"nodes": nodes, "method": "ann_guard"})
    assert res.status_code == 200
    data = res.get_json()
    assert "nodes" in data
    assert "telemetry" in data
    assert data["telemetry"]["active_count"] > 0
