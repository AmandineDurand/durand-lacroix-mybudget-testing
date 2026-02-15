import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getBudgets, getCategories } from "../api/client";
import { euro, progressBg } from "../components/BudgetCard";
import BudgetFormModal from "../components/BudgetFormModal";
import Skeleton from "../components/Skeleton";
import CategoryIcon from "../components/CategoryIcons";

export default function BudgetList() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editBudget, setEditBudget] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const fetchData = () => {
    setLoading(true);
    Promise.all([getBudgets(), getCategories()])
      .then(([bList, cList]) => {
        const catMap = {};
        cList.forEach((c) => (catMap[c.id] = c));
        setCategories(catMap);
        const sorted = bList.sort((a, b) => {
          if (a.est_depasse !== b.est_depasse) return a.est_depasse ? -1 : 1;
          return b.pourcentage_consomme - a.pourcentage_consomme;
        });
        setBudgets(sorted);
      })
      .catch(() => setBudgets([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalAvailable = useMemo(() => {
    return budgets.reduce((acc, b) => {
      const today = new Date().toISOString().slice(0, 10);
      const isActive = b.debut_periode <= today && b.fin_periode >= today;
      if (isActive && !b.est_depasse) return acc + b.montant_restant;
      return acc;
    }, 0);
  }, [budgets]);

  const filteredBudgets = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return budgets.filter((b) => {
      const catName = categories[b.categorie_id]?.nom?.toLowerCase() || "";
      const matchesSearch = catName.includes(searchTerm.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === "ACTIVE") {
        matchesStatus = b.debut_periode <= today && b.fin_periode >= today;
      } else if (statusFilter === "OVER") {
        matchesStatus = b.est_depasse;
      }
      let matchesDate = true;
      if (dateDebut && dateFin) {
        matchesDate = b.debut_periode <= dateFin && b.fin_periode >= dateDebut;
      } else if (dateDebut) {
        matchesDate = b.fin_periode >= dateDebut;
      } else if (dateFin) {
        matchesDate = b.debut_periode <= dateFin;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [budgets, categories, searchTerm, statusFilter, dateDebut, dateFin]);

  const openCreate = () => {
    setEditBudget(null);
    setModalOpen(true);
  };

  const handleCardClick = (id) => {
    navigate(`/budgets/${id}`);
  };

  const handleEditClick = (e, b) => {
    e.stopPropagation();
    setEditBudget(b);
    setModalOpen(true);
  };

  return (
    <div className="w-full max-w-350 mx-auto min-h-screen p-4 md:p-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div>
          <div>
            <h1 className="font-display font-extrabold uppercase text-5xl md:text-6xl tracking-tighter text-indigo leading-none text-shadow-sm">
              MES BUDGETS
            </h1>
            <div className="mt-2 inline-flex items-center gap-2 bg-[#FFDA55] px-3 py-1 rounded-lg border-2 border-indigo shadow-[2px_2px_0px_var(--color-indigo)] rotate-1">
              <span className="font-display font-bold text-xs uppercase text-indigo">
                Dispo. Total
              </span>
              <span className="font-data font-bold text-lg text-indigo">
                {euro(totalAvailable)}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={openCreate}
          className="group relative bg-indigo text-white font-display font-extrabold uppercase text-lg px-8 py-4 rounded-xl border-4 border-indigo-light shadow-hard hover:-translate-y-1 hover:shadow-[8px_8px_0px_var(--color-indigo-light)] active:translate-y-1 active:shadow-none transition-all overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2">
            <span className="group-hover:rotate-180 transition-transform duration-500 inline-block">
              ✦
            </span>
            Nouveau Budget
          </span>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        </button>
      </div>

      <div className="mb-10 p-4 bg-white/80 backdrop-blur-lg border-2 border-indigo-light rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] flex flex-col md:flex-row gap-4 items-center transition-all duration-300 hover:shadow-[4px_4px_0px_var(--color-indigo-light)]">
        <div className="relative w-full md:w-auto md:min-w-37.5">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-37.5 bg-indigo/5 border-2 border-transparent focus:border-indigo-light focus:bg-white rounded-lg px-4 py-2 font-display font-bold text-indigo placeholder-indigo/40 outline-none transition-all"
          />
        </div>

        <div className="hidden md:block w-px h-8 bg-indigo-light/20"></div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative group flex-1">
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-full bg-indigo/5 border-2 border-transparent focus:border-indigo-light rounded-lg px-3 py-2 font-data text-sm text-indigo font-bold outline-none transition-all"
            />
            <span className="absolute -top-2 left-2 text-[10px] uppercase font-bold text-indigo/50 bg-white px-1 leading-none">
              Début
            </span>
          </div>
          <div className="h-full py-2 text-indigo-light/50">➜</div>
          <div className="relative group flex-1">
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="w-full bg-indigo/5 border-2 border-transparent focus:border-indigo-light rounded-lg px-3 py-2 font-data text-sm text-indigo font-bold outline-none transition-all"
            />
            <span className="absolute -top-2 left-2 text-[10px] uppercase font-bold text-indigo/50 bg-white px-1 leading-none">
              Fin
            </span>
          </div>
        </div>

        <div className="hidden md:block w-px h-8 bg-indigo-light/20"></div>

        <div className="flex gap-2 w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: "TOUS" },
            { id: "ACTIVE", label: "EN COURS" },
            { id: "OVER", label: "DÉPASSÉS" },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setStatusFilter(opt.id)}
              className={`
                  px-5 py-2 rounded-lg font-display font-bold uppercase text-sm border-2 whitespace-nowrap transition-all duration-200
                  ${
                    statusFilter === opt.id
                      ? "bg-indigo text-white border-indigo shadow-[2px_2px_0px_var(--color-indigo-light)] hover:-translate-y-0.5"
                      : "bg-white text-indigo border-indigo-light/60 hover:border-indigo-light hover:bg-indigo/5"
                  }
                `}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {(searchTerm || dateDebut || dateFin) && (
          <button
            onClick={() => {
              setSearchTerm("");
              setDateDebut("");
              setDateFin("");
            }}
            className="text-xs font-bold text-coral hover:underline whitespace-nowrap"
          >
            Effacer ✕
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Skeleton count={1} />
          <Skeleton count={1} />
          <Skeleton count={1} />
        </div>
      ) : filteredBudgets.length === 0 ? (
        <div className="text-center py-20 bg-white/40 border-2 border-dashed border-indigo-light/50 rounded-3xl backdrop-blur-sm">
          <p className="font-display font-bold text-2xl text-indigo/30 uppercase mb-4">
            Aucun budget trouvé
          </p>
          {budgets.length > 0 && (
            <button
              onClick={() => setStatusFilter("ALL")}
              className="underline font-bold text-indigo hover:text-indigo-light"
            >
              Afficher tous les budgets
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
          {filteredBudgets.map((b) => {
            const cat = categories[b.categorie_id];
            const pct = Math.min(b.pourcentage_consomme, 100);
            const isOver = b.est_depasse;

            let theme = {
              barFill: "fill-acid",
              barBg: "bg-gray-100",
              textRest: "text-acid-green",
              border: "border-indigo-light",
              borderHover: "border-indigo",
              shadow: "shadow-[3px_3px_0px_var(--color-indigo-lighter)]",
              shadowHover: "hover:shadow-[6px_6px_0px_var(--color-acid-green)]",
              bg: "bg-white",
            };

            if (isOver) {
              theme.barFill = "fill-coral";
              theme.textRest = "text-coral";
              theme.border = "border-indigo";
              theme.borderHover = "border-coral";
              theme.shadowHover =
                "hover:shadow-[6px_6px_0px_var(--color-coral)]";
              theme.bg = "bg-[#FFF0F0]";
            } else if (pct >= 85) {
              theme.barFill = "fill-indigo";
              theme.textRest = "text-indigo";
              theme.shadowHover =
                "hover:shadow-[6px_6px_0px_var(--color-indigo)]";
            }

            return (
              <div
                key={b.id}
                onClick={() => handleCardClick(b.id)}
                className={`
                  group cursor-pointer relative
                  ${theme.bg} rounded-2xl p-5
                  border-2 ${theme.border} hover:${theme.borderHover}
                  ${theme.shadow}
                  transition-all duration-200
                  hover:-translate-y-1 ${theme.shadowHover}
                `}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white border-2 border-indigo-light rounded-xl flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,0.05)] group-hover:border-indigo transition-colors">
                      <CategoryIcon
                        category={cat?.nom || "Autres"}
                        className="w-7 h-7 text-indigo"
                      />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-display font-extrabold uppercase text-xl text-indigo leading-tight truncate max-w-35">
                        {cat?.nom || "Budget"}
                      </h3>
                      <span className="font-data text-[10px] font-bold text-indigo/40 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-md self-start mt-1">
                        #{b.id}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleEditClick(e, b)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-indigo/20 hover:border-indigo hover:bg-indigo/10 text-indigo shadow-[1px_1px_0px_var(--color-indigo)] hover:shadow-[2px_2px_0px_var(--color-indigo)] active:shadow-none active:translate-y-0.5 transition-all"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                      />
                    </svg>
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-xs font-bold mb-1 font-display uppercase tracking-wider text-indigo/60">
                    <span>Progression</span>
                    <span>{b.pourcentage_consomme.toFixed(0)}%</span>
                  </div>
                  <div className="h-6 w-full rounded-full border-2 border-indigo-light bg-gray-100 overflow-hidden p-0.5 group-hover:border-indigo transition-colors">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: progressBg(pct),
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div
                    className={`bg-gray-50 rounded-xl p-3 border-2 border-transparent group-hover:border-indigo/10 transition-colors`}
                  >
                    <p className="text-[10px] font-display font-bold uppercase text-indigo/40 mb-1">
                      Disponible
                    </p>
                    <p
                      className={`font-data font-bold text-xl ${theme.textRest}`}
                    >
                      {euro(b.montant_restant)}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 border-2 border-transparent group-hover:border-indigo/10 transition-colors">
                    <p className="text-[10px] font-display font-bold uppercase text-indigo/40 mb-1">
                      Plafond
                    </p>
                    <p className="font-data font-bold text-xl text-indigo">
                      {euro(b.montant_fixe)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="inline-block bg-indigo text-white text-[10px] font-bold font-data uppercase tracking-widest px-3 py-1 rounded-full shadow-sm transform group-hover:scale-105 transition-transform">
                    {new Date(b.debut_periode).toLocaleDateString()} ➜{" "}
                    {new Date(b.fin_periode).toLocaleDateString()}
                  </div>
                </div>

                {isOver && (
                  <div className="absolute -top-3 -right-3 bg-coral text-white font-display font-extrabold uppercase text-xs px-3 py-1 border-2 border-indigo shadow-sm rotate-12 z-10">
                    ! DÉPASSÉ !
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <BudgetFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
        budget={editBudget}
      />
    </div>
  );
}
