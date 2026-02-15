import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getTransactions,
  getCategories,
  deleteTransaction,
} from "../api/client";
import { euro } from "../components/BudgetCard";
import Skeleton from "../components/Skeleton";
import TransactionFormModal from "../components/TransactionFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";
import CategoryIcon from "../components/CategoryIcons";

export default function TransactionList() {
  const toast = useToast();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const getDefaultDates = () => {
    const today = new Date();
    const date_fin = today.toISOString().slice(0, 10);
    const date31DaysAgo = new Date(today);
    date31DaysAgo.setDate(today.getDate() - 31);
    const date_debut = date31DaysAgo.toISOString().slice(0, 10);
    return { date_debut, date_fin };
  };

  const [filters, setFilters] = useState(() => {
    const { date_debut, date_fin } = getDefaultDates();
    return {
      date_debut,
      date_fin,
      categorie: "",
      type: "",
    };
  });

  const [keywordFilter, setKeywordFilter] = useState("");

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [flippedButtons, setFlippedButtons] = useState({});

  const debounceRef = useRef(null);

  useEffect(() => {
    getCategories()
      .then((cats) => {
        setCategories(cats);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("[data-action-buttons]")) {
        setFlippedButtons({});
      }
    };

    if (Object.keys(flippedButtons).some((key) => flippedButtons[key])) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [flippedButtons]);

  const fetchData = useCallback((f) => {
    setLoading(true);
    const normalized = {
      ...f,
      categorie: f.categorie?.trim().toLowerCase() || "",
    };
    getTransactions(normalized)
      .then(setTransactions)
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData(filters);
  }, []);

  const handleFilterChange = (field, value) => {
    setFlippedButtons({});
    const next = { ...filters, [field]: value };
    setFilters(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchData(next), 300);
  };

  const handleEdit = (transaction) => {
    setSelectedTransaction(transaction);
    setShowEditModal(true);
  };

  const handleDeleteClick = (transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      await deleteTransaction(transactionToDelete.id);
      toast("Transaction supprimée avec succès");
      fetchData(filters);
    } catch (err) {
      toast("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setTransactionToDelete(null);
    }
  };

  const handleEditSuccess = () => {
    fetchData(filters);
  };

  const filteredTransactions = useMemo(() => {
    if (!keywordFilter.trim()) return transactions;
    const keyword = keywordFilter.toLowerCase();
    return transactions.filter((t) =>
      t.libelle.toLowerCase().includes(keyword),
    );
  }, [transactions, keywordFilter]);

  const currentBalance = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, t) => acc + (t.type === "REVENU" ? t.montant : -t.montant),
      0,
    );
  }, [filteredTransactions]);

  return (
    <div className="w-full max-w-350 mx-auto min-h-screen p-4 md:p-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12 relative z-10">
        <div>
          <div>
            <h1 className="font-display font-extrabold uppercase text-5xl md:text-6xl tracking-tighter text-indigo leading-none text-shadow-sm mb-1">
              MES TRANSACTIONS
            </h1>
            <span className="font-display font-bold text-sm uppercase text-indigo/40 tracking-[0.3em]">
              Flux
            </span>
            <div className="inline-flex items-center gap-2 bg-[#FFDA55] px-3 py-1 rounded-lg border-2 border-indigo shadow-[2px_2px_0px_var(--color-indigo)] -rotate-2 translate-x-100 translate-y-3">
              <span className="font-display font-bold text-xs uppercase text-indigo">
                Solde Affiché
              </span>
              <span
                className={`font-data font-bold text-lg ${currentBalance >= 0 ? "text-acid-green" : "text-coral"}`}
              >
                {currentBalance > 0 ? "+" : ""}
                {euro(currentBalance)}
              </span>
            </div>
          </div>
        </div>

        <Link
          to="/transactions/new"
          className="group relative bg-indigo text-white font-display font-extrabold uppercase text-lg px-8 py-4 rounded-xl border-4 border-indigo-light shadow-hard hover:-translate-y-1 hover:shadow-[8px_8px_0px_var(--color-indigo-light)] active:translate-y-1 active:shadow-none transition-all no-underline overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2">
            <span className="group-hover:rotate-180 transition-transform duration-500 inline-block">
              ✦
            </span>
            Saisir
          </span>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        </Link>
      </div>

      <div className="sticky top-4 z-40 mb-12">
        <div className="bg-white/80 backdrop-blur-lg border-2 border-indigo-light rounded-2xl p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] flex flex-col md:flex-row gap-4 items-center transition-all duration-300 hover:shadow-[4px_4px_0px_var(--color-indigo-light)]">
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative group flex-1">
              <input
                type="date"
                value={filters.date_debut}
                onChange={(e) =>
                  handleFilterChange("date_debut", e.target.value)
                }
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
                value={filters.date_fin}
                onChange={(e) => handleFilterChange("date_fin", e.target.value)}
                className="w-full bg-indigo/5 border-2 border-transparent focus:border-indigo-light rounded-lg px-3 py-2 font-data text-sm text-indigo font-bold outline-none transition-all"
              />
              <span className="absolute -top-2 left-2 text-[10px] uppercase font-bold text-indigo/50 bg-white px-1 leading-none">
                Fin
              </span>
            </div>
          </div>

          <div className="hidden md:block w-px h-8 bg-indigo-light/20"></div>

          <div className="relative w-full">
            <input
              type="text"
              value={keywordFilter}
              onChange={(e) => {
                setFlippedButtons({});
                setKeywordFilter(e.target.value);
              }}
              className="w-full bg-indigo/5 border-2 border-transparent focus:border-indigo-light rounded-lg pl-4 pr-4 py-2 font-display font-bold text-indigo placeholder-indigo/40 outline-none transition-all"
              placeholder="Rechercher..."
            />
          </div>

          <div className="hidden md:block w-px h-8 bg-indigo-light/20"></div>

          <div className="relative w-full">
            <select
              value={filters.categorie}
              onChange={(e) => handleFilterChange("categorie", e.target.value)}
              className="w-full bg-indigo/5 border-2 border-transparent focus:border-indigo-light rounded-lg pl-4 pr-10 py-2 font-display font-bold text-indigo appearance-none outline-none transition-all"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.nom}>
                  {c.nom}
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-50 pointer-events-none">
              ▼
            </span>
          </div>

          <div className="hidden md:block w-px h-8 bg-indigo-light/20"></div>

          <button
            onClick={() => {
              const cycle = { "": "DEPENSE", DEPENSE: "REVENU", REVENU: "" };
              handleFilterChange("type", cycle[filters.type]);
            }}
            className={`px-4 py-2 rounded-lg font-display font-bold text-xs uppercase transition-all border-2 ${
              filters.type === ""
                ? "bg-indigo text-white border-indigo shadow-[2px_2px_0px_var(--color-indigo-light)] hover:-translate-y-0.5"
                : filters.type === "DEPENSE"
                  ? "bg-coral text-white border-coral shadow-[2px_2px_0px_var(--color-indigo-light)] hover:-translate-y-0.5"
                  : "bg-acid-green text-white border-acid-green shadow-[2px_2px_0px_var(--color-indigo-light)] hover:-translate-y-0.5"
            }`}
          >
            {filters.type === ""
              ? "Tous"
              : filters.type === "DEPENSE"
                ? "Sorties"
                : "Entrées"}
          </button>

          {(filters.date_debut ||
            filters.date_fin ||
            filters.categorie ||
            keywordFilter) && (
            <button
              onClick={() => {
                setFlippedButtons({});
                const { date_debut, date_fin } = getDefaultDates();
                const defaultFilters = {
                  date_debut,
                  date_fin,
                  categorie: "",
                  type: "",
                };
                setFilters(defaultFilters);
                setKeywordFilter("");
                fetchData(defaultFilters);
              }}
              className="text-xs font-bold text-coral hover:underline whitespace-nowrap"
            >
              Effacer ✕
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-6.75 md:left-8.75 top-0 bottom-0 w-0.5 bg-indigo-light/20 rounded-full hidden md:block"></div>

        {loading ? (
          <div className="space-y-8 pl-0 md:pl-24">
            <Skeleton count={3} />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-20 ml-0 md:ml-12 bg-white/40 border-2 border-dashed border-indigo-light/50 rounded-3xl backdrop-blur-sm">
            <div className="text-6xl mb-4 opacity-50">∅</div>
            <p className="font-display font-bold text-xl text-indigo uppercase mb-2">
              Zone vide
            </p>
            <p className="text-indigo/60 text-sm">
              Aucune opération ne correspond à vos critères.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredTransactions.map((t, index) => {
              const isIncome = t.type === "REVENU";
              const dateObj = new Date(t.date);

              const theme = isIncome
                ? {
                    main: "text-acid-green",
                    bgIcon: "bg-acid-green",
                    shadow:
                      "hover:shadow-[6px_6px_0px_var(--color-acid-green)]",
                    glow: "group-hover:shadow-[0_0_30px_rgba(132,204,22,0.25)]",
                  }
                : {
                    main: "text-coral",
                    bgIcon: "bg-coral",
                    shadow: "hover:shadow-[6px_6px_0px_var(--color-coral)]",
                    glow: "group-hover:shadow-[0_0_30px_rgba(251,113,133,0.25)]",
                  };

              return (
                <div
                  key={t.id}
                  className="relative md:pl-24 group perspective-1000"
                >
                  <div
                    className={`
                    absolute left-5 md:left-7 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white z-10 transition-all duration-300 hidden md:block
                    ${isIncome ? "bg-acid-green group-hover:scale-125" : "bg-coral group-hover:scale-125"}
                    shadow-[0_0_0_2px_rgba(255,255,255,0.8)]
                  `}
                  ></div>

                  <div className="absolute left-8.75 top-1/2 w-15 h-0.5 bg-indigo-light/20 hidden md:block group-hover:bg-indigo-light/50 transition-colors"></div>

                  <div
                    className={`
                    relative flex flex-col md:flex-row items-center gap-4 p-5 rounded-2xl bg-white 
                    border-2 border-indigo-lighter/80
                    transition-all duration-200 cursor-default
                    hover:-translate-y-1 hover:border-indigo hover:z-20 shadow-[3px_3px_0px_var(--color-indigo-lighter)]
                    ${theme.shadow} ${theme.glow}
                  `}
                  >
                    <div
                      className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-md ${theme.bgIcon}`}
                    ></div>

                    <div className="flex flex-row md:flex-col items-center justify-center gap-1 md:gap-0 min-w-17.5 pl-4">
                      <span className="font-display font-black text-2xl text-indigo leading-none">
                        {String(dateObj.getDate()).padStart(2, "0")}
                      </span>
                      <span className="font-data font-bold text-xs uppercase text-indigo/50">
                        {dateObj
                          .toLocaleString("fr-FR", { month: "short" })
                          .replace(".", "")}
                      </span>
                    </div>

                    <div className="grow flex items-center gap-4 w-full border-t md:border-t-0 md:border-l border-indigo-light pt-4 md:pt-0 md:pl-6 mt-2 md:mt-0">
                      <div
                        className={`
                        w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6 group-hover:scale-110
                        ${isIncome ? "bg-acid-green" : "bg-coral"}
                      `}
                      >
                        <CategoryIcon
                          category={t.categorie}
                          className="w-6 h-6 text-white"
                        />
                      </div>

                      <div className="grow min-w-0">
                        <h3 className="font-display font-extrabold uppercase text-lg text-indigo truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-linear-to-r group-hover:from-indigo group-hover:to-indigo-light transition-all">
                          {t.libelle}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="font-data font-bold text-[10px] text-indigo/60 uppercase tracking-wider bg-indigo-lighter/20 px-2 py-0.5 rounded border border-indigo-light/10">
                            {t.categorie}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`text-right pl-4 border-l-0 md:border-l-2 border-dashed border-indigo-light/90 ml-auto md:ml-0 min-w-35`}
                    >
                      <div
                        className={`font-data font-bold text-3xl ${theme.main} text-shadow-sm`}
                      >
                        {isIncome ? "+" : "-"}
                        {euro(t.montant).replace("€", "")}
                      </div>
                      <div className="font-display font-bold text-[10px] text-indigo-light uppercase tracking-widest text-right">
                        EUR
                      </div>
                    </div>

                    <div
                      className="ml-4 relative w-22 h-10"
                      data-action-buttons
                    >
                      <div
                        className="absolute right-0 w-10 h-10 transition-all duration-500 z-20"
                        style={{
                          perspective: "1000px",
                          transform: flippedButtons[t.id]
                            ? "translateX(-48px)"
                            : "translateX(0)",
                        }}
                      >
                        <div
                          className="relative w-10 h-10"
                          style={{
                            transformStyle: "preserve-3d",
                            transform: flippedButtons[t.id]
                              ? "rotateY(180deg)"
                              : "rotateY(0deg)",
                            transition: "transform 0.5s",
                          }}
                        >
                          <button
                            onClick={() => setFlippedButtons({ [t.id]: true })}
                            className="absolute inset-0 w-10 h-10 bg-indigo text-white rounded-lg border-2 border-indigo-light shadow-[2px_2px_0px_var(--color-indigo)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center justify-center"
                            style={{ backfaceVisibility: "hidden" }}
                            title="Actions"
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
                                d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
                              />
                            </svg>
                          </button>

                          <button
                            onClick={() => {
                              handleEdit(t);
                              setFlippedButtons({});
                            }}
                            className="absolute inset-0 w-10 h-10 bg-indigo-light text-white rounded-lg border-2 border-indigo shadow-[2px_2px_0px_var(--color-indigo)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center justify-center"
                            style={{
                              backfaceVisibility: "hidden",
                              transform: "rotateY(180deg)",
                            }}
                            title="Modifier"
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
                      </div>

                      <button
                        onClick={() => {
                          handleDeleteClick(t);
                          setFlippedButtons({});
                        }}
                        className="absolute right-0 w-10 h-10 bg-coral text-white rounded-lg border-2 border-indigo shadow-[2px_2px_0px_var(--color-indigo)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center justify-center z-20"
                        style={{
                          opacity: flippedButtons[t.id] ? 1 : 0,
                          pointerEvents: flippedButtons[t.id] ? "auto" : "none",
                          transition: "opacity 0.15s ease 0.1s",
                        }}
                        title="Supprimer"
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
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TransactionFormModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        transaction={selectedTransaction}
        onSuccess={handleEditSuccess}
        className="top-1/2 -translate-y-1/2"
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer la transaction"
        message={`Voulez-vous vraiment supprimer "${transactionToDelete?.libelle}" (${euro(transactionToDelete?.montant || 0)}) ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        loading={isDeleting}
        closeOnConfirm={false}
        type="danger"
      />
    </div>
  );
}
