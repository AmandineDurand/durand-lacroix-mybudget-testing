import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getBudgets, getTransactions, getCategories } from "../api/client";
import { euro, progressBg } from "../components/BudgetCard";
import CategoryIcon from "../components/CategoryIcons";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Home() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState({});
  const [pastTransactions, setPastTransactions] = useState([]);
  const [futureTransactions, setFutureTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = todayStr();
    Promise.all([getBudgets(), getTransactions(), getCategories()])
      .then(([b, t, cats]) => {
        const catMap = {};
        for (const c of cats) catMap[c.id] = c;
        setCategories(catMap);

        setBudgets(
          b.filter(
            (bg) => bg.debut_periode <= today && bg.fin_periode >= today,
          ),
        );

        const past = [];
        const future = [];
        for (const tx of t) {
          const txDate = tx.date.slice(0, 10);
          if (txDate > today) {
            future.push(tx);
          } else {
            past.push(tx);
          }
        }
        setPastTransactions(past.slice(0, 5));
        setFutureTransactions(future.slice(-3).reverse());
      })
      .catch((e) => console.error("Erreur chargement dashboard", e))
      .finally(() => setLoading(false));
  }, []);

  const solde = pastTransactions.reduce((acc, t) => {
    return acc + (t.type === "REVENU" ? t.montant : -t.montant);
  }, 0);

  const globalPercent =
    budgets.length > 0
      ? Math.round(
          budgets.reduce(
            (s, b) => s + Math.min(b.pourcentage_consomme, 100),
            0,
          ) / budgets.length,
        )
      : 0;

  if (loading) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-bg-concrete p-5">
        <div className="w-24 h-24 border-8 border-indigo border-t-acid-green rounded-full animate-spin mb-8"></div>
        <h2 className="font-display font-black text-2xl uppercase text-indigo animate-pulse">
          Chargement du Système...
        </h2>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto min-h-screen p-4 md:p-8 relative">
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full relative z-10">
        <section className="lg:col-span-8 flex flex-col">
          <div className="relative bg-white/80 backdrop-blur-lg rounded-2xl p-8 md:p-12 border-2 border-indigo-light mb-8 group hover:-translate-y-1 hover:shadow-[4px_4px_0px_var(--color-indigo-light)] transition-all duration-300 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)]">
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="font-display font-extrabold uppercase text-5xl md:text-6xl tracking-tighter text-indigo leading-none text-shadow-sm mb-1">
                  VUE D'ENSEMBLE
                </h1>
                <span className="font-display font-bold text-sm uppercase text-indigo/40 tracking-[0.3em]">
                  Accueil
                </span>
              </div>

              <div className="flex flex-col md:flex-row gap-4 md:items-end">
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-display font-bold text-xs uppercase text-indigo/60 tracking-widest">
                      Solde Disponible
                    </span>
                    <div className="bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-lg border-2 border-indigo/10 shadow-sm flex items-center gap-2 shrink-0">
                      <span className="font-display font-bold text-[10px] uppercase text-indigo/60">
                        Sante Budgets
                      </span>
                      <span
                        className={`font-data font-bold text-base ${100 - globalPercent >= 70 ? "text-acid-green" : 100 - globalPercent >= 40 ? "text-warning" : "text-coral"}`}
                      >
                        {100 - globalPercent}%
                      </span>
                    </div>
                  </div>
                  <p
                    className={`font-data font-black text-4xl md:text-6xl tracking-tighter leading-none mt-2 ${solde >= 0 ? "text-acid-green" : "text-coral"}`}
                  >
                    {solde > 0 ? "+" : ""}
                    {euro(solde)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg border-2 border-indigo-light rounded-2xl p-8 relative grow hover:shadow-[4px_4px_0px_var(--color-indigo-light)] transition-all duration-300 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)]">
            <div className="mb-6">
              <h2 className="font-display font-extrabold uppercase text-3xl md:text-4xl tracking-tighter text-indigo leading-none text-shadow-sm">
                Budgets en cours
              </h2>
              <Link
                to="/budgets"
                className="font-display text-xs font-bold uppercase tracking-wider text-indigo hover:text-indigo-light transition-colors px-3 py-1.5 rounded-lg border-2 border-transparent hover:border-indigo-light hover:bg-indigo/5 absolute top-6 right-6"
              >
                Tous →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgets.length === 0 ? (
                <div className="col-span-full py-12 text-center border-4 border-dashed border-indigo/20 rounded-3xl">
                  <p className="font-bold text-indigo/40 uppercase">
                    Aucun module installé
                  </p>
                </div>
              ) : (
                budgets.map((b) => {
                  const cat = categories[b.categorie_id];
                  const pct = Math.min(b.pourcentage_consomme, 100);
                  const isOver = b.est_depasse;

                  return (
                    <div
                      key={b.id}
                      className="group relative bg-gray-50 border-2 border-indigo/10 hover:bg-white/80 hover:backdrop-blur-lg hover:border-indigo-light rounded-xl p-4 transition-all duration-300 hover:shadow-[4px_4px_0px_var(--color-indigo-light)]"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6 group-hover:scale-110 bg-indigo/10 border-2 border-indigo/20">
                            <CategoryIcon
                              category={cat?.nom || "Autres"}
                              className="w-5 h-5 text-indigo"
                            />
                          </div>
                          <span className="font-display font-extrabold uppercase text-indigo truncate max-w-[120px]">
                            {cat?.nom || `Budget #${b.id}`}
                          </span>
                        </div>
                        <span
                          className={`font-data font-bold text-sm ${b.montant_restant < 0 ? "text-coral" : "text-indigo-light"}`}
                        >
                          {euro(b.montant_restant)}
                        </span>
                      </div>

                      <div className="h-4 bg-indigo/10 rounded-full overflow-hidden border-2 border-indigo/15 relative">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: progressBg(pct),
                          }}
                        ></div>
                      </div>

                      <Link
                        to={`/budgets/${b.id}`}
                        className="absolute inset-0 z-10"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        <section className="lg:col-span-4 flex flex-col gap-8">
          <Link
            to="/transactions/new"
            className="group relative bg-indigo text-white font-display font-extrabold uppercase text-lg px-8 py-4 rounded-xl border-4 border-indigo-light shadow-hard hover:-translate-y-1 hover:shadow-[8px_8px_0px_var(--color-indigo-light)] active:translate-y-1 active:shadow-none transition-all no-underline overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              <span className="group-hover:rotate-180 transition-transform duration-500 inline-block">
                ✦
              </span>
              Nouv. Transaction
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </Link>

          <div className="bg-white/80 backdrop-blur-lg border-2 border-indigo-light rounded-2xl p-6 grow flex flex-col hover:shadow-[4px_4px_0px_var(--color-indigo-light)] transition-all duration-300 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)]">
            <div className="flex justify-between items-start mb-6">
              <h2 className="font-display font-extrabold uppercase text-xl tracking-tighter text-indigo leading-tight text-shadow-sm">
                Dernières
                <br />
                Transactions
              </h2>
              <Link
                to="/transactions"
                className="font-display text-xs font-bold uppercase tracking-wider text-indigo hover:text-indigo-light transition-colors px-3 py-1.5 rounded-lg border-2 border-transparent hover:border-indigo-light hover:bg-indigo/5"
              >
                Tous →
              </Link>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {pastTransactions.length === 0 ? (
                <p className="text-center font-bold text-indigo/30 py-4">
                  R.A.S.
                </p>
              ) : (
                pastTransactions.map((t) => {
                  const isRevenu = t.type === "REVENU";

                  return (
                    <div
                      key={t.id}
                      className="relative bg-gray-50 border-2 border-indigo/10 hover:bg-white/80 hover:backdrop-blur-lg hover:border-indigo-light rounded-xl p-3 flex items-center gap-3 group hover:shadow-[4px_4px_0px_var(--color-indigo-light)] transition-all duration-300"
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:rotate-6 group-hover:scale-110 shrink-0 border-2 ${isRevenu ? "bg-acid-green/20 border-acid-green/40 text-acid-green" : "bg-coral/20 border-coral/40 text-coral"}`}
                      >
                        <CategoryIcon
                          category={t.categorie || "Autres"}
                          className="w-5 h-5"
                        />
                      </div>

                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-display font-bold uppercase text-indigo truncate text-sm">
                          {t.libelle}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-indigo/50 tracking-wider">
                          {t.categorie}
                        </span>
                      </div>

                      <span
                        className={`font-data font-bold text-base whitespace-nowrap ${isRevenu ? "text-acid-green" : "text-coral"}`}
                      >
                        {isRevenu ? "+" : "−"}
                        {euro(t.montant)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {futureTransactions.length > 0 && (
            <div className="bg-white/80 backdrop-blur-lg border-2 border-indigo-light rounded-2xl p-6 hover:shadow-[4px_4px_0px_var(--color-indigo-light)] transition-all duration-300 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)]">
              <h3 className="font-display font-extrabold uppercase text-lg tracking-tighter text-indigo leading-none text-shadow-sm mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-light animate-pulse"></span>
                À venir
              </h3>
              <div className="space-y-3">
                {futureTransactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex justify-between items-center text-sm border-b border-indigo-light/20 pb-3 last:border-0 last:pb-0"
                  >
                    <span className="font-display font-bold uppercase text-indigo truncate">
                      {t.libelle}
                    </span>
                    <span className="font-data font-bold text-indigo">
                      {euro(t.montant)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
