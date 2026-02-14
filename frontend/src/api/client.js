import axios from "axios";

const api = axios.create({ baseURL: "/api" });

const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token");

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && !config.url.includes("/auth/")) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes("/login")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const getCategories = () => api.get("/categories/").then((r) => r.data);

export const getTransactions = (filters = {}) => {
  const params = {};
  if (filters.date_debut) params.date_debut = filters.date_debut;
  if (filters.date_fin) params.date_fin = filters.date_fin;
  if (filters.categorie) params.categorie = filters.categorie;
  if (filters.type) params.type_filtre = filters.type;
  return api.get("/transactions/", { params }).then((r) => r.data);
};

export const createTransaction = (data) =>
  api.post("/transactions/", data).then((r) => r.data);

export const getBudgets = () => api.get("/budgets/").then((r) => r.data);

export const getBudget = (id) => api.get(`/budgets/${id}`).then((r) => r.data);

export const createBudget = (data) =>
  api.post("/budgets/", data).then((r) => r.data);

export const updateBudget = (id, data) =>
  api.put(`/budgets/${id}`, data).then((r) => r.data);

export const register = (data) =>
  api.post("/auth/register", data).then((r) => r.data);
export const login = (data) =>
  api.post("/auth/login", data).then((r) => r.data);

export const updateTransaction = (id, data) =>
  api.put(`/transactions/${id}`, data).then((r) => r.data);
export const deleteTransaction = (id) =>
  api.delete(`/transactions/${id}`).then((r) => r.data);
export const getTotalTransactions = (filters = {}) => {
  const params = {};
  if (filters.date_debut) params.date_debut = filters.date_debut;
  if (filters.date_fin) params.date_fin = filters.date_fin;
  if (filters.categorie) params.categorie = filters.categorie;
  if (filters.type) params.type_filtre = filters.type;
  return api.get("/transactions/total", { params }).then((r) => r.data);
};
