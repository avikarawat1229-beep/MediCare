import api from "../api/axios";

export const doctorService = {
  // speciality is optional, e.g. getAll("Cardiologist")
  getAll: async (speciality) =>
    (await api.get("/doctors", { params: speciality ? { speciality } : {} })).data,

  getById: async (id) => (await api.get(`/doctors/${id}`)).data,

  login: async ({ email, password }) =>
    (await api.post("/doctors/login", { email, password })).data,

  toggleAvailability: async () => (await api.patch("/doctors/availability")).data,
};