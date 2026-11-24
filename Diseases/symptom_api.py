"""
symptom_api.py
--------------
A Flask "Blueprint" = a group of routes kept in their own file.
It adds two endpoints to your existing Diseases/app.py:

    GET  /symptoms          -> list of all symptom names (to build the checkbox list in React)
    POST /predict-disease   -> body: {"symptoms": ["itching", "skin_rash"]}
                               returns top-3 diseases with confidence %
"""
import joblib
import numpy as np
from flask import Blueprint, jsonify, request
from explain import explain_symptoms, global_importance, build_explanation

symptom_bp = Blueprint("symptom_bp", __name__)

# Load the trained model ONCE when the server starts (not on every request - that would be slow).
_saved = joblib.load("symptom_model.pkl")
model = _saved["model"]
SYMPTOMS = _saved["symptoms"]                      # e.g. ["itching", "skin_rash", ...] in training order
SYMPTOM_INDEX = {name: i for i, name in enumerate(SYMPTOMS)}   # name -> column position


@symptom_bp.route("/symptoms", methods=["GET"])
def list_symptoms():
    return jsonify({"symptoms": SYMPTOMS})


@symptom_bp.route("/predict-disease", methods=["POST"])
def predict_disease():
    data = request.get_json(silent=True) or {}
    selected = data.get("symptoms")

    # ---- validate the input ----
    if not isinstance(selected, list) or len(selected) == 0:
        return jsonify({"error": "Send a non-empty list: {\"symptoms\": [\"itching\", ...]}"}), 400

    unknown = [s for s in selected if s not in SYMPTOM_INDEX]
    if unknown:
        return jsonify({"error": f"Unknown symptoms: {unknown}"}), 400

    # ---- turn the list of names into the 0/1 row the model was trained on ----
    # Start with all zeros (no symptoms), then put a 1 at the position of each selected symptom.
    row = np.zeros((1, len(SYMPTOMS)))
    for s in selected:
        row[0, SYMPTOM_INDEX[s]] = 1

    # ---- predict ----
    # predict_proba gives one probability per disease (they add up to 1).
    probabilities = model.predict_proba(row)[0]

    # argsort sorts ascending, so take the last 3 and reverse -> the 3 highest.
    top3_idx = np.argsort(probabilities)[-3:][::-1]
    top3 = [
        {"disease": str(model.classes_[i]),
         "confidence": round(float(probabilities[i]) * 100, 1)}   # as a percentage
        for i in top3_idx
    ]

    # ---- Explainable AI: which of the selected symptoms supported the top disease? ----
    factors, top_pct = explain_symptoms(model, SYMPTOM_INDEX, selected, int(top3_idx[0]), SYMPTOMS)
    explanation = build_explanation(factors, top_pct, method="symptom occlusion")
    supporting = [f["label"] for f in factors[:3] if f["impact"] > 0]
    explanation["summary"] = (
        f"Reported symptoms most strongly supporting this suggestion: {', '.join(supporting)}."
        if supporting else "The reported symptoms collectively support this suggestion.")
    explanation["global_importance"] = global_importance(model, SYMPTOMS)

    return jsonify({
        "predicted_disease": top3[0]["disease"],
        "top3": top3,
        "explanation": explanation,
        "disclaimer": "Preliminary clinical screening suggestion. Consult a healthcare professional for validation."
    })
