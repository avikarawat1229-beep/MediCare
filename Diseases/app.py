from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

# 1. Import Blueprints and XAI helper functions
from symptom_api import symptom_bp
from explain import explain_linear, explain_tree, build_explanation

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

# ==================== HEART DISEASE MODEL ====================
model = joblib.load('heart_model.pkl')

FEATURE_ORDER = [
    "age", "sex", "cp", "trestbps", "chol",
    "fbs", "restecg", "thalach", "exang",
    "oldpeak", "slope", "ca", "thal"
]

# Neutral baseline reference for heart disease explanation
HEART_BASELINE = [54.4, 0.68, 0.97, 131.6, 246.3, 0.15, 0.53, 149.6, 0.33, 1.04, 1.40, 0.73, 2.31]

HEART_LABELS = {
    "age": "Age", "sex": "Sex", "cp": "Chest pain type", "trestbps": "Resting blood pressure",
    "chol": "Total cholesterol", "fbs": "Fasting blood sugar above 120 mg/dL", "restecg": "Resting ECG result",
    "thalach": "Peak exercise heart rate", "exang": "Exercise-induced chest pain", "oldpeak": "Exercise ST depression",
    "slope": "ST segment slope", "ca": "Major vessels on scan", "thal": "Thalassemia scan result",
}

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    missing = [f for f in FEATURE_ORDER if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    input_values = [float(data[field]) for field in FEATURE_ORDER]
    input_array = np.asarray(input_values).reshape(1, -1)

    # NOTE: class 1 = NO heart disease, class 0 = heart disease (flipped for frontend high risk)
    raw_prediction = model.predict(input_array)[0]
    prediction = 1 - int(raw_prediction)
    probability = model.predict_proba(input_array)[0][0]
    
    result = {
        "prediction": int(prediction),
        "risk_label": "High risk" if prediction == 1 else "Low risk",
        "probability": round(float(probability), 2)
    }

    # ---- Explainable AI (XAI) for Heart Disease ----
    factors = explain_linear(model.coef_, input_values, HEART_BASELINE,
                             FEATURE_ORDER, HEART_LABELS, flip=True)
    result["explanation"] = build_explanation(
        factors, round(float(probability) * 100, 1), method="linear contributions",
        unit="% share of total influence (+ raises, - lowers the estimated risk)")
    
    return jsonify(result)


# ==================== DIABETES MODEL ====================
diabetes_model = joblib.load('diabetes_model.pkl')
diabetes_imputer = joblib.load('imputer.pkl')
diabetes_scaler = joblib.load('scaler.pkl')

DIABETES_FEATURE_ORDER = [
    "pregnancies", "glucose", "bloodpressure", "skinthickness",
    "insulin", "bmi", "dpf", "age"
]

DIABETES_ZERO_AS_MISSING_INDICES = [1, 2, 3, 4, 5]

DIABETES_LABELS = {
    "pregnancies": "Number of pregnancies", "glucose": "Blood glucose", "bloodpressure": "Diastolic blood pressure",
    "skinthickness": "Skin-fold thickness", "insulin": "Serum insulin", "bmi": "Body Mass Index (BMI)",
    "dpf": "Family history score", "age": "Age",
}

@app.route("/predict-diabetes", methods=["POST"])
def predict_diabetes():
    data = request.get_json()

    missing = [f for f in DIABETES_FEATURE_ORDER if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    input_values = [float(data[field]) for field in DIABETES_FEATURE_ORDER]
    input_array = np.asarray(input_values).reshape(1, -1)

    for index in DIABETES_ZERO_AS_MISSING_INDICES:
        if input_array[0][index] == 0:
            input_array[0][index] = np.nan

    input_array_original = input_array.copy()
    input_imputed = diabetes_imputer.transform(input_array)
    input_scaled = diabetes_scaler.transform(input_imputed)

    prediction = diabetes_model.predict(input_scaled)[0]
    probability = diabetes_model.predict_proba(input_scaled)[0][1]

    result = {
        "prediction": int(prediction),
        "risk_label": "High risk" if prediction == 1 else "Low risk",
        "probability": round(float(probability), 2)
    }

    # ---- Explainable AI (XAI) for Diabetes ----
    imputed_original = diabetes_imputer.transform(input_array_original)
    factors, base_risk, rules, steps = explain_tree(diabetes_model, input_scaled, imputed_original[0],
                                             DIABETES_FEATURE_ORDER, DIABETES_LABELS, diabetes_scaler)
    explanation = build_explanation(
        factors, round(float(probability) * 100, 1), method="decision path",
        unit="percentage points of estimated risk added or removed at each step")
    explanation["average_risk_percent"] = base_risk
    explanation["decision_rules"] = rules          # plain-text version (kept for older pages)
    explanation["decision_steps"] = steps          # structured version used by the Diagnostics Hub
    result["explanation"] = explanation
    
    return jsonify(result)


# ==================== REGISTER SYMPTOM BLUEPRINT ====================
app.register_blueprint(symptom_bp)


# ==================== HEALTH CHECK ====================
@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"status": "Unified Flask AI Hub server with XAI is running"})


if __name__ == "__main__":
    app.run(debug=True, port=5001)