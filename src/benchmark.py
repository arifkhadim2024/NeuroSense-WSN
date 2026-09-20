"""
Multi-Seed Protocol Benchmarking and Ablation Experiment Runner.
Executes reproducible multi-seed runs with honest metric computations and dynamic assessments.
"""

from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from src.config import SimConfig, NetworkConfig
from src.network import deploy_nodes
from src.scheduler import schedule_nodes
from src.simulator import run_simulation


BENCHMARK_SEEDS = [42, 101, 202, 303, 404]


def run_phase1_ablation(
    seeds: Optional[List[int]] = None,
    config: Optional[SimConfig] = None
) -> List[Dict[str, Any]]:
    """
    Run Phase 1 Sleep Scheduling ablation across multiple seeds.
    Evaluates downstream PSO-Hybrid routing metrics for each sleep strategy.
    """
    if seeds is None:
        seeds = BENCHMARK_SEEDS
    if config is None:
        config = SimConfig()

    methods = [
        ("baseline", "All-Active Baseline"),
        ("random", "Random Sleep"),
        ("rule", "Rule-Based Sleep"),
        ("greedy", "Greedy Oracle"),
        ("ann", "ANN Only"),
        ("ann_guard", "ANN + Coverage Guard (Proposed)")
    ]

    raw_results = []
    for method_key, method_name in methods:
        active_pcts, coverages, overlaps, runtimes = [], [], [], []
        fnd_list, hnd_list, lnd_list, pkts_list, pkts_per_j_list = [], [], [], [], []

        for s in seeds:
            nodes = deploy_nodes(config.network, seed=s)
            updated_nodes, telemetry = schedule_nodes(nodes, method=method_key, config=config)
            active_pcts.append(telemetry["active_percentage"])
            coverages.append(telemetry["coverage_ratio"])
            overlaps.append(telemetry["overlap_ratio"])
            runtimes.append(telemetry["elapsed_ms"])

            sim_res = run_simulation(
                updated_nodes,
                protocol="pso_hybrid",
                config=config,
                max_rounds=config.max_rounds
            )
            fnd_list.append(sim_res["fnd"])
            hnd_list.append(sim_res["hnd"])
            lnd_list.append(sim_res["lnd"])
            pkts_list.append(sim_res["total_packets_delivered"])
            pkts_per_j_list.append(sim_res.get("packets_per_joule", 0.0))

        valid_fnds = [v for v in fnd_list if v is not None]
        valid_hnds = [v for v in hnd_list if v is not None]
        valid_lnds = [v for v in lnd_list if v is not None]

        raw_results.append({
            "key": method_key,
            "name": method_name,
            "active_pct_mean": round(float(np.mean(active_pcts)), 1),
            "active_pct_std": round(float(np.std(active_pcts)), 1),
            "coverage_mean": round(float(np.mean(coverages)), 1),
            "coverage_std": round(float(np.std(coverages)), 1),
            "overlap_mean": round(float(np.mean(overlaps)), 1),
            "overlap_std": round(float(np.std(overlaps)), 1),
            "fnd_mean": round(float(np.mean(valid_fnds)), 0) if valid_fnds else None,
            "fnd_std": round(float(np.std(valid_fnds)), 0) if valid_fnds else 0.0,
            "hnd_mean": round(float(np.mean(valid_hnds)), 0) if valid_hnds else None,
            "hnd_std": round(float(np.std(valid_hnds)), 0) if valid_hnds else 0.0,
            "lnd_mean": round(float(np.mean(valid_lnds)), 0) if valid_lnds else None,
            "lnd_std": round(float(np.std(valid_lnds)), 0) if valid_lnds else 0.0,
            "packets_mean": round(float(np.mean(pkts_list)), 0),
            "packets_per_joule": round(float(np.mean(pkts_per_j_list)), 1),
            "runtime_ms_mean": round(float(np.mean(runtimes)), 1),
        })

    # Generate Dynamic Assessment Texts based on data
    base_item = next((r for r in raw_results if r["key"] == "baseline"), raw_results[0])
    base_cov = base_item["coverage_mean"]
    base_fnd = base_item["fnd_mean"] or 1.0

    for r in raw_results:
        cov_diff = r["coverage_mean"] - base_cov
        fnd_val = r["fnd_mean"] or config.max_rounds
        fnd_diff = ((fnd_val - base_fnd) / base_fnd) * 100.0

        if r["key"] == "ann_guard":
            assessment = f"{cov_diff:+.1f}% coverage, {fnd_diff:+.0f}% FND vs baseline"
            badge = "status-emerald"
        elif r["key"] == "greedy":
            assessment = f"Ground truth oracle ({r['runtime_ms_mean']} ms/cycle)"
            badge = "status-amber"
        elif r["key"] == "baseline":
            assessment = f"100% active baseline ({r['coverage_mean']}% CR, {r['overlap_mean']}% OR)"
            badge = "status-muted"
        elif r["key"] == "random":
            assessment = f"{cov_diff:+.1f}% coverage loss (uncoordinated sleep)"
            badge = "status-rose"
        elif r["key"] == "rule":
            assessment = f"{r['active_pct_mean']}% active ({cov_diff:+.1f}% CR, {fnd_diff:+.0f}% FND)"
            badge = "status-amber"
        else:
            assessment = f"Fast neural inference ({r['runtime_ms_mean']} ms)"
            badge = "status-cyan"

        r["assessment"] = assessment
        r["badge_class"] = badge

    return raw_results


def run_protocol_benchmark(
    seeds: Optional[List[int]] = None,
    config: Optional[SimConfig] = None
) -> List[Dict[str, Any]]:
    """
    Run multi-seed routing protocol benchmark from identical initial deployments.
    """
    if seeds is None:
        seeds = BENCHMARK_SEEDS
    if config is None:
        config = SimConfig()

    protocols = [
        ("leach", "LEACH Protocol"),
        ("pegasis", "PEGASIS Protocol"),
        ("hybrid", "Hybrid LEACH-PEGASIS"),
        ("pso_hybrid", "PSO-Hybrid"),
        ("ann_pso_hybrid", "ANN + PSO-Hybrid (Proposed)")
    ]

    raw_results = []
    for proto_key, proto_name in protocols:
        fnd_list, hnd_list, lnd_list, packets_list, pkts_per_j_list, runtime_list = [], [], [], [], [], []

        for s in seeds:
            base_nodes = deploy_nodes(config.network, seed=s)
            sim_res = run_simulation(
                base_nodes,
                protocol=proto_key,
                config=config,
                max_rounds=config.max_rounds
            )
            fnd_list.append(sim_res["fnd"])
            hnd_list.append(sim_res["hnd"])
            lnd_list.append(sim_res["lnd"])
            packets_list.append(sim_res["total_packets_delivered"])
            pkts_per_j_list.append(sim_res.get("packets_per_joule", 0.0))
            runtime_list.append(sim_res["elapsed_seconds"])

        valid_fnds = [v for v in fnd_list if v is not None]
        valid_hnds = [v for v in hnd_list if v is not None]
        valid_lnds = [v for v in lnd_list if v is not None]

        raw_results.append({
            "key": proto_key,
            "name": proto_name,
            "fnd_mean": round(float(np.mean(valid_fnds)), 0) if valid_fnds else None,
            "fnd_std": round(float(np.std(valid_fnds)), 0) if valid_fnds else 0.0,
            "hnd_mean": round(float(np.mean(valid_hnds)), 0) if valid_hnds else None,
            "hnd_std": round(float(np.std(valid_hnds)), 0) if valid_hnds else 0.0,
            "lnd_mean": round(float(np.mean(valid_lnds)), 0) if valid_lnds else None,
            "lnd_std": round(float(np.std(valid_lnds)), 0) if valid_lnds else 0.0,
            "packets_mean": round(float(np.mean(packets_list)), 0),
            "packets_std": round(float(np.std(packets_list)), 0),
            "packets_per_joule": round(float(np.mean(pkts_per_j_list)), 1),
            "runtime_s_mean": round(float(np.mean(runtime_list)), 2),
        })

    # Benchmark Assessments generated dynamically
    pso_res = next((r for r in raw_results if r["key"] == "pso_hybrid"), raw_results[0])
    pso_pkts = pso_res["packets_mean"] or 1.0

    for r in raw_results:
        pkt_diff = ((r["packets_mean"] - pso_pkts) / pso_pkts) * 100.0
        fnd_str = f"R{int(r['fnd_mean'])}" if r["fnd_mean"] is not None else f"> {config.max_rounds}"

        if r["key"] == "ann_pso_hybrid":
            assessment = f"FND {fnd_str}, {r['packets_per_joule']} pkts/J ({pkt_diff:+.0f}% pkts vs PSO-Hybrid)"
            badge = "status-emerald"
        elif r["key"] == "pso_hybrid":
            assessment = f"High throughput baseline ({r['packets_mean']:,.0f} pkts, FND {fnd_str})"
            badge = "status-cyan"
        elif r["key"] == "hybrid":
            assessment = f"Intra-cluster chain aggregation (FND {fnd_str}, {r['packets_mean']:,.0f} pkts)"
            badge = "status-amber"
        elif r["key"] == "pegasis":
            assessment = f"Single linear daisy-chain (FND {fnd_str}, {r['packets_per_joule']} pkts/J)"
            badge = "status-amber"
        else:
            assessment = f"Direct cluster relay baseline (FND {fnd_str})"
            badge = "status-rose"

        r["assessment"] = assessment
        r["badge_class"] = badge

    return raw_results
