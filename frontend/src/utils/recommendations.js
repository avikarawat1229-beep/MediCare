// All the "which doctor should I see?" logic lives here, as plain functions with no React in them.
// That makes it easy to explain in a viva and easy to test.

// ---------- 1. Disease -> specialist -------------------------------------------------
// Keys are written the way Flask returns them AFTER normalise() below (lower-case, single spaces).
const DISEASE_INFO = {
  "fungal infection": { name: "Fungal infection", specialty: "Dermatologist" },
  "allergy": { name: "Allergy", specialty: "General Physician" },
  "gerd": { name: "GERD (acid reflux)", specialty: "Gastroenterologist" },
  "chronic cholestasis": { name: "Chronic cholestasis", specialty: "Gastroenterologist" },
  "drug reaction": { name: "Drug reaction", specialty: "General Physician" },
  "peptic ulcer diseae": { name: "Peptic ulcer disease", specialty: "Gastroenterologist" },
  "aids": { name: "AIDS", specialty: "General Physician" },
  "diabetes": { name: "Diabetes", specialty: "Endocrinologist" },
  "gastroenteritis": { name: "Gastroenteritis", specialty: "Gastroenterologist" },
  "bronchial asthma": { name: "Bronchial asthma", specialty: "Pulmonologist" },
  "hypertension": { name: "Hypertension (high BP)", specialty: "Cardiologist" },
  "migraine": { name: "Migraine", specialty: "Neurologist" },
  "cervical spondylosis": { name: "Cervical spondylosis", specialty: "Orthopedic Specialist" },
  "paralysis (brain hemorrhage)": { name: "Paralysis (brain haemorrhage)", specialty: "Neurologist" },
  "jaundice": { name: "Jaundice", specialty: "Gastroenterologist" },
  "malaria": { name: "Malaria", specialty: "General Physician" },
  "chicken pox": { name: "Chickenpox", specialty: "General Physician" },
  "dengue": { name: "Dengue", specialty: "General Physician" },
  "typhoid": { name: "Typhoid", specialty: "General Physician" },
  "hepatitis a": { name: "Hepatitis A", specialty: "Gastroenterologist" },
  "hepatitis b": { name: "Hepatitis B", specialty: "Gastroenterologist" },
  "hepatitis c": { name: "Hepatitis C", specialty: "Gastroenterologist" },
  "hepatitis d": { name: "Hepatitis D", specialty: "Gastroenterologist" },
  "hepatitis e": { name: "Hepatitis E", specialty: "Gastroenterologist" },
  "alcoholic hepatitis": { name: "Alcoholic hepatitis", specialty: "Gastroenterologist" },
  "tuberculosis": { name: "Tuberculosis", specialty: "Pulmonologist" },
  "common cold": { name: "Common cold", specialty: "General Physician" },
  "pneumonia": { name: "Pneumonia", specialty: "Pulmonologist" },
  "dimorphic hemmorhoids(piles)": { name: "Piles (haemorrhoids)", specialty: "Gastroenterologist" },
  "heart attack": { name: "Heart attack", specialty: "Cardiologist" },
  "varicose veins": { name: "Varicose veins", specialty: "General Physician" },
  "hypothyroidism": { name: "Hypothyroidism", specialty: "Endocrinologist" },
  "hyperthyroidism": { name: "Hyperthyroidism", specialty: "Endocrinologist" },
  "hypoglycemia": { name: "Hypoglycemia (low sugar)", specialty: "Endocrinologist" },
  "osteoarthristis": { name: "Osteoarthritis", specialty: "Orthopedic Specialist" },
  "arthritis": { name: "Arthritis", specialty: "Orthopedic Specialist" },
  "(vertigo) paroymsal positional vertigo": { name: "Vertigo (BPPV)", specialty: "Neurologist" },
  "acne": { name: "Acne", specialty: "Dermatologist" },
  "urinary tract infection": { name: "Urinary tract infection", specialty: "General Physician" },
  "psoriasis": { name: "Psoriasis", specialty: "Dermatologist" },
  "impetigo": { name: "Impetigo", specialty: "Dermatologist" },
};

// Flask returns names with stray spaces ("Diabetes "), so we clean before looking up.
const normalise = (s) => String(s).trim().replace(/\s+/g, " ").toLowerCase();

export const diseaseInfo = (rawName) =>
  DISEASE_INFO[normalise(rawName)] || { name: String(rawName).trim(), specialty: "General Physician" };

// ---------- 2. Symptom rules (work even when the models are unsure) -------------------
const SYMPTOM_RULES = [
  { symptoms: ["chest_pain", "palpitations", "fast_heart_rate"], specialty: "Cardiologist",
    reason: "You reported chest or heart-related symptoms." },
  { symptoms: ["polyuria", "excessive_hunger", "irregular_sugar_level", "increased_appetite"], specialty: "Endocrinologist",
    reason: "You reported symptoms associated with blood-sugar or hormonal conditions." },
  { symptoms: ["high_fever", "mild_fever", "chills", "runny_nose", "continuous_sneezing", "throat_irritation", "malaise"],
    specialty: "General Physician", reason: "Fever and cold-type symptoms are usually assessed by a general physician first." },
];

// ---------- 3. Emergency warning ------------------------------------------------------
const ALWAYS_URGENT = ["slurred_speech", "weakness_of_one_body_side", "coma", "altered_sensorium", "stomach_bleeding", "blood_in_sputum"];
const CHEST_DANGER_PARTNERS = ["breathlessness", "sweating", "palpitations", "fast_heart_rate"];

export const getEmergencyWarning = (selected) => {
  const has = (s) => selected.includes(s);
  if (has("chest_pain") && CHEST_DANGER_PARTNERS.some(has))
    return "Chest pain together with breathlessness, sweating or a racing heart can be a medical emergency. Call your local emergency number or go to a hospital now.";
  if (ALWAYS_URGENT.some(has))
    return "One of the symptoms you reported can indicate a serious condition. Please seek urgent medical care instead of waiting for an appointment.";
  return null;
};

// Below this the symptom model has limited certainty (few symptoms fit many diseases),
// so we show a caution and do NOT use its disease to pick a specialist.
export const LOW_CONFIDENCE = 40;

// ---------- 4. Combine everything into a ranked list of specialists -------------------
// Inputs are the raw results from Flask (any can be null if that model was not run).
export const buildRecommendations = ({ selected, symptomResult, diabetesResult, heartResult }) => {
  const list = [];
  const add = (specialty, reason) => {
    const existing = list.find((r) => r.specialty === specialty);
    if (existing) existing.reasons.push(reason);          // same specialist, extra reason
    else list.push({ specialty, reasons: [reason] });
  };

  if (heartResult?.prediction === 1)
    add("Cardiologist", `Your cardiovascular screening indicated an elevated risk (${Math.round(heartResult.probability * 100)}% estimated).`);
  if (diabetesResult?.prediction === 1)
    add("Endocrinologist", `Your metabolic screening indicated an elevated diabetes risk (${Math.round(diabetesResult.probability * 100)}% estimated).`);

  if (symptomResult?.predicted_disease && symptomResult.top3[0].confidence >= LOW_CONFIDENCE) {
    const info = diseaseInfo(symptomResult.predicted_disease);
    add(info.specialty, `Your reported symptoms most closely align with ${info.name} (${symptomResult.top3[0].confidence}% screening confidence).`);
  }

  SYMPTOM_RULES.forEach((rule) => {
    if (rule.symptoms.some((s) => selected.includes(s))) add(rule.specialty, rule.reason);
  });

  if (list.length === 0) add("General Physician", "A general physician is the recommended first step for a clinical check-up.");
  // Specialist with the MOST supporting reasons goes first (sort is stable, so ties keep their order)
  list.sort((a, b) => b.reasons.length - a.reasons.length);
  return list.slice(0, 3);   // never overwhelm the user
};

// ---------- 5. Find real doctors for a specialty --------------------------------------
// Your database might call them slightly different things, so we allow aliases.
const ALIASES = {
  "General Physician": ["General Physician", "General Practitioner", "Family Medicine"],
  Neurologist: ["Neurologist", "Neurosurgeon"],
  "Orthopedic Specialist": ["Orthopedic Specialist", "Orthopedist", "Orthopaedic"],
};

export const findDoctors = (doctors, specialty) => {
  const names = (ALIASES[specialty] || [specialty]).map((n) => n.toLowerCase());
  return doctors.filter((d) => names.includes(String(d.specialty).toLowerCase()) && d.available !== false);
};

// ---------- 6. Display helper -----------------------------------------------------------
// "high_fever" -> "High Fever"
export const symptomLabel = (s) =>
  s.replace(/_/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
