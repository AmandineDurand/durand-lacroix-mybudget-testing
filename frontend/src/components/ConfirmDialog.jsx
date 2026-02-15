export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  type = "danger",
  loading = false,
  closeOnConfirm = true,
}) {
  if (!open) return null;

  const typeStyles = {
    danger: {
      bg: "bg-coral",
      border: "border-coral",
    },
    warning: {
      bg: "bg-indigo-light",
      border: "border-indigo",
    },
    info: {
      bg: "bg-acid-green",
      border: "border-acid-green",
    },
  };

  const style = typeStyles[type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl border-2 ${style.border} shadow-[4px_4px_0px_var(--color-indigo-light)] w-full max-w-md mx-4 p-6 animate-bounce-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display font-black text-2xl uppercase text-indigo mb-4">
          {title}
        </h2>
        <p className="font-data text-indigo mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-white text-indigo border-2 border-indigo-light rounded-xl py-3 font-display font-bold uppercase shadow-[2px_2px_0px_var(--color-indigo-lighter)] hover:shadow-[3px_3px_0px_var(--color-indigo-light)] active:shadow-[1px_1px_0px_var(--color-indigo-lighter)] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-lighter"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              if (closeOnConfirm) {
                onClose();
              }
            }}
            disabled={loading}
            aria-busy={loading}
            className={`flex-1 ${style.bg} text-white border-2 ${style.border} rounded-xl py-3 font-display font-bold uppercase shadow-[2px_2px_0px_var(--color-indigo-light)] hover:shadow-[4px_4px_0px_var(--color-indigo-light)] active:shadow-[1px_1px_0px_var(--color-indigo-light)] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-lighter disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            <span className="inline-flex items-center justify-center gap-2">
              {loading && (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              )}
              {confirmText}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
