import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCategories, createTransaction } from '../api/client'
import { useToast } from '../components/Toast'

export default function AddTransaction() {
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const today = new Date().toISOString().slice(0, 10)

  const emptyForm = { montant: '', libelle: '', type: 'DEPENSE', categorie: '', date: today }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
  }, [])

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.montant || Number(form.montant) <= 0) errs.montant = 'Le montant doit être positif'
    if (!form.libelle.trim()) errs.libelle = 'Le libellé est requis'
    if (!form.categorie) errs.categorie = 'La catégorie est requise'
    if (!form.date) errs.date = 'La date est requise'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setErrors({})
    try {
      await createTransaction({
        montant: Number(form.montant),
        libelle: form.libelle,
        type: form.type,
        categorie: form.categorie,
        date: new Date(form.date).toISOString(),
      })
      toast('Transaction ajoutée avec succès')
      setForm(emptyForm)
    } catch (err) {
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') {
        if (detail.toLowerCase().includes('montant')) setErrors({ montant: detail })
        else setErrors({ _global: detail })
      } else {
        setErrors({ _global: 'Erreur serveur' })
      }
    } finally {
      setLoading(false)
    }
  }

  const fieldClass = (name) =>
    `w-full border rounded px-3 py-2 ${errors[name] ? 'border-red-500' : ''}`

  return (
    <div className="p-4 max-w-md mx-auto">
      <Link to="/" className="text-blue-600 text-sm mb-4 inline-block">&larr; Accueil</Link>
      <h1 className="text-2xl font-bold mb-6">Ajouter une transaction</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Montant</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.montant}
            onChange={e => set('montant', e.target.value)}
            className={fieldClass('montant')}
          />
          {errors.montant && <p className="text-red-600 text-xs mt-1">{errors.montant}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Libellé</label>
          <input
            type="text"
            value={form.libelle}
            onChange={e => set('libelle', e.target.value)}
            className={fieldClass('libelle')}
          />
          {errors.libelle && <p className="text-red-600 text-xs mt-1">{errors.libelle}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <div className="flex gap-4">
            {['DEPENSE', 'REVENU'].map(t => (
              <label key={t} className="flex items-center gap-1">
                <input type="radio" name="type" value={t} checked={form.type === t} onChange={() => set('type', t)} />
                {t === 'DEPENSE' ? 'Dépense' : 'Revenu'}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Catégorie</label>
          <select
            value={form.categorie}
            onChange={e => set('categorie', e.target.value)}
            className={fieldClass('categorie')}
          >
            <option value="">-- Choisir --</option>
            {categories.map(c => (
              <option key={c.id} value={c.nom}>{c.icone} {c.nom}</option>
            ))}
          </select>
          {errors.categorie && <p className="text-red-600 text-xs mt-1">{errors.categorie}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            className={fieldClass('date')}
          />
          {errors.date && <p className="text-red-600 text-xs mt-1">{errors.date}</p>}
        </div>

        {errors._global && <p className="text-red-600 text-sm">{errors._global}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
          Ajouter
        </button>
      </form>
    </div>
  )
}
