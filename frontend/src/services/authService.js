import api from "../api/axios";

export const authService = {
  register: async ({ name, email, password, role }) =>
    (await api.post("/auth/register", { name, email, password, role })).data,

  login: async ({ email, password }) =>
    (await api.post("/auth/login", { email, password })).data,

  logout: async () => (await api.post("/auth/logout")).data,

  // Used on app start to restore the session from the cookie
  getProfile: async () => (await api.get("/auth/profile")).data,
};