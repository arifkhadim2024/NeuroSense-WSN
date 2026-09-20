"""
Model Training and Honest Seed-Split Evaluation Module.
Trains the MLPClassifier on true oracle labels and benchmarks against baselines.
"""

from typing import Dict, Any, Tuple, Optional
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix
)
from sklearn.inspection import permutation_importance
from src.ann.features import FEATURE_NAMES
from src.ann.dataset import build_ann_dataset


BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_DATA_PATH = os.path.join(BASE_DIR, "data", "ann_training_data.csv")
DEFAULT_MODEL_DIR = os.path.join(BASE_DIR, "models")


def train_ann_model(
    data_csv_path: Optional[str] = None,
    model_dir: Optional[str] = None,
    test_seed_fraction: float = 0.20,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Train and evaluate the MLPClassifier with honest seed-based train/test splitting.

    Args:
        data_csv_path: Path to training CSV data.
        model_dir: Directory to save serialized model and scaler.
        test_seed_fraction: Portion of distinct deployment seeds reserved for test set.
        random_state: Random state for reproducibility.

    Returns:
        Dictionary of comprehensive model metrics, confusion matrix, and baselines.
    """
    if data_csv_path is None:
        data_csv_path = DEFAULT_DATA_PATH
    if model_dir is None:
        model_dir = DEFAULT_MODEL_DIR

    if not os.path.exists(data_csv_path):
        build_ann_dataset(num_deployments=200, output_csv_path=data_csv_path)

    df = pd.read_csv(data_csv_path)
    distinct_seeds = np.unique(df["seed"])

    # 1. Honest Seed-Based Split: train deployments != test deployments
    rng = np.random.RandomState(random_state)
    shuffled_seeds = distinct_seeds.copy()
    rng.shuffle(shuffled_seeds)

    num_test_seeds = int(np.round(len(distinct_seeds) * test_seed_fraction))
    test_seeds = set(shuffled_seeds[:num_test_seeds])
    train_seeds = set(shuffled_seeds[num_test_seeds:])

    train_df = df[df["seed"].isin(train_seeds)]
    test_df = df[df["seed"].isin(test_seeds)]

    X_train = train_df[FEATURE_NAMES].values
    y_train = train_df["label"].values
    X_test = test_df[FEATURE_NAMES].values
    y_test = test_df["label"].values

    # 2. Fit Scaler strictly on training set
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 3. Train MLPClassifier (16, 8)
    mlp = MLPClassifier(
        hidden_layer_sizes=(16, 8),
        activation="relu",
        solver="adam",
        learning_rate_init=0.005,
        max_iter=600,
        early_stopping=True,
        validation_fraction=0.15,
        n_iter_no_change=20,
        random_state=random_state
    )
    mlp.fit(X_train_scaled, y_train)

    # 4. Evaluate on unseen test set
    y_pred = mlp.predict(X_test_scaled)
    y_prob = mlp.predict_proba(X_test_scaled)[:, 1]

    ann_metrics = {
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, y_prob)), 4),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        "loss_curve": [round(float(l), 5) for l in mlp.loss_curve_]
    }

    # 5. Permutation Feature Importance
    perm_imp = permutation_importance(mlp, X_test_scaled, y_test, n_repeats=10, random_state=random_state)
    importances = [
        {"feature": name, "importance": round(float(imp), 4)}
        for name, imp in zip(FEATURE_NAMES, perm_imp.importances_mean)
    ]
    # Sort descending by importance
    importances.sort(key=lambda x: x["importance"], reverse=True)

    # 6. Baseline Comparisons on Test Set
    # (a) All-Active Baseline
    y_all_active = np.ones_like(y_test)
    # (b) Random Sleep Baseline (matching test class balance)
    active_prior = np.mean(y_train)
    y_random = rng.binomial(1, active_prior, size=len(y_test))
    # (c) Logistic Regression Baseline
    lr = LogisticRegression(max_iter=500, random_state=random_state)
    lr.fit(X_train_scaled, y_train)
    y_lr_pred = lr.predict(X_test_scaled)
    y_lr_prob = lr.predict_proba(X_test_scaled)[:, 1]

    baselines = {
        "all_active": {
            "name": "All-Active (No Sleep)",
            "accuracy": round(float(accuracy_score(y_test, y_all_active)), 4),
            "f1": round(float(f1_score(y_test, y_all_active, zero_division=0)), 4)
        },
        "random_sleep": {
            "name": "Random Sleep",
            "accuracy": round(float(accuracy_score(y_test, y_random)), 4),
            "f1": round(float(f1_score(y_test, y_random, zero_division=0)), 4)
        },
        "logistic_regression": {
            "name": "Logistic Regression",
            "accuracy": round(float(accuracy_score(y_test, y_lr_pred)), 4),
            "f1": round(float(f1_score(y_test, y_lr_pred, zero_division=0)), 4),
            "roc_auc": round(float(roc_auc_score(y_test, y_lr_prob)), 4)
        },
        "ann_proposed": {
            "name": "ANN (Proposed MLP)",
            "accuracy": ann_metrics["accuracy"],
            "f1": ann_metrics["f1"],
            "roc_auc": ann_metrics["roc_auc"]
        }
    }

    # 7. Save Models
    os.makedirs(model_dir, exist_ok=True)
    joblib.dump(mlp, os.path.join(model_dir, "ann_model.pkl"))
    joblib.dump(scaler, os.path.join(model_dir, "ann_scaler.pkl"))

    results = {
        "metrics": ann_metrics,
        "importances": importances,
        "baselines": baselines,
        "train_samples": len(train_df),
        "test_samples": len(test_df),
        "train_seeds_count": len(train_seeds),
        "test_seeds_count": len(test_seeds)
    }

    print("\n========== ANN MODEL EVALUATION (UNSEEN TEST SEEDS) ==========")
    print(f"Accuracy:  {ann_metrics['accuracy']:.2%}")
    print(f"Precision: {ann_metrics['precision']:.2%}")
    print(f"Recall:    {ann_metrics['recall']:.2%}")
    print(f"F1-Score:  {ann_metrics['f1']:.4f}")
    print(f"ROC-AUC:   {ann_metrics['roc_auc']:.4f}")
    print("Confusion Matrix [ [TN, FP], [FN, TP] ]:", ann_metrics["confusion_matrix"])
    print("\n========== BASELINE COMPARISON ==========")
    for b_key, b_val in baselines.items():
        print(f"{b_val['name']:<25}: Acc = {b_val['accuracy']:.2%}, F1 = {b_val['f1']:.4f}")
    print("============================================================\n")

    return results


if __name__ == "__main__":
    train_ann_model()
