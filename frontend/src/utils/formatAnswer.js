// Turns a stored answer (e.g. sex = 1, glucose = 148) into what the person actually chose
// ("Male", "148 mg/dL"). Used by the on-screen explanation AND the PDF report.
export const formatAnswer = (field, raw) => {
  if (!field) return String(raw);
  if (field.options) {
    const opt = field.options.find((o) => String(o.value) === String(raw));
    return opt ? opt.label.split(":")[0] : String(raw);   // short form: text before ":"
  }
  return `${raw}${field.unit ? " " + field.unit : ""}`;
};

export const fieldByName = (config, name) => config.fields.find((f) => f.name === name);
