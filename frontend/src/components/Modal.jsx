export default function Modal({ open, onClose, title, children }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border-2 border-indigo-light shadow-[4px_4px_0px_var(--color-indigo-light)] w-full max-w-md mx-4 p-6 animate-bounce-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display font-black text-2xl uppercase text-indigo">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-indigo-light/50 text-indigo/60 hover:text-indigo hover:border-indigo-light font-bold text-xl bg-white transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-lighter"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
