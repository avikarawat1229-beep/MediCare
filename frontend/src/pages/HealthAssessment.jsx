import { useEffect, useState } from "react";
import { ChevronDown, Search as SearchIcon } from "lucide-react";
import { mlService } from "../services/mlService.js";
import { HEART_CONFIG } from "../data/assessmentConfigs.js";
import { buildRecommendations, getEmergencyWarning } from "../utils/recommendations.js";
import FormField from "../components/FormField.jsx";
import SymptomPicker from "../components/SymptomPicker.jsx";
import AssessmentResults from "../components/AssessmentResults.jsx";
import RecommendedDoctors from "../components/RecommendedDoctors.jsx";

// Unified page: symptoms + basic vitals -> up to 3 ML models -> result, explanation, doctor.
//
// Which model runs?
//   Symptom model  : needs at least 1 selected symptom
//   Diabetes model : needs age + sugar + diastolic BP + BMI (height & weight)
//   Heart model    : needs age, sex, systolic BP, cholesterol + the 9 "test report" answers
const HEART_EXTRA_FIELDS = HEART_CONFIG.fields.filter((f) =>
  ["cp", "fbs", "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"].includes(f.name));

const emptyVitals = { age: "", gender: "", systolic: "", diastolic: "", glucose: "", height: "", weight: "", cholesterol: "", pregnancies: "" };
const emptyHeart = Object.fromEntries(HEART_EXTRA_FIELDS.map((f) => [f.name, ""]));

const inputClass = "px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-secondary w-full";
const filled = (v) => v !== "" && v !== null && v !== undefined;

const HealthAssessment = () => {
  const [allSymptoms, setAllSymptoms] = useState([]);
  const [symptomsError, setSymptomsError] = useState("");
  const [selected, setSelected] = useState([]);
  const [vitals, setVitals] = useState(emptyVitals);
  const [heartExtra, setHeartExtra] = useState(emptyHeart);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [output, setOutput] = useState(null);   // everything we show after "Predict"

  // Load the symptom list from Flask once
  useEffect(() => {
    mlService.getSymptoms().then(setAllSymptoms).catch(() =>
      setSymptomsError("The symptom library is temporarily unavailable. Please refresh and try again."));
  }, []);

  const toggleSymptom = (name) =>
    setSelected((cur) => (cur.includes(name) ? cur.filter((s) => s !== name) : [...cur, name]));
  const onVital = (e) => setVitals({ ...vitals, [e.target.name]: e.target.value });
  const onHeart = (e) => setHeartExtra({ ...heartExtra, [e.target.name]: e.target.value });

  // BMI = kg / (metres squared), worked out from height + weight so users don't need to know it
  const bmi = filled(vitals.height) && filled(vitals.weight)
    ? Math.round((Number(vitals.weight) / (Number(vitals.height) / 100) ** 2) * 10) / 10
    : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOutput(null);
    if (!selected.length && !(filled(vitals.glucose) || filled(vitals.systolic))) {
      return setError("Please select at least one symptom, or enter some vitals.");
    }

    const v = vitals;
    const jobs = [];   // each job = one model call

    // 1) Symptom model
    if (selected.length) {
      jobs.push({ key: "symptom", label: "symptom analysis", run: () => mlService.predict("/predict-disease", { symptoms: selected }) });
    }

    // 2) Diabetes model (unknown values are sent as 0, which app.py treats as "missing")
    if (filled(v.age) && filled(v.glucose) && filled(v.diastolic) && bmi !== "") {
      jobs.push({
        key: "diabetes", label: "diabetes check",
        run: () => mlService.predict("/predict-diabetes", {
          pregnancies: v.gender === "0" && filled(v.pregnancies) ? v.pregnancies : 0,
          glucose: v.glucose, bloodpressure: v.diastolic, skinthickness: 0, insulin: 0,
          bmi, dpf: 0.5, age: v.age,
        }),
      });
    }

    // 3) Heart model (needs the full set of 13 answers)
    const heartReady = filled(v.age) && filled(v.gender) && filled(v.systolic) && filled(v.cholesterol)
      && HEART_EXTRA_FIELDS.every((f) => filled(heartExtra[f.name]));
    if (heartReady) {
      jobs.push({
        key: "heart", label: "heart check",
        run: () => mlService.predict("/predict", {
          age: v.age, sex: v.gender, trestbps: v.systolic, chol: v.cholesterol, ...heartExtra,
        }),
      });
    }

    if (!jobs.length) return setError("Not enough information for any prediction. Select a symptom, or fill in the vitals.");

    setLoading(true);
    // allSettled = run all calls in parallel and keep going even if one of them fails
    const settled = await Promise.allSettled(jobs.map((j) => j.run()));
    setLoading(false);

    const results = {};
    const failures = [];
    settled.forEach((s, i) => (s.status === "fulfilled" ? (results[jobs[i].key] = s.value) : failures.push(jobs[i].label)));

    if (!Object.keys(results).length) {
      return setError("The analysis service is temporarily unavailable. Please try again in a few moments.");
    }

    setOutput({
      ...results,
      failures,
      emergency: getEmergencyWarning(selected),
      recommendations: buildRecommendations({
        selected, symptomResult: results.symptom, diabetesResult: results.diabetes, heartResult: results.heart,
      }),
      diabetesNote: results.diabetes
        ? "Pregnancies, skin thickness, insulin and family history were not asked, so typical values were used."
        : "",
    });
    setTimeout(() => document.getElementById("assessment-result")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  return (
    <div className="py-16 bg-[#EBEBFE] min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-2 px-4">
        Comprehensive <span className="text-secondary">Health Assessment</span>
      </h1>
      <p className="text-center text-gray-600 mb-2 px-4">Tell us your symptoms and (optionally) your vitals, and we&apos;ll suggest the right doctor</p>
      <p className="text-center text-xs text-gray-500 mb-8 max-w-xl mx-auto px-4">
        Preliminary clinical screening suggestion. Consult a healthcare professional for validation.
      </p>

      <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-6 items-start">
        {/* ---------------- LEFT: the form ---------------- */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-300 rounded-2xl p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Enter Patient Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="age" className="text-sm text-gray-700 font-medium">Age <span className="text-gray-400 font-normal">(years)</span></label>
              <input id="age" name="age" type="number" min="1" max="120" value={vitals.age} onChange={onVital} placeholder="e.g. 25" className={`${inputClass} mt-1`} />
            </div>
            <div>
              <label htmlFor="gender" className="text-sm text-gray-700 font-medium">Gender</label>
              <select id="gender" name="gender" value={vitals.gender} onChange={onVital} className={`${inputClass} mt-1`}>
                <option value="">Select</option>
                <option value="1">Male</option>
                <option value="0">Female</option>
              </select>
            </div>
          </div>

          {symptomsError ? (
            <p className="text-sm text-red-500">{symptomsError}</p>
          ) : (
            <SymptomPicker allSymptoms={allSymptoms} selected={selected} onToggle={toggleSymptom} />
          )}

          <div>
            <p className="text-sm text-gray-700 font-medium mb-2">
              General vitals <span className="text-gray-400 font-normal">(optional: adds a diabetes check)</span>
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Vital label="Blood pressure, top number (mm Hg)" name="systolic" value={vitals.systolic} onChange={onVital} ph="e.g. 120" min={80} max={220} />
              <Vital label="Blood pressure, bottom number (mm Hg)" name="diastolic" value={vitals.diastolic} onChange={onVital} ph="e.g. 80" min={40} max={150} />
              <Vital label="Blood sugar (mg/dL)" name="glucose" value={vitals.glucose} onChange={onVital} ph="e.g. 110" min={40} max={400} />
              <Vital label="Total cholesterol (mg/dL)" name="cholesterol" value={vitals.cholesterol} onChange={onVital} ph="e.g. 190" min={100} max={600} />
              <Vital label="Height (cm)" name="height" value={vitals.height} onChange={onVital} ph="e.g. 170" min={100} max={230} />
              <Vital label="Weight (kg)" name="weight" value={vitals.weight} onChange={onVital} ph="e.g. 70" min={20} max={250} />
              {vitals.gender === "0" && (
                <Vital label="Times pregnant" name="pregnancies" value={vitals.pregnancies} onChange={onVital} ph="e.g. 0" min={0} max={20} />
              )}
            </div>
            {bmi !== "" && <p className="text-xs text-gray-500 mt-2">Your BMI works out to {bmi}.</p>}
            <p className="text-xs text-gray-400 mt-1">Diabetes check needs age, sugar, bottom BP number, height and weight.</p>
          </div>

          {/* Heart model needs medical-test answers, so it lives in a collapsible section */}
          <div className="border border-gray-200 rounded-xl">
            <button
              type="button"
              onClick={() => setShowAdvanced((s) => !s)}
              className="w-full flex justify-between items-center p-3 text-sm font-medium text-gray-700 cursor-pointer"
              aria-expanded={showAdvanced}
            >
              I have heart test reports (adds a heart-disease check)
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
            </button>
            {showAdvanced && (
              <div className="p-3 pt-0 grid sm:grid-cols-2 gap-x-4 gap-y-5">
                <p className="sm:col-span-2 text-xs text-gray-500">
                  Needs age, gender, top BP number and cholesterol from above, plus all of these. Use your ECG / stress-test reports.
                </p>
                {HEART_EXTRA_FIELDS.map((f) => (
                  <FormField key={f.name} field={f} value={heartExtra[f.name]} onChange={onHeart} />
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-secondary text-white py-3 rounded-lg cursor-pointer hover:bg-primary duration-300 transition-all disabled:opacity-50"
          >
            <SearchIcon className="w-4 h-4" /> {loading ? "Analysing..." : "Predict"}
          </button>
        </form>

        {/* ---------------- RIGHT: results ---------------- */}
        <div id="assessment-result">
          {output ? (
            <AssessmentResults
              symptomResult={output.symptom}
              diabetesResult={output.diabetes}
              heartResult={output.heart}
              diabetesNote={output.diabetesNote}
              failures={output.failures}
              emergency={output.emergency}
            />
          ) : (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-gray-500">
              Your result, the reasons behind it and a recommended doctor will appear here.
            </div>
          )}
        </div>
      </div>

      {output && (
        <div className="max-w-5xl mx-auto px-4">
          <RecommendedDoctors recommendations={output.recommendations} />
        </div>
      )}
    </div>
  );
};

// small labelled number box used for the vitals grid
const Vital = ({ label, name, value, onChange, ph, min, max }) => (
  <div>
    <label htmlFor={name} className="text-xs text-gray-600">{label}</label>
    <input id={name} name={name} type="number" step="any" min={min} max={max} value={value} onChange={onChange} placeholder={ph} className={`${inputClass} mt-1`} />
  </div>
);

export default HealthAssessment;
