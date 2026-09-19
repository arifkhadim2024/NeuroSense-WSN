import numpy as np
import pandas as pd
from .coverage import calculate_coverage, get_grid_coverage_mask
from .overlap import calculate_overlap

class CoverageOptimizer:
    """
    Coverage-Preserving Active/Sleep Node Selection with Sensing-Overlap Reduction.
    
    Pipeline:
    1. Start with ANN-predicted active/sleep states.
    2. Compute baseline coverage from all alive nodes.
    3. Target coverage = baseline_coverage - 1.0 (percentage points).
    4. If initial ANN coverage < target_coverage, greedily add sleeping nodes that maximize
       marginal coverage gain until target_coverage is met.
    5. Once target coverage is satisfied, prune redundant active nodes:
       - Only remove a node if remaining coverage >= target_coverage.
       - Greedily select the node removal that yields the greatest reduction in sensing overlap.
    6. Return optimized active and sleeping node lists.
    """
    def __init__(
        self,
        area_width=100,
        area_height=100,
        sensing_radius=10,
        grid_resolution=2
    ):
        self.area_width = area_width
        self.area_height = area_height
        self.sensing_radius = sensing_radius
        self.grid_resolution = grid_resolution

    def optimize(self, nodes, ann_predictions):
        """
        Perform coverage-preserving and overlap-reducing node state optimization.

        Parameters:
        -----------
        nodes : list of dicts
            Full list of sensor nodes in the WSN deployment.
        ann_predictions : list or 1D array
            Binary predictions from the ANN (1: active, 0: sleep) for each node.

        Returns:
        --------
        dict
            Contains final active_indices, sleeping_indices, coverage, overlap, and optimization audit log.
        """
        alive_indices = [i for i, n in enumerate(nodes) if n.get("E", 1.0) > 0]
        alive_nodes = [nodes[i] for i in alive_indices]
        
        # 1. Baseline metrics with all alive nodes active
        baseline_coverage = calculate_coverage(
            alive_nodes,
            self.area_width,
            self.area_height,
            self.sensing_radius,
            self.grid_resolution
        )
        baseline_overlap = calculate_overlap(
            alive_nodes,
            self.area_width,
            self.area_height,
            self.sensing_radius,
            self.grid_resolution
        )
        
        target_coverage = max(0.0, baseline_coverage - 1.0)
        
        # 2. Initial state from ANN
        active_set = set([i for i in alive_indices if ann_predictions[i] == 1])
        sleep_set = set([i for i in alive_indices if ann_predictions[i] == 0])
        
        # Ensure at least some nodes are active
        if not active_set:
            active_set = set(alive_indices)
            sleep_set = set()

        initial_active_nodes = [nodes[i] for i in active_set]
        ann_coverage = calculate_coverage(
            initial_active_nodes,
            self.area_width,
            self.area_height,
            self.sensing_radius,
            self.grid_resolution
        )
        ann_overlap = calculate_overlap(
            initial_active_nodes,
            self.area_width,
            self.area_height,
            self.sensing_radius,
            self.grid_resolution
        )

        current_coverage = ann_coverage
        
        # 3. Greedy Addition Phase (if ANN coverage is below target)
        while current_coverage < target_coverage and sleep_set:
            best_node = None
            best_cov = current_coverage
            
            for candidate in sleep_set:
                test_nodes = [nodes[i] for i in active_set | {candidate}]
                cov = calculate_coverage(
                    test_nodes,
                    self.area_width,
                    self.area_height,
                    self.sensing_radius,
                    self.grid_resolution
                )
                if cov > best_cov:
                    best_cov = cov
                    best_node = candidate
            
            if best_node is None:
                # No candidate improves coverage further
                break
                
            active_set.add(best_node)
            sleep_set.remove(best_node)
            current_coverage = best_cov

        # 4. Redundant Pruning & Overlap Reduction Phase
        while True:
            best_removal = None
            best_overlap = float("inf")
            
            for candidate in list(active_set):
                remaining = active_set - {candidate}
                if not remaining:
                    continue
                test_nodes = [nodes[i] for i in remaining]
                cov = calculate_coverage(
                    test_nodes,
                    self.area_width,
                    self.area_height,
                    self.sensing_radius,
                    self.grid_resolution
                )
                
                # Check if coverage constraint is satisfied
                if cov >= target_coverage:
                    ovl = calculate_overlap(
                        test_nodes,
                        self.area_width,
                        self.area_height,
                        self.sensing_radius,
                        self.grid_resolution
                    )
                    if ovl < best_overlap:
                        best_overlap = ovl
                        best_removal = candidate

            if best_removal is not None:
                active_set.remove(best_removal)
                sleep_set.add(best_removal)
            else:
                break

        # Final metrics
        final_active_indices = sorted(list(active_set))
        final_sleeping_indices = sorted(list(sleep_set))
        final_active_nodes = [nodes[i] for i in final_active_indices]

        final_coverage = calculate_coverage(
            final_active_nodes,
            self.area_width,
            self.area_height,
            self.sensing_radius,
            self.grid_resolution
        )
        final_overlap = calculate_overlap(
            final_active_nodes,
            self.area_width,
            self.area_height,
            self.sensing_radius,
            self.grid_resolution
        )

        return {
            "active_indices": final_active_indices,
            "sleeping_indices": final_sleeping_indices,
            "num_active": len(final_active_indices),
            "num_sleeping": len(final_sleeping_indices),
            "baseline_coverage": float(baseline_coverage),
            "baseline_overlap": float(baseline_overlap),
            "target_coverage": float(target_coverage),
            "ann_coverage": float(ann_coverage),
            "ann_overlap": float(ann_overlap),
            "final_coverage": float(final_coverage),
            "final_overlap": float(final_overlap),
        }
