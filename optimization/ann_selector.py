import os
import joblib
import numpy as np
import pandas as pd
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from .coverage import get_grid_coverage_mask

class ANNNodeSelector:
    """
    Artificial Neural Network (ANN) based sensor-node state predictor (ACTIVE vs. SLEEP).
    
    Features:
    1. energy: Residual energy of the sensor node
    2. sink_distance: Euclidean distance from node to the Base Station / Sink
    3. neighbors: Number of neighboring nodes within communication range (2 * sensing_radius)
    4. coverage_contribution: Fraction / count of grid points exclusively or uniquely covered
    5. overlap_ratio: Fraction of the node's sensing area overlapping with neighboring nodes
    6. node_density: Local node density in the immediate neighborhood
    
    Note:
    The ANN is trained on heuristic node-state labels derived from coverage contribution
    and sensing redundancy metrics, not experimental ground-truth data.
    """
    def __init__(
        self,
        hidden_layer_sizes=(16, 8),
        activation="relu",
        solver="adam",
        learning_rate_init=0.001,
        max_iter=500,
        random_state=42,
        early_stopping=True,
        validation_fraction=0.20,
        n_iter_no_change=20
    ):
        self.model = MLPClassifier(
            hidden_layer_sizes=hidden_layer_sizes,
            activation=activation,
            solver=solver,
            learning_rate_init=learning_rate_init,
            max_iter=max_iter,
            random_state=random_state,
            early_stopping=early_stopping,
            validation_fraction=validation_fraction,
            n_iter_no_change=n_iter_no_change
        )
        self.scaler = StandardScaler()
        self.is_fitted = False

    @staticmethod
    def extract_features(nodes, sink=(50, 150), area_width=100, area_height=100, sensing_radius=10, grid_resolution=2):
        """
        Extract the 6 analytical features for each sensor node.
        """
        num_nodes = len(nodes)
        coords = np.array([[n["x"], n["y"]] for n in nodes])
        energies = np.array([n.get("E", 0.5) for n in nodes])
        
        # 1. Energy
        # 2. Sink distance
        sink_arr = np.array(sink)
        sink_distances = np.sqrt(np.sum((coords - sink_arr) ** 2, axis=1))
        
        # Inter-node distances
        diffs = coords[:, np.newaxis, :] - coords[np.newaxis, :, :]
        dist_matrix = np.sqrt(np.sum(diffs ** 2, axis=2))
        
        comm_range = 2.0 * sensing_radius
        # 3. Neighbors (within comm_range, excluding self)
        neighbor_counts = np.sum((dist_matrix <= comm_range) & (dist_matrix > 1e-6), axis=1)
        
        # 6. Node density (normalized neighbor count)
        comm_area = np.pi * (comm_range ** 2)
        node_density = neighbor_counts / (comm_area / 100.0)  # Density metric
        
        # Precomputed grid coverage mask: Shape (N, M)
        coverage_mask = get_grid_coverage_mask(
            nodes,
            area_width=area_width,
            area_height=area_height,
            sensing_radius=sensing_radius,
            grid_resolution=grid_resolution
        )
        
        total_covered_by_each = np.sum(coverage_mask, axis=1)  # Points covered by node i
        overall_coverage_count = np.sum(coverage_mask, axis=0)  # Total nodes covering each grid point
        
        # 4. Coverage contribution: points uniquely covered (overall_coverage_count == 1)
        unique_mask = (coverage_mask & (overall_coverage_count == 1)[np.newaxis, :])
        unique_contributions = np.sum(unique_mask, axis=1)
        # Normalized by total points covered by this node
        coverage_contribution = np.where(
            total_covered_by_each > 0,
            unique_contributions / total_covered_by_each,
            0.0
        )
        
        # 5. Overlap ratio: points covered by this node that are also covered by >= 1 other node
        overlap_mask = (coverage_mask & (overall_coverage_count > 1)[np.newaxis, :])
        overlap_points = np.sum(overlap_mask, axis=1)
        overlap_ratio = np.where(
            total_covered_by_each > 0,
            overlap_points / total_covered_by_each,
            0.0
        )
        
        features = np.column_stack((
            energies,
            sink_distances,
            neighbor_counts,
            coverage_contribution,
            overlap_ratio,
            node_density
        ))
        
        feature_df = pd.DataFrame(features, columns=[
            "energy",
            "sink_distance",
            "neighbors",
            "coverage_contribution",
            "overlap_ratio",
            "node_density"
        ])
        
        return feature_df

    @staticmethod
    def generate_heuristic_labels(features_df):
        """
        Generate heuristic active (1) / sleep (0) labels based on coverage contribution,
        overlap ratio, neighbor density, and energy.
        
        Heuristic Rule:
        - Nodes with unique coverage contribution (> 0.15) or low overlap (< 0.60) -> Active (1)
        - Nodes with high overlap (> 0.70) and multiple neighbors (> 4) in high density areas -> Sleep (0)
        - Nodes with low energy (< 0.1) in redundant areas -> Sleep (0)
        """
        labels = []
        for _, row in features_df.iterrows():
            cov_contrib = row["coverage_contribution"]
            overlap = row["overlap_ratio"]
            neighbors = row["neighbors"]
            energy = row["energy"]
            
            # Heuristic decision boundary
            if cov_contrib >= 0.12 or overlap <= 0.65 or neighbors <= 3:
                # Critical coverage provider
                labels.append(1)
            elif overlap > 0.75 and neighbors >= 5 and energy > 0.0:
                # Highly redundant node that can safely sleep
                labels.append(0)
            else:
                # Score-based tie breaker
                score = (2.0 * cov_contrib) + (0.5 * (1.0 - overlap)) - (0.1 * neighbors) + (0.5 * energy)
                labels.append(1 if score >= 0.35 else 0)
                
        return np.array(labels, dtype=int)

    def train_on_synthetic_data(
        self,
        seeds=(42, 101, 202, 303, 404, 505, 606, 707, 808, 909),
        num_nodes=100,
        area_width=100,
        area_height=100,
        sensing_radius=10,
        grid_resolution=2
    ):
        """
        Generate multi-seed deployment dataset with heuristic labels, scale features, and train the ANN.
        """
        all_features = []
        all_labels = []
        
        for s in seeds:
            rng = np.random.RandomState(s)
            nodes = []
            for i in range(num_nodes):
                nodes.append({
                    "id": i,
                    "x": rng.rand() * area_width,
                    "y": rng.rand() * area_height,
                    "E": rng.uniform(0.3, 1.5)  # Heterogeneous energy levels
                })
            
            feat_df = self.extract_features(
                nodes,
                area_width=area_width,
                area_height=area_height,
                sensing_radius=sensing_radius,
                grid_resolution=grid_resolution
            )
            labels = self.generate_heuristic_labels(feat_df)
            
            all_features.append(feat_df)
            all_labels.append(labels)
            
        combined_df = pd.concat(all_features, ignore_index=True)
        combined_labels = np.concatenate(all_labels)
        combined_df["label"] = combined_labels
        
        X = combined_df[["energy", "sink_distance", "neighbors", "coverage_contribution", "overlap_ratio", "node_density"]].values
        y = combined_labels
        
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        self.is_fitted = True
        
        return combined_df

    def predict(self, nodes, sink=(50, 150), area_width=100, area_height=100, sensing_radius=10, grid_resolution=2):
        """
        Predict active (1) or sleep (0) state for each node.
        """
        if not self.is_fitted:
            raise RuntimeError("ANN model has not been trained or loaded yet.")
            
        feat_df = self.extract_features(
            nodes,
            sink=sink,
            area_width=area_width,
            area_height=area_height,
            sensing_radius=sensing_radius,
            grid_resolution=grid_resolution
        )
        
        X = feat_df[["energy", "sink_distance", "neighbors", "coverage_contribution", "overlap_ratio", "node_density"]].values
        X_scaled = self.scaler.transform(X)
        predictions = self.model.predict(X_scaled)
        
        return predictions, feat_df

    def save(self, model_path="results/models/ann_node_selector.pkl", scaler_path="results/models/ann_scaler.pkl"):
        """
        Save the trained ANN classifier and StandardScaler artifacts.
        """
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        joblib.dump(self.model, model_path)
        joblib.dump(self.scaler, scaler_path)

    def load(self, model_path="results/models/ann_node_selector.pkl", scaler_path="results/models/ann_scaler.pkl"):
        """
        Load trained ANN classifier and StandardScaler artifacts from disk.
        """
        if not os.path.exists(model_path) or not os.path.exists(scaler_path):
            raise FileNotFoundError(f"Model or Scaler not found at {model_path} / {scaler_path}")
        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)
        self.is_fitted = True
