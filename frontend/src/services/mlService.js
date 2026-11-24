// Talks to the Flask ML service (port 5001). Kept separate from the Express services,
// because it is a different server.
const FLASK_URL = import.meta.env.VITE_FLASK_URL || "http://127.0.0.1:5001";

export const mlService = {
  // All symptom names the Random Forest knows (used to build the checklist)
  getSymptoms: async () => {
    const res = await fetch(`${FLASK_URL}/symptoms`);
    if (!res.ok) throw new Error("Could not load symptoms");
    return (await res.json()).symptoms;
  },

  // path: "/predict" | "/predict-diabetes" | "/predict-disease"
  predict: async (path, body) => {
    const res = await fetch(`${FLASK_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Prediction failed");
    return data;
  },
};
