import { useRef } from "react";

// Accessible tab bar: arrow keys / Home / End move between tabs (WAI-ARIA "tabs" pattern).
const TabNav = ({ tabs, active, onChange }) => {
  const refs = useRef([]);

  const onKeyDown = (e, index) => {
    let next = null;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = tabs.length - 1;
    if (next === null) return;
    e.preventDefault();
    onChange(tabs[next].key);
    refs.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label="Diagnostic tools" className="grid grid-cols-3 gap-2 sm:gap-3 bg-white border border-gray-200 rounded-2xl p-2 shadow-sm">
      {tabs.map((tab, i) => {
        const on = tab.key === active;
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            ref={(el) => (refs.current[i] = el)}
            id={`tab-${tab.key}`}
            role="tab"
            type="button"
            aria-selected={on}
            aria-controls={`panel-${tab.key}`}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(tab.key)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 sm:py-4 cursor-pointer transition-all duration-200 ${
              on ? "bg-primary text-white shadow-md" : "text-gray-600 hover:bg-primary/5"
            }`}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="font-semibold text-xs sm:text-base leading-tight text-center">{tab.label}</span>
            <span className={`hidden md:block text-xs ${on ? "text-white/75" : "text-gray-400"}`}>{tab.caption}</span>
          </button>
        );
      })}
    </div>
  );
};

export default TabNav;
