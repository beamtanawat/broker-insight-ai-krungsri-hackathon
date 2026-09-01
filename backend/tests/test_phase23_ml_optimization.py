"""
Phase 23 Test Suite: Machine Learning Optimization, Error Analysis, Threshold Tuning,
Feature Ablation, and Inference Performance Profiling.
"""
import json
from pathlib import Path
import pytest
import numpy as np

EXPERIMENTS_DIR = Path(__file__).parents[1] / "app" / "ml" / "experiments"
DOCS_DIR = Path(__file__).parents[2] / "docs"


def test_baseline_experiment_artifact_integrity():
    """Verifies frozen baseline record has correct metadata, features, and test metrics."""
    baseline_path = EXPERIMENTS_DIR / "baseline.json"
    assert baseline_path.exists(), "baseline.json experiment artifact must exist"

    with open(baseline_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data["experiment_id"] == "EXP-00-BASELINE"
    assert data["model_name"] == "LightGBM Priority Classifier"
    assert data["model_version"] == "1.0.0"
    assert data["feature_count"] == 17
    assert len(data["features"]) == 17

    metrics = data["test_metrics"]
    assert 0.80 <= metrics["accuracy"] <= 1.0
    assert 0.75 <= metrics["precision"] <= 1.0
    assert 0.85 <= metrics["recall"] <= 1.0
    assert 0.80 <= metrics["f1_score"] <= 1.0
    assert 0.90 <= metrics["roc_auc"] <= 1.0
    assert metrics["brier_score"] <= 0.10
    assert metrics["expected_calibration_error"] <= 0.06


def test_error_analysis_breakdown_and_profiles():
    """Verifies error analysis report correctly profiles TP, TN, FP, FN and feature means."""
    err_path = EXPERIMENTS_DIR / "error_analysis.json"
    assert err_path.exists(), "error_analysis.json artifact must exist"

    with open(err_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data["total_test_samples"] == 240
    breakdown = data["confusion_breakdown"]
    assert "True_Positive" in breakdown
    assert "True_Negative" in breakdown
    assert "False_Positive" in breakdown
    assert "False_Negative" in breakdown
    assert breakdown["True_Positive"] + breakdown["True_Negative"] + breakdown["False_Positive"] + breakdown["False_Negative"] == 240

    profiles = data["group_feature_profiles"]
    assert "True_Positive" in profiles
    assert "False_Positive" in profiles
    assert "False_Negative" in profiles

    # Ensure score band error concentrations exist
    bands = data["score_band_error_concentration"]
    assert "Low (0-39)" in bands
    assert "Medium (40-69)" in bands
    assert "High (70-100)" in bands


def test_threshold_analysis_validation_tradeoffs():
    """Verifies threshold analysis evaluates grid 0.10 to 0.90 and documents selection trade-off."""
    thresh_path = EXPERIMENTS_DIR / "threshold_analysis.json"
    assert thresh_path.exists(), "threshold_analysis.json artifact must exist"

    with open(thresh_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    grid = data["cv_grid_results"]
    assert len(grid) >= 15
    for item in grid:
        assert 0.0 <= item["threshold"] <= 1.0
        assert 0.0 <= item["f1_score"] <= 1.0
        assert 0.0 <= item["recall"] <= 1.0
        assert 0.0 <= item["precision"] <= 1.0

    selected_t = data["selected_threshold"]
    assert 0.20 <= selected_t <= 0.60
    assert "selection_rationale" in data

    holdout = data["holdout_test_result_at_selected_threshold"]
    assert holdout["selected_threshold"] == selected_t
    assert holdout["f1_score"] >= 0.80


def test_hyperparameter_optimization_cv_and_candidate():
    """Verifies HPO evaluates candidates across 5-fold CV and saves optimal parameters."""
    hpo_path = EXPERIMENTS_DIR / "hpo_candidate.json"
    assert hpo_path.exists(), "hpo_candidate.json artifact must exist"

    with open(hpo_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    candidates = data["candidates_evaluated"]
    assert len(candidates) >= 4
    for c in candidates:
        assert "candidate_id" in c
        assert "params" in c
        assert c["cv_f1_mean"] >= 0.80
        assert c["cv_roc_auc_mean"] >= 0.90

    best = data["best_candidate"]
    assert "params" in best
    assert best["cv_f1_mean"] >= 0.85

    holdout = data["holdout_test_metrics"]
    assert holdout["f1_score"] >= 0.80
    assert holdout["roc_auc"] >= 0.90
    assert holdout["brier_score"] <= 0.10


def test_feature_importance_and_ablation_study():
    """Verifies Gini/SHAP feature importance and 4 ablation experiment results."""
    ablation_path = EXPERIMENTS_DIR / "feature_ablation.json"
    assert ablation_path.exists(), "feature_ablation.json artifact must exist"

    with open(ablation_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    split_imp = data["feature_split_importance"]
    assert len(split_imp) == 17
    assert sum(x["importance_pct"] for x in split_imp) >= 99.0

    shap_imp = data["feature_shap_importance"]
    assert len(shap_imp) == 17
    assert shap_imp[0]["mean_abs_shap"] >= shap_imp[-1]["mean_abs_shap"]

    ablation_exps = data["ablation_experiments"]
    assert "Ablation 1 (Baseline - All 17 Features)" in ablation_exps
    assert "Ablation 2 (Without Engagement/Contact Features)" in ablation_exps
    assert "Ablation 3 (Without Insurance History Features)" in ablation_exps
    assert "Ablation 4 (Financial & Demographics Only)" in ablation_exps

    # Verify Baseline outperforms Demographics-Only by a large margin
    base_f1 = ablation_exps["Ablation 1 (Baseline - All 17 Features)"]["cv_f1_mean"]
    demo_f1 = ablation_exps["Ablation 4 (Financial & Demographics Only)"]["cv_f1_mean"]
    assert base_f1 > demo_f1 + 0.30, f"Full context ({base_f1}) must dramatically outperform static demographics alone ({demo_f1})"


def test_inference_latency_benchmark_and_shap_overhead():
    """Verifies single-sample prediction latency is fast (< 20ms) and reports SHAP overhead."""
    lat_path = EXPERIMENTS_DIR / "latency_benchmark.json"
    assert lat_path.exists(), "latency_benchmark.json artifact must exist"

    with open(lat_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data["benchmark_iterations"] >= 100
    assert data["single_sample_prediction_latency_ms"] <= 20.0
    assert data["single_sample_shap_latency_ms"] <= 20.0
    assert "shap_overhead_percentage" in data

    # Verify generated markdown documentation files exist
    assert (DOCS_DIR / "ml-error-analysis.md").exists()
    assert (DOCS_DIR / "ml-feature-analysis.md").exists()
    assert (DOCS_DIR / "ml-optimization-report.md").exists()
