import { CheckCircle2, ShieldAlert } from "lucide-react";
import { riskText, nextStep, SHORT_DISCLAIMER } from "../../utils/clinicalText.js";

// Headline outcome of a risk screening: label, probability meter and a one-line next step.
const RiskResultCard = ({ result, specialty, heading }) => {
  const risk = riskText(result.prediction);
  const pct = Math.round(result.probability * 100);
  const Icon = risk.high ? ShieldAlert : CheckCircle2;
  const tone = risk.high
    ? { box: "border-red-300 bg-red-50", text: "text-red-600", bar: "bg-red-500" }
    : { box: "border-green-300 bg-green-50", text: "text-green-700", bar: "bg-green-500" };

  return (
    <div className={`rounded-2xl border p-6 ${tone.box}`}>
      <p className="text-sm text-gray-600 flex items-center gap-2"><Icon className="w-4 h-4" /> {heading}</p>
      <p className={`text-3xl font-bold mt-1 ${tone.text}`}>{risk.label}</p>

      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-700 mb-1">
          <span>Estimated probability of elevated risk</span>
          <span className="font-semibold">{pct}%</span>
        </div>
        <div className="h-3 bg-white rounded-full overflow-hidden border border-gray-200" role="img" aria-label={`Estimated probability ${pct} percent`}>
          <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <p className="text-sm text-gray-700 mt-4">{nextStep(result.prediction, specialty)}</p>
      <p className="text-xs text-gray-500 mt-2">{SHORT_DISCLAIMER}</p>
    </div>
  );
};

export default RiskResultCard;
