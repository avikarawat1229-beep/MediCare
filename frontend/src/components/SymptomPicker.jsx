import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { symptomLabel } from "../utils/recommendations.js";

// Symptoms most people look for first (names must match the dataset columns exactly)
const COMMON = [
  "high_fever", "mild_fever", "cough", "headache", "fatigue", "chest_pain", "nausea", "vomiting",
  "breathlessness", "dizziness", "joint_pain", "abdominal_pain", "diarrhoea", "skin_rash", "itching", "sweating",
];
// Columns that are duplicates or too personal to show as a checkbox
const HIDDEN = ["fluid_overload.1", "extra_marital_contacts"];

const SymptomPicker = ({ allSymptoms, selected, onToggle }) => {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => allSymptoms.filter((s) => !HIDDEN.includes(s)), [allSymptoms]);
  const common = COMMON.filter((s) => visible.includes(s));

  // Search across ALL symptoms (only when the user types something)
  const matches = query.trim()
    ? visible.filter((s) => symptomLabel(s).toLowerCase().includes(query.trim().toLowerCase())).slice(0, 12)
    : [];

  const Chip = ({ name }) => {
    const on = selected.includes(name);
    return (
      <button
        type="button"
        onClick={() => onToggle(name)}
        aria-pressed={on}
        className={`px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors ${
          on ? "bg-secondary text-white border-secondary" : "border-gray-300 text-gray-700 hover:border-secondary"
        }`}
      >
        {symptomLabel(name)}
      </button>
    );
  };

  return (
    <div>
      <p className="text-sm text-gray-700 font-medium mb-2">
        Select your symptoms <span className="text-gray-400 font-normal">(you can choose several)</span>
      </p>

      <div className="flex flex-wrap gap-2">
        {common.map((s) => <Chip key={s} name={s} />)}
      </div>

      <div className="relative mt-3">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search other symptoms (e.g. back pain)"
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
        />
      </div>
      {matches.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {matches.map((s) => <Chip key={s} name={s} />)}
        </div>
      )}

      {selected.length > 0 && (
        <div className="mt-4 p-3 bg-primary/5 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Selected ({selected.length})</p>
          <div className="flex flex-wrap gap-2">
            {selected.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 bg-white border border-secondary text-primary text-sm rounded-full pl-3 pr-1.5 py-0.5">
                {symptomLabel(s)}
                <button type="button" aria-label={`Remove ${symptomLabel(s)}`} onClick={() => onToggle(s)} className="cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SymptomPicker;
