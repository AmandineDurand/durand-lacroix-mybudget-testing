import { useState, useEffect } from "react";
import { getCategories, updateTransaction } from "../api/client";
import { useToast } from "./Toast";
import Modal from "./Modal";

export default function TransactionFormModal({
  open,
  onClose,
  transaction,
  onSuccess,
}) {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    montant: "",
    libelle: "",
    type: "DEPENSE",
    categorie: "",
    date: "",
  });

  useEffect(() => {
    if (open) {
      getCategories()
        .then(setCategories)
        .catch(() => {});

      if (transaction) {
        setForm({
          montant: transaction.montant || "",
          libelle: transaction.libelle || "",
          type: transaction.type || "DEPENSE",
          categorie: transaction.categorie || "",
          date: transaction.date || "",
        });
      }
      setErrors({});
    }
  }, [open, transaction]);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.montant || Number(form.montant) <= 0)
      errs.montant = "Montant requis et positif";
    if (!form.libelle.trim()) errs.libelle = "Libellé requis";
    if (!form.categorie) errs.categorie = "Catégorie requise";
    if (!form.date) errs.date = "Date requise";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      await updateTransaction(transaction.id, {
        montant: Number(form.montant),
        libelle: form.libelle.trim(),
        type: form.type,
        categorie: form.categorie,
        date: form.date,
      });
      toast("Transaction modifiée avec succès");
      onSuccess();
      onClose();
    } catch (err) {
      const detail =
        err.response?.data?.detail || "Erreur lors de la modification";
      setErrors({ _global: detail });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Modifier la transaction">
      <form onSubmit={handleSubmit} className="space-y-5">
        {errors._global && (
          <div className="bg-coral/10 border-2 border-coral/50 rounded-lg p-3">
            <p className="text-coral font-data text-sm">⚠ {errors._global}</p>
          </div>
        )}

        <div>
          <label className="block font-display font-bold text-xs uppercase text-indigo/40 mb-2 tracking-wide">
            Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleChange("type", "DEPENSE")}
              className={`py-2.5 rounded-lg font-display font-bold uppercase border-2 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-lighter ${
                form.type === "DEPENSE"
                  ? "bg-coral text-white border-coral shadow-[2px_2px_0px_var(--color-indigo-light)]"
                  : "bg-coral/5 text-coral border-coral/30"
              }`}
            >
              Dépense
            </button>
            <button
              type="button"
              onClick={() => handleChange("type", "REVENU")}
              className={`py-2.5 rounded-lg font-display font-bold uppercase border-2 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-lighter ${
                form.type === "REVENU"
                  ? "bg-acid-green text-white border-acid-green shadow-[2px_2px_0px_var(--color-indigo-light)]"
                  : "bg-acid-green/5 text-acid-green border-acid-green/30"
              }`}
            >
              Revenu
            </button>
          </div>
        </div>

        <div>
          <label className="block font-display font-bold text-xs uppercase text-indigo/40 mb-2 tracking-wide">
            Montant
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.montant}
            onChange={(e) => handleChange("montant", e.target.value)}
            className="w-full bg-indigo/5 border-2 border-transparent focus:border-indigo-light focus:bg-white rounded-lg px-4 py-2.5 font-data font-bold text-indigo-light/60 focus:text-indigo-light placeholder-indigo-light/40 outline-none transition-all"
            placeholder="0.00"
          />
          {errors.montant && (
            <p className="text-coral font-data text-xs mt-1">
              {errors.montant}
            </p>
          )}
        </div>

        <div>
          <label className="block font-display font-bold text-xs uppercase text-indigo/40 mb-2 tracking-wide">
            Libellé
          </label>
          <input
            type="text"
            value={form.libelle}
            onChange={(e) => handleChange("libelle", e.target.value)}
            className="w-full bg-indigo/5 border-2 border-transparent focus:border-indigo-light focus:bg-white rounded-lg px-4 py-2.5 font-data font-bold text-indigo-light/60 focus:text-indigo-light placeholder-indigo-light/40 outline-none transition-all"
            placeholder="Ex: Courses, Salaire..."
          />
          {errors.libelle && (
            <p className="text-coral font-data text-xs mt-1">
              {errors.libelle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-display font-bold text-xs uppercase text-indigo/40 mb-2 tracking-wide">
              Catégorie
            </label>
            <select
              value={form.categorie}
              onChange={(e) => handleChange("categorie", e.target.value)}
              className="w-full bg-indigo/5 border-2 border-transparent focus:border-indigo-light focus:bg-white rounded-lg px-4 py-2.5 font-data font-bold text-indigo-light/60 focus:text-indigo-light outline-none transition-all"
            >
              <option value="">Choisir une catégorie</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.nom}>
                  {cat.nom}
                </option>
              ))}
            </select>
            {errors.categorie && (
              <p className="text-coral font-data text-xs mt-1">
                {errors.categorie}
              </p>
            )}
          </div>
          <div>
            <label className="block font-display font-bold text-xs uppercase text-indigo/40 mb-2 tracking-wide">
              Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => handleChange("date", e.target.value)}
              className="w-full bg-indigo/5 border-2 border-transparent focus:border-indigo-light focus:bg-white rounded-lg px-4 py-2.5 font-data text-sm font-bold text-indigo-light/60 focus:text-indigo-light outline-none transition-all"
            />
            {errors.date && (
              <p className="text-coral font-data text-xs mt-1">{errors.date}</p>
            )}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full bg-indigo text-white border-2 border-indigo-light rounded-xl py-2.5 px-4 font-display font-bold uppercase text-sm shadow-[2px_2px_0px_var(--color-indigo-light)] hover:shadow-[4px_4px_0px_var(--color-indigo-light)] active:shadow-[1px_1px_0px_var(--color-indigo-light)] transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-lighter overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <span className="group-hover:rotate-180 transition-transform duration-500 inline-block">
                  ✦
                </span>
              )}
              {loading ? "Enregistrement..." : "Enregistrer"}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
