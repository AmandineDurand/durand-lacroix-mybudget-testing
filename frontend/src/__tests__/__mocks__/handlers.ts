import { http, HttpResponse } from "msw";

const API = "/api";

export const mockLoginSuccess = {
  access_token: "jwt-token-123",
  token_type: "bearer",
  user_id: 1,
  username: "alice",
};

export const mockLoginError = {
  detail: "Nom d'utilisateur ou mot de passe incorrect",
};

export const mockRegisterConflict = {
  detail: "Ce nom d'utilisateur est déjà pris",
};

export const mockCategories = [
  { id: 1, nom: "Alimentation" },
  { id: 2, nom: "Transport" },
  { id: 3, nom: "Loisirs" },
];

export const mockTransactions = [
  {
    id: 101,
    montant: 42.5,
    libelle: "Courses",
    type: "DEPENSE",
    categorie: "Alimentation",
    date: "2026-02-10T00:00:00.000Z",
  },
  {
    id: 102,
    montant: 1500,
    libelle: "Salaire",
    type: "REVENU",
    categorie: "Revenus",
    date: "2026-02-11T00:00:00.000Z",
  },
];

export const mockBudgets = [
  {
    id: 1,
    categorie_id: 1,
    montant_fixe: 300,
    montant_depense: 150,
    montant_restant: 150,
    pourcentage_consomme: 50,
    est_depasse: false,
    debut_periode: "2026-02-01",
    fin_periode: "2026-02-28",
  },
  {
    id: 2,
    categorie_id: 2,
    montant_fixe: 100,
    montant_depense: 110,
    montant_restant: -10,
    pourcentage_consomme: 110,
    est_depasse: true,
    debut_periode: "2026-02-01",
    fin_periode: "2026-02-28",
  },
];

export const mockBudgetDetail = {
  id: 1,
  categorie_id: 1,
  montant_fixe: 300,
  montant_depense: 150,
  montant_restant: 150,
  pourcentage_consomme: 50,
  est_depasse: false,
  debut_periode: "2026-02-01",
  fin_periode: "2026-02-28",
};

export const defaultHandlers = [
  http.post(`${API}/auth/login`, async () =>
    HttpResponse.json(mockLoginSuccess),
  ),
  http.post(`${API}/auth/register`, async () =>
    HttpResponse.json({}, { status: 201 }),
  ),

  http.get(`${API}/categories/`, async () => HttpResponse.json(mockCategories)),

  http.get(`${API}/transactions/`, async () =>
    HttpResponse.json(mockTransactions),
  ),
  http.get(`${API}/transactions/total`, async () =>
    HttpResponse.json({ total: 1457.5 }),
  ),
  http.post(`${API}/transactions/`, async () =>
    HttpResponse.json({ id: 999 }, { status: 201 }),
  ),
  http.put(`${API}/transactions/:id`, async () =>
    HttpResponse.json({ ok: true }),
  ),
  http.delete(`${API}/transactions/:id`, async () =>
    HttpResponse.json({ total: 1415.0 }),
  ),

  http.get(`${API}/budgets/`, async () => HttpResponse.json(mockBudgets)),
  http.get(`${API}/budgets/:id`, async () =>
    HttpResponse.json(mockBudgetDetail),
  ),
  http.post(`${API}/budgets/`, async () =>
    HttpResponse.json({ id: 3 }, { status: 201 }),
  ),
  http.put(`${API}/budgets/:id`, async () => HttpResponse.json({ ok: true })),
];
