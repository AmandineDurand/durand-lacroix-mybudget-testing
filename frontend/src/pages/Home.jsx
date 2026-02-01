import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getBudgets, getTransactions } from '../api/client'
import BudgetCard, { euro } from '../components/BudgetCard'
import Skeleton from '../components/Skeleton'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Home() {
  const [budgets, setBudgets] = useState([])
  const [pastTransactions, setPastTransactions] = useState([])
  const [futureTransactions, setFutureTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = todayStr()
    Promise.all([getBudgets(), getTransactions()])
      .then(([b, t]) => {
        setBudgets(b.filter(bg => bg.debut_periode <= today && bg.fin_periode >= today))

        const past = []
        const future = []
        for (const tx of t) {
          const txDate = tx.date.slice(0, 10)
          if (txDate > today) {
            future.push(tx)
          } else {
            past.push(tx)
          }
        }
        setPastTransactions(past.slice(0, 5))
        setFutureTransactions(future.slice(-3).reverse())
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const renderTransaction = (t) => (
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
  )

  const noTransactions = pastTransactions.length === 0 && futureTransactions.length === 0

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">MyBudget</h1>

      <div className="flex flex-wrap gap-3 mb-8">
        <Link to="/transactions/new" className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-blue-700">
          + Ajouter une transaction
        </Link>
        <Link to="/transactions" className="bg-gray-200 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-300">
          Transactions
        </Link>
        <Link to="/budgets" className="bg-gray-200 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-300">
          Budgets
        </Link>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Budgets en cours</h2>
        {loading ? (
          <Skeleton count={3} />
        ) : budgets.length === 0 ? (
          <p className="text-gray-500">Aucun budget actif pour la période en cours.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {budgets.map(b => (
              <BudgetCard key={b.id} budget={b} />
            ))}
          </div>
        )}
      </section>

      {loading ? (
        <Skeleton count={5} />
      ) : noTransactions ? (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">Aucune transaction enregistrée.</p>
          <Link to="/transactions/new" className="text-blue-600 underline">Ajouter votre première transaction</Link>
        </div>
      ) : (
        <>
          {futureTransactions.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3">Transactions à venir</h2>
              <div className="space-y-2">
                {futureTransactions.map(renderTransaction)}
              </div>
            </section>
          )}

          {pastTransactions.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3">Dernières transactions</h2>
              <div className="space-y-2">
                {pastTransactions.map(renderTransaction)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
