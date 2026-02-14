import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBudget, getCategories, getTransactions } from "../api/client";
import { euro, progressBg } from "../components/BudgetCard";
import BudgetFormModal from "../components/BudgetFormModal";
import Skeleton from "../components/Skeleton";
import { useToast } from "../components/Toast";
import CategoryIcon from "../components/CategoryIcons";

export default function BudgetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [budget, setBudget] = useState(null);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);

  const fetchData = () => {
    setLoading(true);
    Promise.all([getBudget(id), getCategories()])
      .then(([b, cats]) => {
        setBudget(b);
        const foundCat = cats.find((c) => c.id === b.categorie_id);
        setCategory(foundCat);

        if (foundCat) {
          return getTransactions({
            categorie: foundCat.nom,
            date_debut: b.debut_periode.split("T")[0],
            date_fin: b.fin_periode.split("T")[0],
          });
        }
        return [];
      })
      .then((trans) => {
        setTransactions(trans || []);
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          toast("Ce budget n'existe pas", "error");
          navigate("/budgets");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="w-full max-w-[1400px] mx-auto min-h-screen p-4 md:p-8 flex flex-col justify-center">
        <Skeleton count={4} />
      </div>
    );
  }

  if (!budget) return null;

  const pct = Math.min(budget.pourcentage_consomme, 100);
  const isOver = budget.est_depasse;

  return (
    <div className="w-full max-w-[1400px] mx-auto min-h-screen p-4 md:p-8 flex flex-col gap-8 relative">
      <div className="flex justify-between items-center z-10">
        <div className="bg-indigo text-white px-4 py-1 rounded-full font-display font-bold uppercase text-xs tracking-[0.2em]">
          Fiche Détail
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="group relative bg-white text-indigo font-display font-extrabold uppercase text-sm px-5 py-2.5 rounded-xl border-2 border-indigo-light shadow-[3px_3px_0px_var(--color-indigo-lighter)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_var(--color-indigo-light)] active:translate-y-0.5 active:shadow-none transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-lighter"
        >
          <span className="relative z-10 flex items-center gap-2">
            <span className="group-hover:rotate-180 transition-transform duration-500 inline-block">
              ✦
            </span>
            Modifier
          </span>
        </button>
      </div>

      <div className="relative w-full max-w-2xl mx-auto rounded-3xl p-6 md:p-12 border-2 border-indigo-light bg-white backdrop-blur-lg shadow-[3px_3px_0px_var(--color-indigo-lighter)] hover:shadow-[6px_6px_0px_var(--color-indigo-light)] transition-all duration-300 flex flex-col items-center">
        <div className="flex flex-col items-center text-center mb-10 w-full relative">
          <div className="w-28 h-28 bg-white border-2 border-indigo-light rounded-4xl flex items-center justify-center shadow-[3px_3px_0px_var(--color-indigo-lighter)] hover:shadow-[6px_6px_0px_var(--color-indigo-light)] mb-6 transform -rotate-3 hover:rotate-0 transition-all duration-200 z-10">
            <CategoryIcon
              category={category?.nom || "Autres"}
              className="w-12 h-12 text-indigo"
            />
          </div>

          <h2 className="font-display font-black text-4xl md:text-6xl uppercase text-indigo leading-none mb-4 text-shadow-sm tracking-tight">
            {category?.nom || `Budget #${budget.id}`}
          </h2>

          <div className="inline-block bg-indigo/5 px-6 py-2 rounded-full border-2 border-indigo/10">
            <p className="font-data font-bold text-xs md:text-sm text-indigo/70 uppercase tracking-widest">
              {new Date(budget.debut_periode).toLocaleDateString()} ➜{" "}
              {new Date(budget.fin_periode).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="w-full max-w-2xl mb-12 relative group">
          <div className="flex justify-between items-end mb-3 px-2">
            <span className="font-display font-bold text-indigo/40 uppercase text-xs tracking-widest">
              Consommation
            </span>
            <span
              className={`font-data font-bold text-4xl ${isOver ? "text-coral" : "text-indigo"}`}
            >
              {budget.pourcentage_consomme.toFixed(0)}%
            </span>
          </div>

          <div className="h-[60px] bg-gray-100 border-2 border-indigo-light rounded-4xl p-1.5 relative overflow-hidden">
            <div
              className="h-full rounded-[1.2rem] transition-all duration-1000 ease-out"
              style={{ width: `${pct}%`, backgroundColor: progressBg(pct) }}
            />
          </div>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-2 border-indigo-light rounded-3xl p-6 flex flex-col items-center justify-center shadow-[3px_3px_0px_var(--color-indigo-lighter)] hover:-translate-y-1 hover:shadow-hard-acid transition-all group">
            <p className="font-display font-bold text-xs uppercase text-indigo/40 mb-2 tracking-widest">
              Disponible
            </p>
            <p
              className={`font-data font-bold text-2xl md:text-3xl ${isOver ? "text-coral" : "text-acid-green"} transition-transform`}
            >
              {euro(budget.montant_restant)}
            </p>
          </div>

          <div className="bg-gray-50 border-2 border-transparent hover:border-indigo-light rounded-3xl p-6 flex flex-col items-center justify-center shadow-[3px_3px_0px_transparent] hover:shadow-[6px_6px_0px_var(--color-indigo-light)] hover:-translate-y-1 transition-all">
            <p className="font-display font-bold text-xs uppercase text-indigo/40 mb-2 tracking-widest">
              Plafond
            </p>
            <p className="font-data font-bold text-2xl md:text-3xl text-indigo">
              {euro(budget.montant_fixe)}
            </p>
          </div>

          <div className="bg-gray-50 border-2 border-transparent hover:border-coral/30 rounded-3xl p-6 flex flex-col items-center justify-center shadow-[3px_3px_0px_transparent] hover:shadow-hard-coral hover:-translate-y-1 transition-all">
            <p className="font-display font-bold text-xs uppercase text-indigo/40 mb-2 tracking-widest">
              Dépensé
            </p>
            <p className="font-data font-bold text-2xl md:text-3xl text-coral">
              {euro(budget.montant_depense)}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-black text-2xl md:text-3xl uppercase text-indigo tracking-tight">
            Transactions
            <span className="ml-3 inline-block bg-indigo text-white text-sm px-3 py-1 rounded-full">
              {transactions.length}
            </span>
          </h3>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-indigo-light/50 rounded-3xl p-12 text-center">
            <p className="font-display text-indigo/40 text-lg">
              Aucune transaction pour cette période
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((transaction) => {
                const isRevenu = transaction.type === "REVENU";
                return (
                  <div
                    key={transaction.id}
                    className={`
                      bg-white border-2 ${
                        isRevenu ? "border-acid-green/50" : "border-coral/30"
                      } rounded-2xl p-4 md:p-6
                      shadow-[3px_3px_0px_rgba(0,0,0,0.03)]
                      hover:-translate-y-1 hover:shadow-[6px_6px_0px_${isRevenu ? "var(--color-acid-green)" : "var(--color-coral)"}]
                      transition-all duration-200
                      flex flex-col md:flex-row md:items-center md:justify-between gap-3
                    `}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`
                          ${isRevenu ? "badge-income" : "badge-expense"}
                          w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0
                        `}
                      >
                        {isRevenu ? "+" : "−"}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-indigo text-base md:text-lg truncate">
                          {transaction.libelle}
                        </p>
                        <p className="font-data text-xs md:text-sm text-indigo/50">
                          {new Date(transaction.date).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end md:justify-start">
                      <p
                        className={`
                          font-data font-black text-2xl md:text-3xl
                          ${isRevenu ? "text-acid-green" : "text-coral"}
                        `}
                      >
                        {isRevenu ? "+" : "−"}
                        {euro(transaction.montant)}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <BudgetFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
        budget={budget}
      />
    </div>
  );
}
