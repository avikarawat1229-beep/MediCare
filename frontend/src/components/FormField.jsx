import { useState } from "react";
import { Info } from "lucide-react";

// One question on the form: label + (i) help bubble + number box OR dropdown.
// `field` is one entry from data/assessmentConfigs.js
const FormField = ({ field, value, onChange, idPrefix }) => {
  // idPrefix keeps ids unique when two forms (e.g. two tabs) share a question name like "age"
  const id = idPrefix ? `${idPrefix}-${field.name}` : field.name;
  const [showHint, setShowHint] = useState(false);
  const inputClass =
    "px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-secondary w-full";

  return (
    <div className="flex flex-col gap-1 relative">
      <div className="flex items-start justify-between gap-2 sm:min-h-[2.5rem]">   {/* equal height keeps inputs aligned */}
        <label htmlFor={id} className="text-sm text-gray-700 font-medium">
          {field.medical && <span title="From a medical test">🩺 </span>}
          {field.label}
          {field.unit && <span className="text-gray-400 font-normal"> ({field.unit})</span>}
        </label>

        {/* (i) button: hover on desktop, tap on mobile, also keyboard-focusable */}
        <button
          type="button"
          aria-label={`Help: ${field.label}`}
          aria-expanded={showHint}
          aria-describedby={showHint ? `hint-${id}` : undefined}
          onClick={() => setShowHint(true)}
          onMouseEnter={() => setShowHint(true)}
          onMouseLeave={() => setShowHint(false)}
          onBlur={() => setShowHint(false)}
          className="text-secondary hover:text-primary shrink-0 cursor-pointer"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {showHint && (
        <div id={`hint-${id}`} role="tooltip" className="absolute z-10 top-full mt-1 right-0 left-0 text-xs bg-primary text-white rounded-lg p-3 shadow-lg">
          <p>{field.hint}</p>
          <p className="mt-1.5 text-white/60">Dataset field: {field.name}</p>
        </div>
      )}

      {field.options ? (
        <select id={id} name={field.name} value={value} onChange={onChange} required className={inputClass}>
          <option value="">Select an answer</option>
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={field.name}
          type="number"
          inputMode="decimal"
          step={field.step ?? "any"}
          min={field.min}
          max={field.max}
          value={value}
          onChange={onChange}
          placeholder={field.placeholder}
          required
          className={inputClass}
        />
      )}
    </div>
  );
};

export default FormField;
