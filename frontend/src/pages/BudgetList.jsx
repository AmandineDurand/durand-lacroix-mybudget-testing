import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getBudgets } from '../api/client'
import BudgetCard from '../components/BudgetCard'
import BudgetFormModal from '../components/BudgetFormModal'
import Skeleton from '../components/Skeleton'

export default function BudgetList() {
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editBudget, setEditBudget] = useState(null)

  const fetchBudgets = () => {
    setLoading(true)
    getBudgets()
      .then(setBudgets)
      .catch(() => setBudgets([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchBudgets() }, [])

  const openCreate = () => { setEditBudget(null); setModalOpen(true) }
  const openEdit = (b) => { setEditBudget(b); setModalOpen(true) }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Link to="/" className="text-blue-600 text-sm mb-4 inline-block">&larr; Accueil</Link>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Nouveau Budget
        </button>
      </div>

      {loading ? (
        <Skeleton count={4} />
      ) : budgets.length === 0 ? (
        <p className="text-gray-500 text-center py-12">Aucun budget défini.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {budgets.map(b => (
            <BudgetCard key={b.id} budget={b} onEdit={openEdit} />
          ))}
        </div>
      )}

      <BudgetFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchBudgets}
        budget={editBudget}
      />
    </div>
  )
}
