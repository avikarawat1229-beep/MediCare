"""
train_symptom_model.py
----------------------
Run ONCE (or whenever the dataset changes):   python train_symptom_model.py

What it does:  reads Training.csv  ->  trains a Random Forest  ->  saves symptom_model.pkl

Expected CSV format (the common Kaggle "Disease Prediction" dataset):
    itching, skin_rash, ..., (one 0/1 column per symptom), prognosis
    Each ROW = one patient case.  1 = has the symptom, 0 = doesn't.
    The LAST useful column "prognosis" = the disease name (what we want to predict).
"""
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

CSV_PATH = "Training.csv"          # put your CSV next to this file (or change the path)
MODEL_PATH = "symptom_model.pkl"   # the trained model is saved here

# ---------- 1. LOAD DATA ----------
df = pd.read_csv(CSV_PATH)

# Some versions of this CSV have an empty extra column at the end ("Unnamed: 133").
# It is junk, so we drop any column whose name starts with "Unnamed".
df = df.loc[:, ~df.columns.str.startswith("Unnamed")]

# ---------- 2. SPLIT INTO INPUTS (X) AND ANSWER (y) ----------
# X = symptom columns (the inputs the model looks at)
# y = disease name        (the answer the model must learn to predict)
X = df.drop(columns=["prognosis"])
y = df["prognosis"]
symptom_names = list(X.columns)    # remember the ORDER - the API must build inputs in this exact order

print(f"Rows: {len(df)} | Symptoms: {len(symptom_names)} | Diseases: {y.nunique()}")

# ---------- 3. TRAIN / TEST SPLIT ----------
# Keep 20% of the data hidden from the model, to check honestly how well it generalises.
# stratify=y keeps the same disease proportions in both parts.
# (If a disease has too few rows to stratify, we fall back to a plain split.)
try:
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y)
except ValueError:
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42)

# ---------- 4. TRAIN THE MODEL ----------
# Random Forest = many decision trees, each trained on a random sample of the data.
# Each tree votes for a disease; the share of votes becomes the "probability".
# Averaging many trees is more stable than a single tree (less over-fitting).
#   n_estimators=100  -> 100 trees
#   random_state=42   -> same result every run (reproducible, good for a viva demo)
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# ---------- 5. EVALUATE ----------
acc = accuracy_score(y_test, model.predict(X_test))
print(f"Accuracy on unseen test data: {acc * 100:.1f}%")

# ---------- 6. SAVE ----------
# We save the model AND the symptom list together in one file.
joblib.dump({"model": model, "symptoms": symptom_names}, MODEL_PATH)
print(f"Saved -> {MODEL_PATH}")
