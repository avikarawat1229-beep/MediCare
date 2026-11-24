import { useContext, useRef, useState } from "react";
import { Loader2, RotateCcw, Activity } from "lucide-react";
import { AppContext } from "../../context/AppContext.jsx";
import { mlService } from "../../services/mlService.js";
import FormField from "../FormField.jsx";
import RiskResultCard from "./RiskResultCard.jsx";
import ClinicalExplanation from "./ClinicalExplanation.jsx";
import DownloadReportButton from "../DownloadReportButton.jsx";
import RecommendedDoctors from "../RecommendedDoctors.jsx";
import { generateReport } from "../../utils/generateReport.js";
import { buildRecommendations } from "../../utils/recommendations.js";
import { SERVICE_UNAVAILABLE } from "../../utils/clinicalText.js";

// ONE component serves both the Cardiovascular and the Metabolic tab.
// Everything that differs (questions, endpoint, specialist, wording) comes from `config`.
//   variant      : "contribution" (heart bars) | "pathway" (diabetes decision path)
//   recommendKey : which result slot buildRecommendations() should read ("heartResult" | "diabetesResult")
const RiskTab = ({ config, variant, recommendKey, resultHeading }) => {
  const { user } = useContext(AppContext);
  const emptyForm = Object.fromEntries(config.fields.map((f) => [f.name, ""]));

  const [form, setForm] = useState(emptyForm);
  const [submitted, setSubmitted] = useState(null);   // snapshot of the answers that produced `result`
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const resultRef = useRef(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await mlService.predict(config.endpoint, form);
      setResult(data);
      setSubmitted({ ...form });   // copy, so editing the form later can never change the PDF
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      console.error(err);
      // TypeError = the request never reached the server; anything else is a validation message
      setError(err instanceof TypeError ? SERVICE_UNAVAILABLE : `Please review your entries. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(emptyForm);
    setResult(null);
    setSubmitted(null);
    setError("");
  };

  const recommendations =
    result?.prediction === 1 ? buildRecommendations({ selected: [], [recommendKey]: result }) : [];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-300 rounded-2xl p-6">
        <h2 className="text-2xl font-semibold text-gray-800">{config.title}</h2>
        <p className="text-sm text-gray-600 mt-2">{config.intro}</p>
        <p className="text-xs text-gray-500 mt-2">
          Select the <span className="text-secondary font-semibold">(i)</span> icon beside any item for a plain-language explanation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-300 rounded-2xl p-6 space-y-6">
        {config.sections.map((section) => (
          <fieldset key={section.key} className="border border-gray-200 rounded-xl p-4">
            <legend className="px-2 text-sm font-semibold text-primary">{section.title}</legend>
            <div className="grid sm:grid-cols-2 gap-x-5 gap-y-5">
              {config.fields.filter((f) => f.section === section.key).map((f) => (
                <FormField key={f.name} field={f} value={form[f.name]} onChange={handleChange} idPrefix={config.key} />
              ))}
            </div>
          </fieldset>
        ))}

        {error && <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-secondary text-white py-3 rounded-xl cursor-pointer hover:bg-primary transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            {loading ? "Analysing..." : "Run Screening"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-3 px-6 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Clear form
          </button>
        </div>
      </form>

      {result && (
        <div ref={resultRef} className="space-y-6 scroll-mt-6">
          <RiskResultCard result={result} specialty={config.specialty} heading={resultHeading} />
          <ClinicalExplanation explanation={result.explanation} variant={variant} config={config} />
          <DownloadReportButton onDownload={() => generateReport(config, submitted, result, user)} />
          {recommendations.length > 0 && <RecommendedDoctors recommendations={recommendations} />}
        </div>
      )}
    </div>
  );
};

export default RiskTab;
