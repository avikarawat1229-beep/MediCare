"""
explain.py  -  Explainable AI (XAI) helpers for the Flask ML service
=====================================================================

METHOD USED: "occlusion" (also called "leave-one-feature-out" / what-if analysis)

The idea in one sentence:
    To find out how much ONE input mattered, replace that input with a neutral
    "average patient" value, ask the model again, and see how far the predicted
    risk moves.  Big move = that input mattered a lot.

    impact of feature  =  risk(with the patient's real value)
                        - risk(with that one feature set to the average value)

    impact > 0  -> this value PUSHES RISK UP    (a "risk factor")
    impact < 0  -> this value PUSHES RISK DOWN  (a "protective factor")

Why this and not the SHAP library?
    * SHAP is the formal, game-theory version of this same idea (it averages the
      one-by-one change over every possible order of features).
    * Occlusion needs no extra library, works on ANY model (logistic regression,
      decision tree, random forest...) and each line can be explained in a viva.
"""
import numpy as np

# How many factors the frontend chart should show
TOP_N = 6


def explain_by_occlusion(risk_fn, values, baseline, names, labels=None, skip=()):
    """
    risk_fn  : function that takes ONE row (1-D numpy array) and returns the
               model's risk as a number between 0 and 1.
    values   : the patient's actual inputs, in model column order.
    baseline : the "average patient" inputs, same order and length as `values`.
    names    : technical feature names, same order.
    labels   : optional friendly names for the UI (dict name -> text).
    skip     : feature names we don't show as "factors" (e.g. nothing here by default).

    Returns a list of dicts sorted by how strongly each feature mattered.
    """
    labels = labels or {}
    values = np.asarray(values, dtype=float)
    baseline = np.asarray(baseline, dtype=float)

    full_risk = risk_fn(values)                 # risk with the patient's real values

    factors = []
    for i, name in enumerate(names):
        if name in skip:
            continue
        modified = values.copy()                # copy so we never change the original
        modified[i] = baseline[i]               # "what if this ONE value were average?"
        risk_without = risk_fn(modified)

        impact = full_risk - risk_without       # + => this value raises risk, - => lowers it
        factors.append({
            "feature": name,
            "label": labels.get(name, name),
            "value": float(values[i]),          # what the patient entered
            "baseline": round(float(baseline[i]), 2),   # the "average" we compared with
            "impact": round(float(impact) * 100, 1),    # percentage POINTS of risk
            "direction": ("increases_risk" if impact > 0.005
                          else "decreases_risk" if impact < -0.005
                          else "neutral"),
            # What-if sentence the UI can show directly:
            "what_if_risk": round(float(risk_without) * 100, 1),
        })

    # Biggest absolute effect first (sign ignored for sorting)
    factors.sort(key=lambda f: abs(f["impact"]), reverse=True)
    return factors


def build_explanation(factors, risk_percent, method="occlusion", extra_note="", unit="percentage points of risk"):
    """Wrap the factor list into the JSON block the React card expects."""
    top = factors[:TOP_N]
    up = [f for f in top if f["direction"] == "increases_risk"]

    if up:
        names = ", ".join(f["label"] for f in up[:3])
        summary = f"Key factors contributing to this estimate: {names}."
    else:
        down = [f for f in top if f["direction"] == "decreases_risk"]
        summary = ("Factors supporting a lower estimate: " + ", ".join(f["label"] for f in down[:3]) + "."
                   if down else "No single input strongly influenced this estimate.")

    return {
        "method": method,
        "unit": unit,
        "risk_percent": risk_percent,
        "summary": summary,
        "factors": top,
        "note": extra_note or (
            "These factors describe how the screening model reached its estimate. "
            "They do not establish a medical cause. Educational screening aid only."),
    }


# ----------------------------------------------------------------------------
# Logistic Regression version (heart model)  -  exact, no saturation
# ----------------------------------------------------------------------------
def explain_linear(coef, values, baseline, names, labels=None, flip=False):
    """
    Logistic regression computes:   score = b + w1*x1 + w2*x2 + ...   then risk = sigmoid(score)
    So the part of the score caused by feature i, compared with an average patient, is simply

        contribution_i = w_i * (x_i - average_i)          (this is exactly what SHAP gives
                                                           for a linear model)

    Why not occlusion here?  The sigmoid flattens near 0% / 100%, so changing ONE input
    barely moves the probability and every bar would look ~0.  Working on the raw score avoids it.

    flip=True : our heart model's class 1 means "NO disease", so a positive weight
                lowers risk -> we flip the sign so that + always means "raises risk".
    The result is shown as each feature's SHARE (%) of the total push, so bars are easy to read.
    """
    labels = labels or {}
    values = np.asarray(values, dtype=float)
    baseline = np.asarray(baseline, dtype=float)
    contrib = np.asarray(coef, dtype=float).ravel() * (values - baseline)
    if flip:
        contrib = -contrib
    total = np.abs(contrib).sum() or 1.0

    factors = []
    for i, name in enumerate(names):
        share = contrib[i] / total * 100
        factors.append({
            "feature": name, "label": labels.get(name, name),
            "value": float(values[i]), "baseline": round(float(baseline[i]), 2),
            "impact": round(float(share), 1),
            "direction": ("increases_risk" if share > 1 else "decreases_risk" if share < -1 else "neutral"),
        })
    factors.sort(key=lambda f: abs(f["impact"]), reverse=True)
    return factors


# ----------------------------------------------------------------------------
# Decision Tree version (diabetes model)  -  follow the path the patient took
# ----------------------------------------------------------------------------
def explain_tree(tree_model, row_scaled, row_original, names, labels, scaler, class_idx=1):
    """
    A decision tree is a flowchart of yes/no questions, so we can show the EXACT path.
    Walking down from the root, every question moves the probability of "diabetes"
    up or down.  We credit that move to the feature that was asked about:

        contribution of a question = P(diabetes at child node) - P(diabetes at parent node)

    Adding them all up gives:  P(diabetes at the final leaf) - P(diabetes in the whole training set).
    (Why not occlusion?  A tree only changes its answer when a value crosses a threshold,
    so swapping one value usually changes nothing and the bars would all be 0.)
    """
    t = tree_model.tree_
    # Probability of the class at every node (normalise because value holds counts/fractions)
    prob = t.value[:, 0, :] / t.value[:, 0, :].sum(axis=1, keepdims=True)

    x = np.asarray(row_scaled, dtype=float).reshape(1, -1)
    path = tree_model.decision_path(x).indices            # node ids from root to leaf
    base_p = float(prob[path[0], class_idx])              # average risk in the training data

    by_feature = np.zeros(len(names))
    rules = []
    steps = []     # structured version of the path, used by the UI and the PDF report
    for parent, child in zip(path[:-1], path[1:]):
        f = int(t.feature[parent])
        by_feature[f] += prob[child, class_idx] - prob[parent, class_idx]

        # Turn the threshold back into real units (it was learned on scaled data)
        thr_real = t.threshold[parent] * scaler.scale_[f] + scaler.mean_[f]
        went_left = (child == t.children_left[parent])
        rules.append(f"{labels.get(names[f], names[f])} {'<=' if went_left else '>'} {thr_real:.1f}")
        steps.append({
            "feature": names[f],
            "label": labels.get(names[f], names[f]),
            "operator": "at_or_below" if went_left else "above",
            "threshold": round(float(thr_real), 1),
            "risk_before": round(float(prob[parent, class_idx]) * 100, 1),
            "risk_after": round(float(prob[child, class_idx]) * 100, 1),
        })

    factors = []
    for i, name in enumerate(names):
        if by_feature[i] == 0:
            continue                                      # the tree never asked about this input
        impact = by_feature[i]
        factors.append({
            "feature": name, "label": labels.get(name, name),
            "value": round(float(row_original[i]), 2), "baseline": None,
            "impact": round(float(impact) * 100, 1),
            "direction": ("increases_risk" if impact > 0.005 else "decreases_risk" if impact < -0.005 else "neutral"),
        })
    factors.sort(key=lambda f: abs(f["impact"]), reverse=True)
    return factors, round(base_p * 100, 1), rules, steps


# ----------------------------------------------------------------------------
# Symptom (Random Forest) version
# ----------------------------------------------------------------------------
def explain_symptoms(model, symptom_index, selected, disease_idx, symptoms_all):
    """
    For the predicted disease, how much did EACH selected symptom contribute?
    Occlusion here = "remove just that symptom (set it to 0) and see how much the
    probability of the predicted disease falls".
    """
    row = np.zeros((1, len(symptoms_all)))
    for s in selected:
        row[0, symptom_index[s]] = 1
    full_p = model.predict_proba(row)[0][disease_idx]

    factors = []
    for s in selected:
        without = row.copy()
        without[0, symptom_index[s]] = 0                    # remove this one symptom
        p_without = model.predict_proba(without)[0][disease_idx]
        impact = full_p - p_without                         # + => symptom supports this disease
        factors.append({
            "feature": s,
            "label": s.replace("_", " ").title(),
            "value": 1.0,
            "baseline": 0.0,
            "impact": round(float(impact) * 100, 1),
            "direction": ("increases_risk" if impact > 0.005
                          else "decreases_risk" if impact < -0.005 else "neutral"),
            "what_if_risk": round(float(p_without) * 100, 1),
        })
    factors.sort(key=lambda f: abs(f["impact"]), reverse=True)
    return factors, round(float(full_p) * 100, 1)


def global_importance(model, symptoms_all, top_n=8):
    """
    Whole-model view (not about one patient): which symptoms does the Random Forest
    rely on most overall?  scikit-learn gives this as feature_importances_
    (how much each symptom reduced impurity across all trees, summed to 1).
    """
    order = np.argsort(model.feature_importances_)[::-1][:top_n]
    return [{"feature": symptoms_all[i],
             "label": symptoms_all[i].replace("_", " ").title(),
             "importance": round(float(model.feature_importances_[i]) * 100, 1)}
            for i in order]
