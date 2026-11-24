// ONE place that describes every question on the two health forms.
// The form (RiskTab.jsx) AND the PDF report (generateReport.js) both read from here,
// so a label is written once and can never be different on screen and in the PDF.
//
// Each field:
//   section  -> which group heading the question appears under on the form
//   name     -> MUST match the key Flask expects (see FEATURE_ORDER in app.py)
//   label    -> plain-English question shown to the user
//   hint     -> help text shown when the user taps the (i) icon
//   unit     -> shown after the label and in the PDF
//   min/max  -> sensible limits so nobody types age = 900
//   options  -> present only for dropdown questions ({label, value})

const YES_NO = [
  { label: "Yes", value: 1 },
  { label: "No", value: 0 },
];

export const HEART_CONFIG = {
  key: "heart",
  title: "Cardiovascular Risk Screening",
  reportTitle: "Cardiovascular Risk Screening Report",
  sections: [
    { key: "personal", title: "Personal details" },
    { key: "symptoms", title: "Symptoms and chest pain history" },
    { key: "vitals", title: "Vitals and blood tests" },
    { key: "tests", title: "Cardiac test reports" },
  ],
  endpoint: "/predict",
  specialty: "Cardiologist",
  intro:
    "Complete each field using your most recent medical records. Items marked with a stethoscope come from clinical tests (ECG, blood work, scans) and are best entered with your doctor's report at hand.",
  fields: [
    { name: "age", section: "personal", label: "Your age", unit: "years", placeholder: "e.g. 54", min: 1, max: 120,
      hint: "Your age in completed years." },
    { name: "sex", section: "personal", label: "Sex (as on your medical records)",
      options: [{ label: "Male", value: 1 }, { label: "Female", value: 0 }],
      hint: "The model was trained on records that list sex as male or female." },
    { name: "cp", section: "symptoms", label: "What kind of chest pain do you usually get?",
      options: [
        { label: "Typical angina: pressure or squeezing on effort, eased by rest", value: 0 },
        { label: "Atypical angina: some, but not all, of those features", value: 1 },
        { label: "Non-heart chest pain (muscle, acidity, etc.)", value: 2 },
        { label: "I get no chest pain", value: 3 },
      ],
      hint: "Pick the closest description. If a doctor has already named your chest pain type, use that." },
    { name: "trestbps", section: "vitals", label: "Blood pressure at rest (top number)", unit: "mm Hg", placeholder: "e.g. 130", min: 80, max: 220,
      hint: "In a reading like 120/80 this is the first, higher number (120). Use your latest clinic or home-monitor reading." },
    { name: "chol", section: "vitals", label: "Total cholesterol", unit: "mg/dL", placeholder: "e.g. 240", min: 100, max: 600,
      hint: "Found on a blood test called a 'lipid profile'. Use the 'Total Cholesterol' value." },
    { name: "fbs", section: "vitals", label: "Is your fasting blood sugar above 120 mg/dL?", options: YES_NO,
      hint: "'Fasting' means a blood test taken after at least 8 hours without food. If you have been told your sugar is high, choose Yes." },
    { name: "restecg", section: "tests", label: "Result of your resting heart tracing (ECG)", medical: true,
      options: [
        { label: "Normal", value: 0 },
        { label: "Minor wave abnormality (ST-T)", value: 1 },
        { label: "Thickened heart wall (LV hypertrophy)", value: 2 },
      ],
      hint: "Written on your ECG report. Not sure? Ask your doctor or the lab." },
    { name: "thalach", section: "tests", label: "Highest heart rate you reached during exercise", unit: "beats/min", placeholder: "e.g. 150", min: 60, max: 220,
      hint: "Taken from a treadmill / stress test. If you have not had one, '220 minus your age' is only a rough guide, not a real measurement." },
    { name: "exang", section: "symptoms", label: "Does exercise (like climbing stairs) bring on chest pain?", options: YES_NO,
      hint: "Choose Yes if effort usually triggers pain, tightness or pressure in your chest." },
    { name: "oldpeak", section: "tests", label: "ECG change during exercise (ST depression)", medical: true, placeholder: "e.g. 1.5", min: 0, max: 7, step: 0.1,
      hint: "A number on your stress-test report, usually between 0 and 4. 0 means no change." },
    { name: "slope", section: "tests", label: "Shape of the ECG line at peak exercise", medical: true,
      options: [
        { label: "Going up (upsloping)", value: 0 },
        { label: "Flat", value: 1 },
        { label: "Going down (downsloping)", value: 2 },
      ],
      hint: "Described in the stress-test report as the 'ST segment slope'." },
    { name: "ca", section: "tests", label: "Major heart vessels seen on a scan", medical: true,
      options: [0, 1, 2, 3].map((v) => ({ label: `${v} vessel${v === 1 ? "" : "s"}`, value: v })),
      hint: "From a heart scan (fluoroscopy / angiogram) report: how many of the 3 main vessels were highlighted. If you never had this scan, ask a doctor before relying on this result." },
    { name: "thal", section: "tests", label: "Heart blood-flow scan result (thalassemia test)", medical: true,
      options: [
        { label: "Normal", value: 2 },
        { label: "Fixed defect (permanent)", value: 1 },
        { label: "Reversible defect (only under stress)", value: 3 },
      ],
      hint: "From a nuclear stress test report. If you do not have one, ask your doctor." },
  ],
};

export const DIABETES_CONFIG = {
  key: "diabetes",
  title: "Metabolic Risk Screening",
  reportTitle: "Metabolic (Diabetes) Risk Screening Report",
  sections: [
    { key: "personal", title: "Personal details" },
    { key: "body", title: "Body measurements" },
    { key: "lab", title: "Laboratory values" },
    { key: "family", title: "Family history" },
  ],
  endpoint: "/predict-diabetes",
  specialty: "Endocrinologist",
  intro:
    "Items marked with a stethoscope come from a blood test or a routine check-up. If a value is unavailable, enter 0 and a population-typical value will be used for that item.",
  fields: [
    { name: "pregnancies", section: "personal", label: "Number of times you have been pregnant", placeholder: "e.g. 2", min: 0, max: 20,
      hint: "Enter 0 if you are male or have never been pregnant." },
    { name: "glucose", section: "lab", label: "Blood sugar (glucose)", unit: "mg/dL", medical: true, placeholder: "e.g. 120", min: 0, max: 300,
      hint: "From a blood test (fasting is best). Do not know it? Enter 0 and a typical value will be used." },
    { name: "bloodpressure", section: "body", label: "Blood pressure (bottom number)", unit: "mm Hg", medical: true, placeholder: "e.g. 70", min: 0, max: 150,
      hint: "In a reading like 120/80 this is the second, lower number (80). Enter 0 if unknown." },
    { name: "skinthickness", section: "body", label: "Skin-fold thickness (back of upper arm)", unit: "mm", medical: true, placeholder: "e.g. 20", min: 0, max: 100,
      hint: "A nurse measures this by pinching the skin with a caliper. Almost nobody knows it, so enter 0 if unknown." },
    { name: "insulin", section: "lab", label: "Insulin level in blood (2 hours after sugar drink)", unit: "mu U/mL", medical: true, placeholder: "e.g. 80", min: 0, max: 900,
      hint: "From a special lab test. Most people have not had it, so enter 0 if unknown." },
    { name: "bmi", section: "body", label: "Body Mass Index (BMI)", medical: true, placeholder: "e.g. 25.8", min: 0, max: 70,
      hint: "BMI = weight in kg divided by (height in metres x height in metres). Example: 70 kg and 1.70 m gives 24.2. Enter 0 if unknown." },
    { name: "dpf", section: "family", label: "Family history of diabetes (score)", placeholder: "e.g. 0.5", min: 0, max: 2.5,
      hint: "A score that summarises diabetes among blood relatives. Typical values are 0.1 to 1.0: higher means more close relatives with diabetes. Not sure? Use 0.5 (the average)." },
    { name: "age", section: "personal", label: "Your age", unit: "years", placeholder: "e.g. 45", min: 1, max: 120,
      hint: "Your age in completed years." },
  ],
};
