import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories, createTransaction } from "../api/client";
import { useToast } from "../components/Toast";
import CategoryIcon from "../components/CategoryIcons";

export default function AddTransaction() {
  const toast = useToast();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const today = new Date().toISOString().slice(0, 10);

  const emptyForm = {
    montant: "",
    libelle: "",
    type: "DEPENSE",
    categorie: "",
    date: today,
  };
  const [form, setForm] = useState(emptyForm);
  const currentCategory = categories.find((c) => c.nom === form.categorie);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.montant || Number(form.montant) <= 0)
      errs.montant = "Montant requis";
    if (!form.libelle.trim()) errs.libelle = "Libellé requis";
    if (!form.categorie) errs.categorie = "Catégorie requise";
    if (!form.date) errs.date = "Date requise";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      await createTransaction({
        montant: Number(form.montant),
        libelle: form.libelle,
        type: form.type,
        categorie: form.categorie,
        date: new Date(form.date).toISOString(),
      });
      toast("Transaction validée !");
      setForm(emptyForm);
      navigate("/");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setErrors(
        typeof detail === "string"
          ? detail.toLowerCase().includes("montant")
            ? { montant: detail }
            : { _global: detail }
          : { _global: "Erreur serveur" },
      );
    } finally {
      setLoading(false);
    }
  };

  const isIncome = form.type === "REVENU";
  const theme = isIncome
    ? {
        main: "text-acid-green",
        bg: "bg-acid-green",
        bgLight: "bg-acid-green-light",
        border: "border-acid-green",
        borderLight: "border-acid-green/60",
        shadow: "shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)]",
        inputFocus:
          "focus:border-acid-green focus:shadow-[0_0_20px_rgba(132,204,22,0.3)]",
        containerBg: "bg-white/90 backdrop-blur-lg",
        previewGradient: "from-white via-acid-green/5 to-white",
        glow: "shadow-[0_10px_60px_-10px_rgba(132,204,22,0.4)]",
        accentRing: "ring-2 ring-acid-green/30",
      }
    : {
        main: "text-coral",
        bg: "bg-coral",
        bgLight: "bg-coral-light",
        border: "border-coral",
        borderLight: "border-coral/60",
        shadow: "shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)]",
        inputFocus:
          "focus:border-coral focus:shadow-[0_0_20px_rgba(251,113,133,0.3)]",
        containerBg: "bg-white/90 backdrop-blur-lg",
        previewGradient: "from-white via-coral/5 to-white",
        glow: "shadow-[0_10px_60px_-10px_rgba(251,113,133,0.4)]",
        accentRing: "ring-2 ring-coral/30",
      };

  return (
    <div className="w-full max-w-350 mx-auto min-h-screen p-4 md:p-8 relative">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full relative z-10">
        <div className="flex flex-col gap-6">
          <h1 className="font-display font-extrabold uppercase text-2xl md:text-3xl text-indigo tracking-widest text-shadow-sm">
            Nouv. Entrée
          </h1>

          <form
            onSubmit={handleSubmit}
            className={`${theme.containerBg} border-4 ${theme.border} ${theme.accentRing} rounded-3xl p-6 md:p-8 transition-all duration-300 relative overflow-hidden hover:-translate-y-1 hover:shadow-[4px_4px_0px_var(--color-indigo-light)]`}
          >
            <div className="flex gap-4 mb-8">
              {["DEPENSE", "REVENU"].map((t) => {
                const active = form.type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set("type", t)}
                    className={`flex-1 py-4 rounded-xl border-4 font-display font-extrabold text-lg uppercase transition-all duration-200 ${
                      active
                        ? t === "REVENU"
                          ? " text-acid-green border-acid-green shadow-[4px_4px_0px_var(--color-indigo-light)] transform scale-110"
                          : "text-coral border-coral shadow-[4px_4px_0px_var(--color-indigo-light)] transform scale-110"
                        : "bg-white text-gray-400 border-gray-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_var(--color-indigo-light)]"
                    }`}
                  >
                    {t === "DEPENSE" ? "Sortie" : "Entrée"}
                  </button>
                );
              })}
            </div>

            <div className="mb-8 relative">
              <label className="block font-display font-bold text-xs uppercase opacity-50 mb-1">
                Montant
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  autoFocus
                  value={form.montant}
                  onChange={(e) => set("montant", e.target.value)}
                  className={`w-full bg-white/80 border-b-4 border-gray-300 focus:border-indigo-200 text-right font-data font-bold text-6xl p-2 outline-none transition-colors placeholder:text-indigo-light placeholder:font-light text-shadow-sm text-indigo-light focus:opacity-100 opacity-60`}
                />
                <span className="absolute top-1/2 -translate-y-1/2 left-2 font-display font-extrabold text-4xl text-indigo-light opacity-50">
                  €
                </span>
              </div>
              {errors.montant && (
                <p className="text-coral font-bold text-xs mt-1 text-right animate-pulse">
                  {errors.montant}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-display font-bold text-xs uppercase opacity-50 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Ex: Courses, Salaire..."
                  value={form.libelle}
                  onChange={(e) => set("libelle", e.target.value)}
                  className={`w-full border-4 border-gray-200 rounded-lg px-4 py-3 font-bold font-display focus:outline-none transition-all ${theme.inputFocus} bg-white/90 placeholder:text-indigo-light placeholder:font-light placeholder:opacity-60 focus:opacity-100 opacity-60 text-indigo-light `}
                />
                {errors.libelle && (
                  <p className="text-coral font-bold text-xs mt-1">
                    {errors.libelle}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-display font-bold text-xs uppercase opacity-50 mb-1">
                    Catégorie
                  </label>
                  <div className="relative">
                    <select
                      value={form.categorie}
                      onChange={(e) => set("categorie", e.target.value)}
                      className={`w-full border-4 border-gray-200 rounded-lg px-4 py-3 font-bold font-display appearance-none focus:outline-none transition-all ${theme.inputFocus} bg-white/90 text-indigo-light opacity-60 focus:opacity-100`}
                    >
                      <option value="">Choisir...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.nom}>
                          {c.nom}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                      ▼
                    </div>
                  </div>
                  {errors.categorie && (
                    <p className="text-coral font-bold text-xs mt-1">
                      {errors.categorie}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-display font-bold text-xs uppercase opacity-50 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => set("date", e.target.value)}
                    className={`w-full border-4 border-gray-200 rounded-lg px-4 py-3 font-bold font-data focus:outline-none transition-all ${theme.inputFocus} bg-white/90 text-indigo-light opacity-60 focus:opacity-100`}
                  />
                  {errors.date && (
                    <p className="text-coral font-bold text-xs mt-1">
                      {errors.date}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`group w-full mt-8 py-4 rounded-xl font-display font-extrabold text-xl uppercase text-white shadow-[0_4px_0px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:shadow-[4px_4px_0px_var(--color-indigo-light)] active:translate-y-0 active:shadow-[0_2px_0px_rgba(0,0,0,0.2)] transition-all duration-300 flex justify-center items-center gap-2 ${theme.bg} border-2 ${theme.borderLight} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
            >
              <span>{loading ? "⏳" : "✓"}</span>
              <span>{loading ? "Traitement..." : "VALIDER"}</span>
            </button>
          </form>
        </div>

        <div className="hidden lg:flex flex-col justify-center items-center">
          <div
            className={`
             relative w-full max-w-sm border-4 ${theme.border} ${theme.accentRing} rounded-2xl p-6 
             transform rotate-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_var(--color-indigo-light)] transition-all duration-300
             bg-linear-to-br ${theme.previewGradient}
          `}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-bg-concrete rounded-full border-4 border-indigo z-10"></div>

            <div className="flex justify-between items-start mb-8 mt-2 relative z-10">
              <div
                className={`w-16 h-16 ${theme.bgLight} border-4 ${theme.border} rounded-xl flex items-center justify-center shadow-sm bg-white`}
              >
                <CategoryIcon
                  category={currentCategory?.nom || "Autres"}
                  className="w-8 h-8 text-indigo"
                />
              </div>
              <div className="text-right">
                <div className="font-display font-bold text-xs uppercase opacity-50 tracking-wider">
                  Date Valeur
                </div>
                <div className="font-data font-bold text-sm text-indigo-light">
                  {form.date
                    ? new Date(form.date).toLocaleDateString("fr-FR")
                    : "--/--/----"}
                </div>
              </div>
            </div>

            <div className="mb-8 relative z-10">
              <div className="font-display font-bold text-xs uppercase opacity-50 mb-1 tracking-wider">
                Libellé Transaction
              </div>
              <div className="font-display font-extrabold text-3xl uppercase truncate text-indigo-light leading-tight text-shadow-sm">
                {form.libelle || "En attente..."}
              </div>
              <div className="inline-block mt-2 px-3 py-1 rounded-lg bg-white/50 border-2 border-indigo/10 font-data font-bold text-xs text-indigo/70 uppercase">
                {form.categorie || "Non classé"}
              </div>
            </div>

            <div className="border-t-4 border-dashed border-indigo/20 pt-4 flex justify-between items-end relative z-10">
              <span className="font-display font-bold text-xs uppercase opacity-50 pb-2">
                Net à payer
              </span>
              <span
                className={`font-data font-bold text-5xl ${theme.main} text-shadow-sm`}
              >
                {isIncome ? "+" : "-"}
                {form.montant
                  ? Number(form.montant).toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                    })
                  : "0,00"}{" "}
                €
              </span>
            </div>

            <div className="absolute top-0 right-0 w-full h-full rounded-xl pointer-events-none bg-linear-to-tr from-white/0 via-white/20 to-white/60 opacity-70 z-0" />
          </div>

          <div
            className={`mt-10 mx-auto w-2/3 h-4 rounded-[100%] blur-md transition-all duration-300 ${isIncome ? "bg-acid-green/30" : "bg-coral/30"}`}
          ></div>
        </div>
      </div>
    </div>
  );
}
