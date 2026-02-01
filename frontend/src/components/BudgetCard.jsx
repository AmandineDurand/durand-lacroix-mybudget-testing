import { useNavigate } from 'react-router-dom'

function progressColor(pct, depasse) {
  if (depasse || pct >= 100) return 'bg-red-500'
  if (pct >= 75) return 'bg-orange-400'
  return 'bg-green-500'
}

export const euro = (v) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v)

export default function BudgetCard({ budget, onEdit }) {
  const navigate = useNavigate()
  const pct = Math.min(budget.pourcentage_consomme, 100)

  return (
    <div
      className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/budgets/${budget.id}`)}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-medium">Budget #{budget.id}</span>
        <div className="flex items-center gap-2">
          {budget.est_depasse && (
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded">DÉPASSÉ</span>
          )}
          {onEdit && (
            <button
              onClick={e => { e.stopPropagation(); onEdit(budget) }}
              className="text-gray-400 hover:text-blue-600"
              title="Éditer"
            >
              ✏️
            </button>
          )}
        </div>
      </div>
      <div className="text-sm text-gray-600 mb-1">
        {euro(budget.montant_depense)} / {euro(budget.montant_fixe)}
      </div>
      <div className="text-xs text-gray-500 mb-2">
        Reste : {euro(budget.montant_restant)}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${progressColor(budget.pourcentage_consomme, budget.est_depasse)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1 text-right">
        {budget.pourcentage_consomme.toFixed(0)}%
      </div>
    </div>
  )
}
