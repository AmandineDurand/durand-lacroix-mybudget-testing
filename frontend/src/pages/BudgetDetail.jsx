import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getBudget } from '../api/client'
import { euro } from '../components/BudgetCard'
import BudgetFormModal from '../components/BudgetFormModal'
import Skeleton from '../components/Skeleton'
import { useToast } from '../components/Toast'

function progressColor(pct, depasse) {
  if (depasse || pct >= 100) return 'bg-red-500'
  if (pct >= 75) return 'bg-orange-400'
  return 'bg-green-500'
}

export default function BudgetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchBudget = () => {
    setLoading(true)
    getBudget(id)
      .then(setBudget)
      .catch(err => {
        if (err.response?.status === 404) {
          toast('Ce budget n\'existe pas', 'error')
          navigate('/budgets')
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchBudget() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="p-4 max-w-md mx-auto"><Skeleton count={4} /></div>
  if (!budget) return null

  const pct = Math.min(budget.pourcentage_consomme, 100)

  return (
    <div className="p-4 max-w-md mx-auto">
      <Link to="/budgets" className="text-blue-600 text-sm mb-4 inline-block">&larr; Budgets</Link>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Budget #{budget.id}</h1>
        <button onClick={() => setModalOpen(true)} className="text-blue-600 hover:text-blue-800" title="Éditer">
          ✏️ Éditer
        </button>
      </div>

      {budget.est_depasse && (
        <div className="bg-red-100 text-red-700 font-bold px-3 py-2 rounded mb-4 text-center">DÉPASSÉ</div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex justify-between">
          <span className="text-gray-500">Catégorie</span>
          <span>#{budget.categorie_id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Montant fixé</span>
          <span className="font-semibold">{euro(budget.montant_fixe)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Dépensé</span>
          <span className="font-semibold text-red-600">{euro(budget.montant_depense)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Reste</span>
          <span className="font-semibold text-green-600">{euro(budget.montant_restant)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Période</span>
          <span>{budget.debut_periode} → {budget.fin_periode}</span>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Consommation</span>
            <span>{budget.pourcentage_consomme.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full ${progressColor(budget.pourcentage_consomme, budget.est_depasse)}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <BudgetFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchBudget}
        budget={budget}
      />
    </div>
  )
}
