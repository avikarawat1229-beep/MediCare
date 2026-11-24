import { jsPDF } from "jspdf";
import { riskText, nextStep, matchStrength, LONG_DISCLAIMER, SHORT_DISCLAIMER } from "./clinicalText.js";
import { formatAnswer, fieldByName } from "./formatAnswer.js";
import { diseaseInfo, LOW_CONFIDENCE, symptomLabel, getEmergencyWarning } from "./recommendations.js";

// Builds the clinical PDF in the browser with jsPDF. No server round-trip, so the patient's
// health data is never sent to (or stored on) another server.
// jsPDF is a "drawing" library: we place text and rectangles at x/y positions on an A4 page (mm).

const APP_NAME = "AI Diagnostics Hub";
const PRIMARY = [36, 65, 102];   // site blue (#244166)
const ACCENT = [56, 147, 227];   // site accent (#3893e3)
const RED = [200, 60, 60];
const GREEN = [40, 150, 85];
const GREY = [110, 110, 110];
const PAGE_W = 210, PAGE_H = 297, MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;

// The built-in PDF font only knows basic Latin characters; strip anything else (emoji etc.)
const clean = (t) => String(t ?? "").replace(/[^\x20-\x7E]/g, "");
const today = () => new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------------------
// Small "page builder": every report uses the same header, headings, bars and footer.
// `y` is the pen position (how far down the page we are).
// ---------------------------------------------------------------------------------------
const createReport = (title, user) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 0;

  const ensureSpace = (needed) => {
    if (y + needed > PAGE_H - 22) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const heading = (text) => {
    ensureSpace(30);   // keeps a heading together with the block that follows it
    doc.setFont("helvetica", "bold").setFontSize(12.5).setTextColor(...PRIMARY);
    doc.text(clean(text), MARGIN, y);
    doc.setDrawColor(...PRIMARY).setLineWidth(0.4).line(MARGIN, y + 1.8, PAGE_W - MARGIN, y + 1.8);
    y += 9;
  };

  const paragraph = (text, size = 10, color = [50, 50, 50], bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(size).setTextColor(...color);
    const lines = doc.splitTextToSize(clean(text), CONTENT_W);   // wraps to page width
    ensureSpace(lines.length * (size * 0.45) + 2);
    doc.text(lines, MARGIN, y);
    y += lines.length * (size * 0.45) + 2;
  };

  const gauge = (x, width, pct, color) => {
    doc.setFillColor(228, 232, 238).roundedRect(x, y, width, 3.2, 1.6, 1.6, "F");
    doc.setFillColor(...color).roundedRect(x, y, Math.max((Math.min(pct, 100) / 100) * width, 2), 3.2, 1.6, 1.6, "F");
  };

  // Header band + "prepared for" lines
  doc.setFillColor(...PRIMARY).rect(0, 0, PAGE_W, 32, "F");
  doc.setTextColor(255, 255, 255).setFont("helvetica", "bold").setFontSize(17);
  doc.text(clean(title), MARGIN, 15);
  doc.setFont("helvetica", "normal").setFontSize(10);
  doc.text(`${APP_NAME}  |  Clinical Screening Report`, MARGIN, 24);
  y = 41;
  const when = new Date().toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" });
  paragraph(`Prepared for: ${user?.name || "Guest user"}${user?.email ? " (" + user.email + ")" : ""}`, 10);
  paragraph(`Date: ${when}`, 10);
  y += 3;

  // Big outcome box: label, sub-line and a 0-100% gauge
  const resultBox = ({ label, sub, pct, color }) => {
    ensureSpace(38);
    doc.setDrawColor(...color).setLineWidth(0.8).roundedRect(MARGIN, y, CONTENT_W, 31, 3, 3);
    doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(...color);
    doc.text(clean(label), MARGIN + 8, y + 11);
    doc.setFont("helvetica", "normal").setFontSize(10.5).setTextColor(60, 60, 60);
    doc.text(clean(sub), MARGIN + 8, y + 18.5);
    y += 23;
    gauge(MARGIN + 8, CONTENT_W - 16, pct, color);
    y += 15;
  };

  // Two-column table; a row with only a label is drawn as a grey group heading
  const table = (rows) => {
    let stripe = 0;
    rows.forEach(([label, value]) => {
      ensureSpace(8);
      if (value === undefined) {
        doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...GREY);
        doc.text(clean(label).toUpperCase(), MARGIN + 2, y);
        y += 6;
        stripe = 0;
        return;
      }
      if (stripe % 2 === 0) doc.setFillColor(243, 246, 250).rect(MARGIN, y - 4.3, CONTENT_W, 6.4, "F");
      doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(50, 50, 50);
      doc.text(doc.splitTextToSize(clean(label), 100)[0], MARGIN + 2, y);
      doc.setFont("helvetica", "bold");
      doc.text(doc.splitTextToSize(clean(value), 70)[0], MARGIN + 108, y);
      y += 6.4;
      stripe += 1;
    });
    y += 4;
  };

  // Horizontal bars. mode "risk": red raises / green lowers. mode "support": all blue.
  const bars = (items, { mode = "risk", suffix = "" } = {}) => {
    const maxImpact = Math.max(...items.map((i) => Math.abs(i.value)), 1);
    const barMax = 62;
    items.forEach((it) => {
      ensureSpace(9);
      const up = it.value > 0;
      const color = mode === "support" ? ACCENT : up ? RED : GREEN;
      doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(50, 50, 50);
      doc.text(doc.splitTextToSize(clean(it.label), 70)[0], MARGIN + 2, y);
      doc.setFillColor(...color).rect(MARGIN + 76, y - 3.2, Math.max((Math.abs(it.value) / maxImpact) * barMax, 0.8), 4, "F");
      doc.setTextColor(...color).setFont("helvetica", "bold");
      doc.text(`${up && mode === "risk" ? "+" : ""}${it.value}${suffix}`, MARGIN + 76 + barMax + 3, y);
      y += 7;
    });
    y += 1;
  };

  const disclaimer = () => {
    const lines = doc.splitTextToSize(clean(LONG_DISCLAIMER), CONTENT_W - 8);
    ensureSpace(lines.length * 4.4 + 16);
    doc.setFillColor(255, 247, 230).setDrawColor(230, 170, 60).setLineWidth(0.4)
      .roundedRect(MARGIN, y, CONTENT_W, lines.length * 4.4 + 10, 2, 2, "FD");
    doc.setFont("helvetica", "bold").setFontSize(9.5).setTextColor(150, 90, 0).text("Medical disclaimer", MARGIN + 4, y + 6);
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(90, 60, 0).text(lines, MARGIN + 4, y + 11);
    y += lines.length * 4.4 + 14;
  };

  // Footer on every page (added last, once we know the page count)
  const finish = () => {
    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...GREY);
      doc.text(clean(SHORT_DISCLAIMER), PAGE_W / 2, PAGE_H - 12, { align: "center" });
      doc.text(`${APP_NAME}  |  Page ${p} of ${pages}`, PAGE_W / 2, PAGE_H - 8, { align: "center" });
    }
    return doc;
  };

  return { doc, heading, paragraph, resultBox, table, bars, disclaimer, finish, skip: (mm) => { y += mm; } };
};

// ---------------------------------------------------------------------------------------
// 1) Cardiovascular / Metabolic risk report
//    config  : HEART_CONFIG or DIABETES_CONFIG      answers : what the user typed
//    result  : JSON from Flask                       user    : logged-in user (or null)
// ---------------------------------------------------------------------------------------
export const buildRiskReport = (config, answers, result, user) => {
  const r = createReport(config.reportTitle, user);
  const risk = riskText(result.prediction);
  const color = risk.high ? RED : GREEN;
  const pct = Math.round(result.probability * 100);

  r.resultBox({ label: risk.label, sub: `Estimated probability of elevated risk: ${pct}%`, pct, color });

  // Inputs grouped by the same sections as the on-screen form
  r.heading("Reported clinical inputs");
  const rows = [];
  (config.sections || [{ key: undefined, title: "Inputs" }]).forEach((sec) => {
    const fields = config.fields.filter((f) => !sec.key || f.section === sec.key);
    if (!fields.length) return;
    rows.push([sec.title]);
    fields.forEach((f) => rows.push([f.label, formatAnswer(f, answers[f.name])]));
  });
  r.table(rows);

  // XAI: contributing factors
  const ex = result.explanation;
  if (ex?.factors?.length) {
    r.heading("Explainable AI: contributing factors");
    r.paragraph(ex.summary, 10);
    if (ex.average_risk_percent !== undefined) {
      r.paragraph(`Reference baseline: patients in the training data have an average risk of ${ex.average_risk_percent}%.`, 9, GREY);
    }
    const suffix = config.key === "heart" ? "%" : " pts";
    r.bars(
      ex.factors.map((f) => ({
        label: `${f.label} (${formatAnswer(fieldByName(config, f.feature), f.value)})`,
        value: f.impact,
      })),
      { mode: "risk", suffix }
    );
    r.paragraph(
      "Red bars raised the estimated risk; green bars lowered it. Bar values show " + ex.unit + ".",
      8.5, GREY
    );

    if (ex.decision_steps?.length) {
      r.skip(2);
      r.heading("Decision pathway");
      ex.decision_steps.forEach((s, i) => {
        const field = fieldByName(config, s.feature);
        const unit = field?.unit ? " " + field.unit : "";
        const op = s.operator === "above" ? "above" : "at or below";
        r.paragraph(`${i + 1}. ${s.label} is ${op} ${s.threshold}${unit}  (estimated risk ${s.risk_before}% to ${s.risk_after}%)`, 9.5);
      });
    }
    r.skip(3);
  }

  r.heading("Recommended next steps");
  r.paragraph(nextStep(result.prediction, config.specialty));
  r.skip(3);
  r.disclaimer();
  return r.finish();
};

export const generateReport = (config, answers, result, user) =>
  buildRiskReport(config, answers, result, user).save(`${config.key}-screening-report-${today()}.pdf`);

// ---------------------------------------------------------------------------------------
// 2) Symptom analysis report
//    selected : symptom names the user ticked      result : JSON from /predict-disease
// ---------------------------------------------------------------------------------------
export const buildSymptomReport = (result, selected, user) => {
  const r = createReport("Symptom Analysis Report", user);
  const top = result.top3[0];
  const info = diseaseInfo(result.predicted_disease);
  const limited = top.confidence < LOW_CONFIDENCE;

  r.resultBox({
    label: info.name,
    sub: `${matchStrength(top.confidence)}  |  Screening confidence: ${top.confidence}%`,
    pct: top.confidence,
    color: limited ? [190, 120, 20] : ACCENT,
  });

  const emergency = getEmergencyWarning(selected);
  if (emergency) {
    r.paragraph("URGENT: " + emergency, 10, RED, true);
    r.skip(2);
  }

  r.heading("Reported symptoms");
  r.paragraph(selected.map(symptomLabel).join(", "), 10);
  r.skip(2);

  r.heading("Leading possibilities");
  r.bars(
    result.top3.map((d) => ({ label: diseaseInfo(d.disease).name, value: d.confidence })),
    { mode: "support", suffix: "%" }
  );
  if (limited) {
    r.paragraph("Limited certainty: the reported symptoms overlap with several conditions. Adding further symptoms can refine the screening.", 9, GREY);
  }

  const ex = result.explanation;
  const supporting = (ex?.factors || []).filter((f) => f.impact > 0);
  if (supporting.length) {
    r.skip(2);
    r.heading("Explainable AI: symptoms supporting this suggestion");
    r.paragraph(ex.summary, 10);
    r.bars(supporting.map((f) => ({ label: f.label, value: f.impact })), { mode: "support", suffix: " pts" });
    r.paragraph("Bar values show how many percentage points the suggestion's confidence falls when that symptom is removed.", 8.5, GREY);
  }

  r.skip(2);
  r.heading("Recommended next steps");
  const specialty = limited ? "General Physician" : info.specialty;
  r.paragraph(
    `A consultation with a ${specialty} is advisable to evaluate these symptoms. This suggestion is preliminary and should be confirmed by a clinical examination.`
  );
  r.skip(3);
  r.disclaimer();
  return r.finish();
};

export const generateSymptomReport = (result, selected, user) =>
  buildSymptomReport(result, selected, user).save(`symptom-analysis-report-${today()}.pdf`);
