import { ArrowDown, ArrowUp, Info } from "lucide-react";
import { formatAnswer, fieldByName } from "../../utils/formatAnswer.js";

// Explainable AI panel. One component, three layouts, chosen by `variant`:
//   "contribution" : heart  -> bars = each factor's share of the total influence (+ raises, - lowers)
//   "pathway"      : diabetes -> bars PLUS the step-by-step yes/no questions the screening followed
//   "symptoms"     : symptom model -> bars = how much each symptom supports the suggestion
// `config` (optional) lets us show the patient's own answers in readable form ("Male", "148 mg/dL").
const Bar = ({ label, detail, value, suffix, max, tone }) => {
  const width = `${Math.max((Math.abs(value) / max) * 100, 2)}%`;
  const colours = {
    up: { text: "text-red-600", bar: "bg-red-400" },
    down: { text: "text-green-700", bar: "bg-green-500" },
    support: { text: "text-secondary", bar: "bg-secondary" },
  }[tone];
  return (
    <div>
      <div className="flex justify-between gap-3 text-sm text-gray-700">
        <span>
          {label} {detail && <span className="text-gray-400">({detail})</span>}
        </span>
        <span className={`font-semibold shrink-0 ${colours.text}`}>
          {tone === "up" ? "+" : ""}{value}{suffix}
        </span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mt-1">
        <div className={`h-full rounded-full ${colours.bar}`} style={{ width }} />
      </div>
    </div>
  );
};

const ClinicalExplanation = ({ explanation, variant, config, title = "Explainable AI: Clinical Breakdown" }) => {
  if (!explanation?.factors?.length) return null;
  const { factors, summary, note, decision_steps, average_risk_percent, global_importance, risk_percent } = explanation;

  const isSymptoms = variant === "symptoms";
  const shown = isSymptoms ? factors.filter((f) => f.impact > 0) : factors;
  if (!shown.length) return null;
  const max = Math.max(...shown.map((f) => Math.abs(f.impact)), 1);
  const suffix = variant === "contribution" ? "%" : " pts";

  const detail = (f) => (config ? formatAnswer(fieldByName(config, f.feature), f.value) : null);

  return (
    <section className="bg-white border border-gray-300 rounded-2xl p-6" aria-label="Explainable AI breakdown">
      <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
      <p className="text-gray-600 mt-1">{summary}</p>

      {!isSymptoms && (
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500 mt-3">
          <span className="inline-flex items-center gap-1"><ArrowUp className="w-3.5 h-3.5 text-red-500" /> Raises estimated risk</span>
          <span className="inline-flex items-center gap-1"><ArrowDown className="w-3.5 h-3.5 text-green-600" /> Lowers estimated risk</span>
        </div>
      )}

      <div className="mt-5 space-y-3.5">
        {shown.map((f) => (
          <Bar
            key={f.feature}
            label={f.label}
            detail={isSymptoms ? null : detail(f)}
            value={f.impact}
            suffix={suffix}
            max={max}
            tone={isSymptoms ? "support" : f.impact > 0 ? "up" : "down"}
          />
        ))}
      </div>

      {variant === "pathway" && decision_steps?.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold text-gray-800">Decision pathway</h4>
          <p className="text-sm text-gray-500 mb-3">
            The screening followed these clinical checkpoints. Starting estimate: {average_risk_percent}% (average of the reference data).
          </p>
          <ol className="relative border-l-2 border-primary/20 ml-3 space-y-4">
            {decision_steps.map((s, i) => {
              const unit = fieldByName(config, s.feature)?.unit;
              const yours = factors.find((f) => f.feature === s.feature)?.value;
              const rose = s.risk_after > s.risk_before;
              return (
                <li key={i} className="ml-5">
                  <span className="absolute -left-[13px] flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-semibold">{i + 1}</span>
                  <p className="text-sm text-gray-800">
                    {s.label} is <b>{s.operator === "above" ? "above" : "at or below"} {s.threshold}{unit ? ` ${unit}` : ""}</b>
                    {yours !== undefined && <span className="text-gray-400"> (yours: {yours}{unit ? ` ${unit}` : ""})</span>}
                  </p>
                  <p className={`text-xs ${rose ? "text-red-600" : "text-green-700"}`}>
                    Estimated risk {s.risk_before}% &rarr; {s.risk_after}%
                  </p>
                </li>
              );
            })}
          </ol>
          <p className="text-sm text-gray-700 mt-4">Final estimated risk: <b>{risk_percent}%</b></p>
        </div>
      )}

      {isSymptoms && global_importance?.length > 0 && (
        <details className="mt-5 text-sm text-gray-600">
          <summary className="cursor-pointer font-medium text-gray-700">Most influential symptoms across the screening model</summary>
          <ul className="mt-3 space-y-2">
            {global_importance.map((g) => (
              <li key={g.feature}>
                <div className="flex justify-between text-xs"><span>{g.label}</span><span>{g.importance}%</span></div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary/60 rounded-full" style={{ width: `${Math.min(g.importance * 6, 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="flex gap-2 text-xs text-gray-500 mt-5 bg-gray-50 rounded-lg p-3">
        <Info className="w-4 h-4 shrink-0 text-secondary" /> {note}
      </p>
    </section>
  );
};

export default ClinicalExplanation;
