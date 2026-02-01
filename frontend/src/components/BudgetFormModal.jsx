import { useState, useEffect } from 'react'
import Modal from './Modal'
import { getCategories, createBudget, updateBudget } from '../api/client'
import { useToast } from './Toast'

export default function BudgetFormModal({ open, onClose, onSuccess, budget }) {
  const toast = useToast()
  const isEdit = !!budget
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    categorie_id: '',
    montant_fixe: '',
    debut_periode: '',
    fin_periode: '',
  })
  const [initial, setInitial] = useState(null)

  useEffect(() => {
    if (open) {
      getCategories().then(setCategories).catch(() => {})
      if (budget) {
        const vals = {
          categorie_id: String(budget.categorie_id),
          montant_fixe: String(budget.montant_fixe),
          debut_periode: budget.debut_periode,
          fin_periode: budget.fin_periode,
        }
        setForm(vals)
        setInitial(vals)
      } else {
        const vals = { categorie_id: '', montant_fixe: '', debut_periode: '', fin_periode: '' }
        setForm(vals)
        setInitial(null)
      }
      setError('')
    }
  }, [open, budget])

  const hasChanged = !isEdit || !initial || JSON.stringify(form) !== JSON.stringify(initial)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.fin_periode < form.debut_periode) {
      setError('La date de fin doit être postérieure à la date de début')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = {
        categorie_id: Number(form.categorie_id),
        montant_fixe: Number(form.montant_fixe),
        debut_periode: form.debut_periode,
        fin_periode: form.fin_periode,
      }
      if (isEdit) {
        await updateBudget(budget.id, payload)
        toast('Budget modifié avec succès')
      } else {
        await createBudget(payload)
        toast('Budget créé avec succès')
      }
      onSuccess()
      onClose()
    } catch (err) {
      const detail = err.response?.data?.detail || 'Erreur serveur'
      if (err.response?.status === 409) {
        setError(detail)
      } else if (err.response?.status === 404) {
        toast('Ce budget a été supprimé', 'error')
        onClose()
      } else {
        setError(detail)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Modifier le budget' : 'Nouveau budget'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Catégorie</label>
          <select
            required
            value={form.categorie_id}
            onChange={e => setForm(f => ({ ...f, categorie_id: e.target.value }))}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- Choisir --</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icone} {c.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Montant limite</label>
          <input
            type="number"
            required
            min="0.01"
            step="0.01"
            value={form.montant_fixe}
            onChange={e => setForm(f => ({ ...f, montant_fixe: e.target.value }))}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date début</label>
            <input
              type="date"
              required
              value={form.debut_periode}
              onChange={e => setForm(f => ({ ...f, debut_periode: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date fin</label>
            <input
              type="date"
              required
              min={form.debut_periode || undefined}
              value={form.fin_periode}
              onChange={e => setForm(f => ({ ...f, fin_periode: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading || !hasChanged}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
          {isEdit ? 'Sauvegarder' : 'Créer'}
        </button>
      </form>
    </Modal>
  )
}
