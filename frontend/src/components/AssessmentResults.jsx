import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import ExplanationCard from "./ExplanationCard.jsx";
import { diseaseInfo, LOW_CONFIDENCE } from "../utils/recommendations.js";
import { CONFIDENCE_FOOTNOTE, LOW_CONFIDENCE_MESSAGE, SHORT_DISCLAIMER, riskText } from "../utils/clinicalText.js";

// Shows everything the models returned. Each block only appears if that model was run.
const RiskTile = ({ title, result, note }) => {
  const high = result.prediction === 1;
  const Icon = high ? ShieldAlert : CheckCircle2;
  return (
    <div className={`rounded-xl border p-4 ${high ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}`}>
      <div className="flex items-center gap-2 text-sm text-gray-600"><Icon className="w-4 h-4" /> {title}</div>
      <p className={`text-xl font-bold mt-1 ${high ? "text-red-500" : "text-green-600"}`}>{riskText(result.prediction).label}</p>
      <p className="text-sm text-gray-600">Estimated probability: {(result.probability * 100).toFixed(0)}%</p>
      {note && <p className="text-xs text-gray-500 mt-1">{note}</p>}
    </div>
  );
};

const AssessmentResults = ({ symptomResult, diabetesResult, heartResult, diabetesNote, failures, emergency }) => (
  <div className="space-y-5">
    {emergency && (
      <div role="alert" className="flex gap-3 bg-red-600 text-white rounded-2xl p-4">
        <AlertTriangle className="w-6 h-6 shrink-0" />
        <p className="text-sm font-medium">{emergency}</p>
      </div>
    )}

    <div className="bg-white border border-gray-300 rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Prediction Result</h2>

      {symptomResult && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Preliminary condition suggestion</p>
          <p className="text-2xl font-bold text-primary mt-1">{diseaseInfo(symptomResult.predicted_disease).name}</p>
          <p className="text-sm text-gray-600">Screening confidence: <b>{symptomResult.top3[0].confidence}%</b></p>

          {symptomResult.top3[0].confidence < LOW_CONFIDENCE && (
            <p className="text-sm bg-amber-50 border border-amber-300 text-amber-800 rounded-lg p-2 mt-3">{LOW_CONFIDENCE_MESSAGE}</p>
          )}

          <p className="text-xs text-gray-500 mt-3 mb-1">Leading possibilities</p>
          {symptomResult.top3.map((d) => (
            <div key={d.disease} className="mb-2">
              <div className="flex justify-between text-sm text-gray-700">
                <span>{diseaseInfo(d.disease).name}</span><span>{d.confidence}%</span>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full" style={{ width: `${d.confidence}%` }} />
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-500 mt-2">{CONFIDENCE_FOOTNOTE} {SHORT_DISCLAIMER}</p>
        </div>
      )}

      {(diabetesResult || heartResult) && (
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          {diabetesResult && <RiskTile title="Diabetes risk" result={diabetesResult} note={diabetesNote} />}
          {heartResult && <RiskTile title="Heart disease risk" result={heartResult} />}
        </div>
      )}

      {failures.length > 0 && (
        <p className="text-sm text-red-500 mt-4">The following screening could not be completed: {failures.join(", ")}. Please try again shortly.</p>
      )}
    </div>

    {/* Explainable AI: why did each model say that? */}
    {symptomResult && <ExplanationCard explanation={{ ...symptomResult.explanation, summary: `For ${diseaseInfo(symptomResult.predicted_disease).name}: ${symptomResult.explanation.summary}` }} />}
    {diabetesResult && <ExplanationCard explanation={diabetesResult.explanation} />}
    {heartResult && <ExplanationCard explanation={heartResult.explanation} />}
  </div>
);

export default AssessmentResults;
