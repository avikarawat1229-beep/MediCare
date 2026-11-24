# Doctor Appointment (MERN + Flask ML)

## Ports
| Service | Port |
|---|---|
| Frontend (Vite) | 5173 |
| Backend (Express) | 5000 |
| ML service (Flask) | 5001 |

## Setup
1. **Backend** — create `backend/.env` (copy `.env.example`, fill in `MONGO_URI` and a long random `SECRET_KEY`).
   ```
   cd backend
   npm install
   npm run seed     # demo doctors + a demo patient (run once)
   npm run dev
   ```
2. **Frontend**
   ```
   cd frontend
   npm install
   npm run dev
   ```
3. **ML service** (only needed for the Symptom Checker pages)
   ```
   cd Diseases
   pip install -r requirements.txt
   python app.py
   ```

## Demo logins (created by `npm run seed`)
- Patient: `patient@demo.com` / `Patient@123`
- Doctor (choose "Doctor" on the login page): `olivia.bennett@demo.com` / `Doctor@123`

## Status
Done: auth (cookie JWT, session restore), doctors list/details from DB, slot booking with double-booking protection, my appointments + cancel, protected routes, doctor login, ML checkers.
Next: Razorpay (Phase 4), doctor dashboard pages wired to the API (Phase 5: Dashboard / Appointments / MyProfile are still mock UI), Socket.io chat (Phase 6).

## AI Diagnostics Hub  (`/symptom-checker`)
The "Symptom Checker" nav link opens one tabbed page with three tools (the active tab is kept in the URL: `?tab=symptom|cardiovascular|metabolic`):

| Tab | Model (Flask) | Explainable AI shown | PDF |
|---|---|---|---|
| Symptom Diagnostic | Random Forest, `POST /predict-disease` | symptoms that support the suggestion | Symptom Analysis Report |
| Cardiovascular Risk | Logistic Regression, `POST /predict` | each factor's share of the total influence | Cardiovascular Risk Screening Report |
| Metabolic Risk | Decision Tree, `POST /predict-diabetes` | factor bars + step-by-step decision pathway | Metabolic Risk Screening Report |

Code map: `pages/DiagnosticsHub.jsx` (page) -> `components/diagnostics/*` (TabNav, SymptomTab, RiskTab, RiskResultCard, ClinicalExplanation) -> `utils/generateReport.js` (jsPDF) and `utils/clinicalText.js` (all patient-facing wording in one place).
Old links `/symptom-checker/heart` and `/symptom-checker/diabetes` redirect to the matching tab. After pulling these changes **restart the Flask service** (it now also returns `decision_steps`).
