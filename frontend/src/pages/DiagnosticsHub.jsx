import { useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { Droplets, HeartPulse, ShieldCheck, Stethoscope } from "lucide-react";
import { AppContext } from "../context/AppContext.jsx";
import { HEART_CONFIG, DIABETES_CONFIG } from "../data/assessmentConfigs.js";
import { SHORT_DISCLAIMER } from "../utils/clinicalText.js";
import TabNav from "../components/diagnostics/TabNav.jsx";
import SymptomTab from "../components/diagnostics/SymptomTab.jsx";
import RiskTab from "../components/diagnostics/RiskTab.jsx";

// Master page behind the "Symptom Checker" nav link: three screening tools in one tabbed workspace.
// The active tab lives in the URL (?tab=...), so links, refresh and the back button all work.
const TABS = [
  { key: "symptom", label: "Symptom Diagnostic", caption: "Symptoms to likely conditions", icon: Stethoscope },
  { key: "cardiovascular", label: "Cardiovascular Risk", caption: "Heart disease screening", icon: HeartPulse },
  { key: "metabolic", label: "Metabolic Risk", caption: "Diabetes screening", icon: Droplets },
];

const DiagnosticsHub = () => {
  const { navigate } = useContext(AppContext);
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab");
  const active = TABS.some((t) => t.key === requested) ? requested : "symptom";

  // replace: switching tabs should not fill the browser history
  const changeTab = (key) => setParams({ tab: key }, { replace: true });

  // All three panels stay mounted (just hidden), so a filled form or a result is NOT lost when switching tabs.
  const panels = {
    symptom: <SymptomTab />,
    cardiovascular: (
      <RiskTab config={HEART_CONFIG} variant="contribution" recommendKey="heartResult" resultHeading="Cardiovascular screening outcome" />
    ),
    metabolic: (
      <RiskTab config={DIABETES_CONFIG} variant="pathway" recommendKey="diabetesResult" resultHeading="Metabolic screening outcome" />
    ),
  };

  return (
    <div className="bg-[#EBEBFE] min-h-screen pb-20">
      <header className="bg-primary text-white">
        <div className="max-w-5xl mx-auto px-4 py-12 text-center">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/70">
            <ShieldCheck className="w-4 h-4" /> Explainable AI screening
          </p>
          <h1 className="text-3xl md:text-5xl font-bold mt-3">AI Diagnostics Hub</h1>
          <p className="text-white/80 mt-3 max-w-2xl mx-auto">
            Three clinical screening tools in one place. Every result comes with a transparent breakdown of the factors
            behind it and a downloadable clinical report.
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 -mt-6">
        <TabNav tabs={TABS} active={active} onChange={changeTab} />

        <p className="text-center text-xs text-gray-600 mt-4 mb-6">{SHORT_DISCLAIMER}</p>

        {TABS.map((t) => (
          <div key={t.key} role="tabpanel" id={`panel-${t.key}`} aria-labelledby={`tab-${t.key}`} hidden={active !== t.key}>
            {panels[t.key]}
          </div>
        ))}

        <p className="text-center text-sm text-gray-600 mt-10">
          Want your symptoms and vitals analysed together?{" "}
          <button onClick={() => navigate("/assessment")} className="text-secondary underline cursor-pointer">
            Try the Comprehensive Health Assessment
          </button>
        </p>
      </div>
    </div>
  );
};

export default DiagnosticsHub;
