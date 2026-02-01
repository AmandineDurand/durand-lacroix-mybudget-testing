import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const getCategories = () => api.get('/categories/').then(r => r.data)

export const getTransactions = (filters = {}) => {
  const params = {}
  if (filters.date_debut) params.date_debut = filters.date_debut
  if (filters.date_fin) params.date_fin = filters.date_fin
  if (filters.categorie) params.categorie = filters.categorie
  return api.get('/transactions/', { params }).then(r => r.data)
}

export const createTransaction = (data) => api.post('/transactions/', data).then(r => r.data)

export const getBudgets = () => api.get('/budgets/').then(r => r.data)

export const getBudget = (id) => api.get(`/budgets/${id}`).then(r => r.data)

export const createBudget = (data) => api.post('/budgets/', data).then(r => r.data)

export const updateBudget = (id, data) => api.put(`/budgets/${id}`, data).then(r => r.data)
