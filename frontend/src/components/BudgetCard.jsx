import { useNavigate } from "react-router-dom";

function progressColor(pct, depasse) {
  if (depasse || pct >= 100) return "fill-coral";
  if (pct >= 75) return "fill-indigo";
  return "fill-acid";
}

export const euro = (v) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    v,
  );

export function progressBg(pct) {
  const p = Math.max(0, Math.min(pct, 100));
  if (p <= 50) {
    const t = p / 50;
    const r = Math.round(132 + (255 - 132) * t);
    const g = Math.round(204 + (218 - 204) * t);
    const b = Math.round(22 + (85 - 22) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
  const t = (p - 50) / 50;
  const r = Math.round(255 + (251 - 255) * t);
  const g = Math.round(218 + (113 - 218) * t);
  const b = Math.round(85 + (133 - 85) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function BudgetCard({ budget, onEdit }) {
  const navigate = useNavigate();
  const pct = Math.min(budget.pourcentage_consomme, 100);
  const isOver = budget.est_depasse;

  return (
    <div
      className="bg-white rounded-2xl border-4 border-indigo shadow-hard-sm p-5 cursor-pointer hover:-translate-y-1 hover:shadow-hard active:translate-y-0.5 active:shadow-[2px_2px_0px_var(--color-indigo)] transition-all duration-200"
      onClick={() => navigate(`/budgets/${budget.id}`)}
    >
      <div className="flex justify-between items-start mb-3">
        <span className="font-display font-bold uppercase text-indigo">
          Budget #{budget.id}
        </span>
        <div className="flex items-center gap-2">
          {isOver && (
            <span className="bg-coral text-white text-xs font-display font-bold uppercase px-3 py-1 rounded-lg border-2 border-indigo shadow-[2px_2px_0px_var(--color-indigo)] animate-pulse-glow">
              DÉPASSÉ
            </span>
          )}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(budget);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-indigo text-indigo bg-white shadow-[2px_2px_0px_var(--color-indigo)] hover:-translate-y-0.5 hover:shadow-hard-sm active:translate-y-0.5 active:shadow-none transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-lighter"
              title="Éditer"
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
          )}
        </div>
      </div>

      <div className="font-data font-bold text-sm text-indigo mb-1">
        {euro(budget.montant_depense)} / {euro(budget.montant_fixe)}
      </div>
      <div className="font-data text-xs text-indigo/60 mb-3">
        Reste : {euro(budget.montant_restant)}
      </div>

      <div className="h-5 bg-indigo/10 rounded-full overflow-hidden border-2 border-indigo/20 relative">
        <div
          className={`h-full rounded-full fill-relief ${progressColor(budget.pourcentage_consomme, isOver)} transition-all duration-500 ease-out relative`}
          style={{ width: `${pct}%` }}
        >
          <div className="absolute top-0.5 left-1 right-1 h-1.5 bg-white/30 rounded-full" />
        </div>
      </div>

      <div
        className={`font-data font-bold text-xs mt-2 text-right ${isOver ? "text-coral" : "text-indigo/60"}`}
      >
        {budget.pourcentage_consomme.toFixed(0)}%
      </div>
    </div>
  );
}
