import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import BackgroundShapes from "./BackgroundShapes";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const pageTitles = {
    "/": "Dashboard",
    "/transactions": "Transactions",
    "/transactions/new": "Nouv. Entrée",
    "/budgets": "Mes Budgets",
  };

  const getCurrentTitle = () => {
    if (location.pathname.match(/^\/budgets\/\d+$/)) {
      return "Détail du Budget";
    }
    return pageTitles[location.pathname] || "MyBudget";
  };

  const currentTitle = getCurrentTitle();

  const navLinks = [
    { to: "/", label: "⌂", title: "Accueil" },
    { to: "/transactions", label: "⇄", title: "Transactions" },
    { to: "/budgets", label: "◈", title: "Budgets" },
  ];

  return (
    <>
      <BackgroundShapes />

      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b-2 border-indigo-light shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="font-display font-black text-2xl uppercase text-indigo tracking-widest hover:text-indigo-light hover:scale-105 transition-all duration-200 no-underline"
            >
              MyBudget
            </Link>
            <span className="hidden md:block text-indigo/30">•</span>
            <span className="hidden md:block bg-indigo/5 px-3 py-1 rounded-full border border-indigo/10 font-data font-bold text-sm text-indigo/60 min-w-40 text-center">
              {currentTitle}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                title={link.title}
                className={`w-10 h-10 flex items-center justify-center rounded-xl border-2 text-lg no-underline transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-lighter ${
                  location.pathname === link.to
                    ? "border-indigo-light bg-indigo text-white shadow-[2px_2px_0px_var(--color-indigo-lighter)]"
                    : "border-indigo-light/50 bg-white text-indigo shadow-[2px_2px_0px_transparent] hover:border-indigo-light hover:shadow-[2px_2px_0px_var(--color-indigo-lighter)]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <span className="font-data text-sm text-indigo/60">
                {user.username}
              </span>
            )}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="bg-coral text-white border-2 border-coral/80 rounded-lg px-4 py-2 font-display font-bold text-sm uppercase shadow-[2px_2px_0px_rgba(0,0,0,0.1)] hover:shadow-[4px_4px_0px_var(--color-indigo-light)] active:shadow-[1px_1px_0px_rgba(0,0,0,0.1)] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-lighter"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t-2 border-indigo-light shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around py-3 px-4">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`w-12 h-12 flex flex-col items-center justify-center rounded-xl border-2 text-lg no-underline transition-all duration-200 ${
                location.pathname === link.to
                  ? "border-indigo-light bg-indigo text-white shadow-[2px_2px_0px_var(--color-indigo-lighter)]"
                  : "border-transparent text-indigo/60 hover:border-indigo-light/50"
              }`}
            >
              {link.label}
              <span className="text-[8px] font-display font-bold uppercase mt-0.5">
                {link.title}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="md:pb-0 pb-20">{children}</div>

      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Déconnexion"
        message="Voulez-vous vraiment vous déconnecter ?"
        confirmText="Se déconnecter"
        cancelText="Annuler"
        type="warning"
      />
    </>
  );
}
