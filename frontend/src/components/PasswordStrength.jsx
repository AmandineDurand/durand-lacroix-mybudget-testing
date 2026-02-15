import { getPasswordStrength } from "../utils/validation";

const strengthLabels = ["Très faible", "Faible", "Moyen", "Fort", "Très fort"];
const strengthColors = [
  "bg-coral",
  "bg-coral",
  "bg-indigo-light",
  "bg-acid-green",
  "bg-acid-green",
];

const strengthTextColors = [
  "text-coral",
  "text-coral",
  "text-indigo-light",
  "text-acid-green",
  "text-acid-green",
];

export default function PasswordStrength({ password }) {
  if (!password) return null;

  const strength = getPasswordStrength(password);
  const percentage = (strength / 4) * 100;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-display font-bold text-xs uppercase text-indigo/60">
          Force:
        </span>
        <span
          className={`font-data font-bold text-xs ${strengthTextColors[strength]}`}
        >
          {strengthLabels[strength]}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden border-2 border-indigo/10">
        <div
          className={`h-full transition-all duration-300 ${strengthColors[strength]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
