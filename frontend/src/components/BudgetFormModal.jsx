import { useState, useEffect } from "react";
import Modal from "./Modal";
import { getCategories, createBudget, updateBudget } from "../api/client";
import { useToast } from "./Toast";

export default function BudgetFormModal({ open, onClose, onSuccess, budget }) {
  const toast = useToast();
  const isEdit = !!budget;
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    categorie_id: "",
    montant_fixe: "",
    debut_periode: "",
    fin_periode: "",
  });
  const [initial, setInitial] = useState(null);

  useEffect(() => {
    if (open) {
      getCategories()
        .then(setCategories)
        .catch(() => {});
      if (budget) {
        const vals = {
          categorie_id: String(budget.categorie_id),
          montant_fixe: String(budget.montant_fixe),
          debut_periode: budget.debut_periode,
          fin_periode: budget.fin_periode,
        };
        setForm(vals);
        setInitial(vals);
      } else {
        const vals = {
          categorie_id: "",
          montant_fixe: "",
          debut_periode: "",
          fin_periode: "",
        };
        setForm(vals);
        setInitial(null);
      }
      setError("");
    }
  }, [open, budget]);

  const hasChanged =
    !isEdit || !initial || JSON.stringify(form) !== JSON.stringify(initial);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.fin_periode < form.debut_periode) {
      setError("La date de fin doit être postérieure à la date de début");
      return;
    }
    if (!form.montant_fixe || Number(form.montant_fixe) <= 0) {
      setError("Le montant doit être positif");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        categorie_id: Number(form.categorie_id),
        montant_fixe: Number(form.montant_fixe),
        debut_periode: form.debut_periode,
        fin_periode: form.fin_periode,
      };
      if (isEdit) {
        await updateBudget(budget.id, payload);
        toast("Budget modifié avec succès");
      } else {
        await createBudget(payload);
        toast("Budget créé avec succès");
      }
      onSuccess();
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail || "Erreur serveur";
      if (err.response?.status === 409) {
        setError(detail);
      } else if (err.response?.status === 404) {
        toast("Ce budget a été supprimé", "error");
        onClose();
      } else {
        setError(detail);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Modifier le budget" : "Nouveau budget"}
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block font-display font-bold text-xs uppercase text-indigo/40 mb-2 tracking-wide">
            Catégorie
          </label>
          <select
            required
            value={form.categorie_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, categorie_id: e.target.value }))
            }
            className="w-full bg-indigo/5 border-2 border-transparent focus:border-indigo-light focus:bg-white rounded-lg px-4 py-2.5 font-data font-bold text-indigo-light/60 focus:text-indigo-light outline-none transition-all"
          >
            <option value="">-- Choisir --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-display font-bold text-xs uppercase text-indigo/40 mb-2 tracking-wide">
            Montant limite
          </label>
          <input
            type="number"
            required
            min="0.01"
            step="0.01"
            value={form.montant_fixe}
            onChange={(e) =>
              setForm((f) => ({ ...f, montant_fixe: e.target.value }))
            }
            className="w-full bg-indigo/5 border-2 border-transparent focus:border-indigo-light focus:bg-white rounded-lg px-4 py-2.5 font-data font-bold text-indigo-light/60 focus:text-indigo-light placeholder-indigo-light/40 outline-none transition-all"
            placeholder="0.00"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-display font-bold text-xs uppercase text-indigo/40 mb-2 tracking-wide">
              Date début
            </label>
            <input
              type="date"
              required
              value={form.debut_periode}
              onChange={(e) =>
                setForm((f) => ({ ...f, debut_periode: e.target.value }))
              }
              className="w-full bg-indigo/5 border-2 border-transparent focus:border-indigo-light focus:bg-white rounded-lg px-3 py-2.5 font-data text-sm font-bold text-indigo-light/60 focus:text-indigo-light outline-none transition-all"
            />
          </div>
          <div>
            <label className="block font-display font-bold text-xs uppercase text-indigo/40 mb-2 tracking-wide">
              Date fin
            </label>
            <input
              type="date"
              required
              min={form.debut_periode || undefined}
              value={form.fin_periode}
              onChange={(e) =>
                setForm((f) => ({ ...f, fin_periode: e.target.value }))
              }
              className="w-full bg-indigo/5 border-2 border-transparent focus:border-indigo-light focus:bg-white rounded-lg px-3 py-2.5 font-data text-sm font-bold text-indigo-light/60 focus:text-indigo-light outline-none transition-all"
            />
          </div>
        </div>
        {error && (
          <div className="bg-coral/10 border-2 border-coral/50 rounded-lg p-3">
            <p className="text-coral font-data text-sm">⚠ {error}</p>
          </div>
        )}
        <button
          type="submit"
          disabled={loading || !hasChanged}
          className="group relative w-full bg-indigo text-white border-2 border-indigo-light rounded-xl py-3 px-4 font-display font-bold uppercase text-sm shadow-[2px_2px_0px_var(--color-indigo-light)] hover:shadow-[4px_4px_0px_var(--color-indigo-light)] active:shadow-[1px_1px_0px_var(--color-indigo-light)] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-lighter overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <span className="relative z-10 flex items-center gap-2">
            {loading ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <span className="group-hover:rotate-180 transition-transform duration-500 inline-block">
                ✦
              </span>
            )}
            {isEdit ? "Sauvegarder" : "Créer"}
          </span>
        </button>
      </form>
    </Modal>
  );
}
