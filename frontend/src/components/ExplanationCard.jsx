// Shows WHY the model gave its result. Pass the "explanation" object returned by Flask.
// No chart library needed: each bar is just a <div> whose width is the factor's impact.
//   red bar   = pushed the risk UP        green bar = pushed the risk DOWN
const ExplanationCard = ({ explanation }) => {
  if (!explanation?.factors?.length) return null;

  const { factors, summary, unit, note, decision_rules, average_risk_percent, global_importance } = explanation;
  // Scale every bar against the biggest one so the chart always fills nicely
  const maxImpact = Math.max(...factors.map((f) => Math.abs(f.impact)), 1);

  return (
    <div className="max-w-xl mx-auto mt-6 bg-white border border-gray-300 rounded-2xl p-6">
      <h3 className="text-xl font-semibold text-gray-800">Explainable AI: Clinical Breakdown</h3>
      <p className="text-gray-600 mt-1">{summary}</p>
      {average_risk_percent !== undefined && (
        <p className="text-sm text-gray-500 mt-1">
          Reference baseline: patients in the training data have an average risk of about {average_risk_percent}%.
        </p>
      )}

      <div className="mt-5 space-y-3">
        {factors.map((f) => {
          const up = f.impact > 0;
          return (
            <div key={f.feature}>
              <div className="flex justify-between text-sm text-gray-700">
                <span>
                  {f.label} <span className="text-gray-400">({f.value})</span>
                </span>
                <span className={up ? "text-red-500" : "text-green-600"}>
                  {up ? "+" : ""}
                  {f.impact}
                </span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${up ? "bg-red-400" : "bg-green-500"}`}
                  style={{ width: `${(Math.abs(f.impact) / maxImpact) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-3">Bars show: {unit}</p>

      {decision_rules?.length > 0 && (
        <details className="mt-4 text-sm text-gray-600">
          <summary className="cursor-pointer font-medium">View decision pathway</summary>
          <ol className="list-decimal ml-5 mt-2 space-y-1">
            {decision_rules.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ol>
        </details>
      )}

      {global_importance?.length > 0 && (
        <details className="mt-4 text-sm text-gray-600">
          <summary className="cursor-pointer font-medium">Most influential symptoms across the screening model</summary>
          <ul className="mt-2 space-y-1">
            {global_importance.map((g) => (
              <li key={g.feature}>
                {g.label}: {g.importance}%
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="text-xs text-gray-400 mt-4">{note}</p>
    </div>
  );
};

export default ExplanationCard;
