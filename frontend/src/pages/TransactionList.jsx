import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getTransactions, getCategories } from '../api/client'
import { euro } from '../components/BudgetCard'
import Skeleton from '../components/Skeleton'

export default function TransactionList() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ date_debut: '', date_fin: '', categorie: '' })
  const debounceRef = useRef(null)

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
  }, [])

  const fetchData = useCallback((f) => {
    setLoading(true)
    const normalized = { ...f, categorie: f.categorie?.trim().toLowerCase() || '' }
    getTransactions(normalized)
      .then(setTransactions)
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchData(filters)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (field, value) => {
    const next = { ...filters, [field]: value }
    setFilters(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchData(next), 300)
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Link to="/" className="text-blue-600 text-sm mb-4 inline-block">&larr; Accueil</Link>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Link to="/transactions/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Ajouter
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <input
          type="date"
          value={filters.date_debut}
          onChange={e => handleFilterChange('date_debut', e.target.value)}
          className="border rounded px-3 py-2"
          placeholder="Date début"
        />
        <input
          type="date"
          value={filters.date_fin}
          onChange={e => handleFilterChange('date_fin', e.target.value)}
          className="border rounded px-3 py-2"
          placeholder="Date fin"
        />
        <input
          type="text"
          value={filters.categorie}
          onChange={e => handleFilterChange('categorie', e.target.value)}
          className="border rounded px-3 py-2"
          placeholder="Catégorie..."
          list="cat-list"
        />
        <datalist id="cat-list">
          {categories.map(c => <option key={c.id} value={c.nom} />)}
        </datalist>
      </div>

      {loading ? (
        <Skeleton count={5} />
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">Aucune transaction trouvée</p>
          <Link to="/transactions/new" className="text-blue-600 underline">Ajouter votre première transaction</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map(t => (
            <div key={t.id} className="flex justify-between items-center bg-white rounded shadow px-4 py-3">
              <div>
                <span className="font-medium">{t.libelle}</span>
                <span className="text-xs text-gray-400 ml-2">{t.categorie}</span>
                <span className="text-xs text-gray-400 ml-2">{new Date(t.date).toLocaleDateString('fr-FR')}</span>
              </div>
              <span className={`font-semibold ${t.type === 'REVENU' ? 'text-green-600' : 'text-red-600'}`}>
                {t.type === 'REVENU' ? '+' : '-'}{euro(t.montant)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
