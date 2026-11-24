import api from "../api/axios";

export const appointmentService = {
  // payload: { docId, slotDate: "YYYY-MM-DD", slotTime: "HH:mm" }
  book: async (payload) => (await api.post("/appointments/book", payload)).data,

  list: async () => (await api.get("/appointments/list")).data,

  // which slots are already taken for a doctor on a date
  booked: async (docId, slotDate) =>
    (await api.get("/appointments/booked", { params: { docId, slotDate } })).data,

  cancel: async (appointmentId) =>
    (await api.patch(`/appointments/cancel/${appointmentId}`)).data,
};
