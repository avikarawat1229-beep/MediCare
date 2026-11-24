import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, RotateCcw, Search } from "lucide-react";
import { AppContext } from "../../context/AppContext.jsx";
import { mlService } from "../../services/mlService.js";
import SymptomPicker from "../SymptomPicker.jsx";
import ClinicalExplanation from "./ClinicalExplanation.jsx";
import DownloadReportButton from "../DownloadReportButton.jsx";
import RecommendedDoctors from "../RecommendedDoctors.jsx";
import { generateSymptomReport } from "../../utils/generateReport.js";
import { buildRecommendations, diseaseInfo, getEmergencyWarning, LOW_CONFIDENCE } from "../../utils/recommendations.js";
import {
  CONFIDENCE_FOOTNOTE, LOW_CONFIDENCE_MESSAGE, SERVICE_UNAVAILABLE, SHORT_DISCLAIMER, matchStrength,
} from "../../utils/clinicalText.js";

// Tab 1: symptom -> condition suggestion (Random Forest, POST /predict-disease).
const SymptomTab = () => {
  const { user } = useContext(AppContext);
  const [allSymptoms, setAllSymptoms] = useState([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selected, setSelected] = useState([]);
  const [submitted, setSubmitted] = useState([]);   // symptoms that produced `result` (used by the PDF)
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const resultRef = useRef(null);

  const loadSymptoms = useCallback(() => {
    setLoadFailed(false);
    mlService.getSymptoms().then(setAllSymptoms).catch((e) => { console.error(e); setLoadFailed(true); });
  }, []);
  useEffect(() => { loadSymptoms(); }, [loadSymptoms]);

  const toggle = (name) => setSelected((cur) => (cur.includes(name) ? cur.filter((s) => s !== name) : [...cur, name]));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected.length) return setError("Please select at least one symptom to continue.");
    setError("");
    setLoading(true);
    try {
      const data = await mlService.predict("/predict-disease", { symptoms: selected });
      setResult(data);
      setSubmitted([...selected]);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      console.error(err);
      setError(err instanceof TypeError ? SERVICE_UNAVAILABLE : `Please review your selection. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setSelected([]); setSubmitted([]); setResult(null); setError(""); };

  const top = result?.top3?.[0];
  const limited = top && top.confidence < LOW_CONFIDENCE;
  const emergency = result ? getEmergencyWarning(submitted) : null;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-300 rounded-2xl p-6">
        <h2 className="text-2xl font-semibold text-gray-800">Symptom Diagnostic</h2>
        <p className="text-sm text-gray-600 mt-2">
          Select every symptom you are currently experiencing. The screening compares your selection with 41 conditions and
          suggests the closest matches, together with the symptoms that drove the suggestion.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-300 rounded-2xl p-6 space-y-5">
        {loadFailed ? (
          <div role="alert" className="bg-amber-50 border border-amber-300 text-amber-800 rounded-lg p-4 text-sm">
            The symptom library could not be loaded.{" "}
            <button type="button" onClick={loadSymptoms} className="underline font-medium cursor-pointer">Retry</button>
          </div>
        ) : allSymptoms.length === 0 ? (
          <p className="text-sm text-gray-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading symptom library...</p>
        ) : (
          <SymptomPicker allSymptoms={allSymptoms} selected={selected} onToggle={toggle} />
        )}

        {error && <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={loading || loadFailed}
            className="flex-1 flex items-center justify-center gap-2 bg-secondary text-white py-3 rounded-xl cursor-pointer hover:bg-primary transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? "Analysing..." : "Run Symptom Analysis"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-3 px-6 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Clear selection
          </button>
        </div>
      </form>

      {result && (
        <div ref={resultRef} className="space-y-6 scroll-mt-6">
          {emergency && (
            <div role="alert" className="flex gap-3 bg-red-600 text-white rounded-2xl p-4">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <p className="text-sm font-medium">{emergency}</p>
            </div>
          )}

          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-6">
            <p className="text-sm text-gray-600">Preliminary condition suggestion</p>
            <p className="text-3xl font-bold text-primary mt-1">{diseaseInfo(result.predicted_disease).name}</p>
            <p className="text-sm text-gray-700 mt-1">
              {matchStrength(top.confidence)} &middot; Screening confidence: <b>{top.confidence}%</b>
            </p>

            {limited && (
              <p className="text-sm bg-amber-50 border border-amber-300 text-amber-800 rounded-lg p-3 mt-4">{LOW_CONFIDENCE_MESSAGE}</p>
            )}

            <p className="text-xs text-gray-500 mt-5 mb-2">Leading possibilities</p>
            {result.top3.map((d) => (
              <div key={d.disease} className="mb-3">
                <div className="flex justify-between text-sm text-gray-700">
                  <span>{diseaseInfo(d.disease).name}</span><span>{d.confidence}%</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden border border-sky-100">
                  <div className="h-full bg-secondary rounded-full" style={{ width: `${d.confidence}%` }} />
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-500 mt-3">{CONFIDENCE_FOOTNOTE}</p>
            <p className="text-xs text-gray-500 mt-1">{SHORT_DISCLAIMER}</p>
          </div>

          <ClinicalExplanation explanation={result.explanation} variant="symptoms" title="Explainable AI: Supporting Symptoms" />
          <DownloadReportButton onDownload={() => generateSymptomReport(result, submitted, user)} />
          <RecommendedDoctors recommendations={buildRecommendations({ selected: submitted, symptomResult: result })} />
        </div>
      )}
    </div>
  );
};

export default SymptomTab;
