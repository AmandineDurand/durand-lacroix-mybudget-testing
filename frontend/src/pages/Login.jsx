import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as loginApi } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/Toast";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.username) errs.username = "Nom d'utilisateur requis";
    if (!form.password) errs.password = "Mot de passe requis";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const response = await loginApi({
        username: form.username,
        password: form.password,
      });

      login(
        { user_id: response.user_id, username: response.username },
        response.access_token,
        form.rememberMe,
      );

      toast("Connexion réussie !");
      navigate("/");
    } catch (err) {
      if (err.response?.status === 401) {
        setErrors({ _global: "Nom d'utilisateur ou mot de passe incorrect" });
      } else {
        setErrors({
          _global: "Erreur de connexion au serveur. Veuillez réessayer.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-indigo/10 via-white to-acid-green/10 p-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display font-black text-4xl uppercase text-indigo mb-2">
            MyBudget
          </h1>
          <p className="font-data text-indigo/60">
            Connectez-vous à votre compte
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border-4 border-indigo shadow-hard p-6 space-y-4 animate-fade-up"
        >
          {errors._global && (
            <div className="bg-coral/10 border-2 border-coral rounded-lg p-3">
              <p className="text-coral font-bold text-sm">{errors._global}</p>
            </div>
          )}

          <div>
            <label className="block font-display font-bold text-xs uppercase text-indigo/60 mb-2">
              Nom d'utilisateur *
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => handleChange("username", e.target.value)}
              className="input-brutal"
              placeholder="Votre nom d'utilisateur"
            />
            {errors.username && (
              <p className="text-coral font-bold text-xs mt-1">
                {errors.username}
              </p>
            )}
          </div>

          <div>
            <label className="block font-display font-bold text-xs uppercase text-indigo/60 mb-2">
              Mot de passe *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className="input-brutal pr-12"
                placeholder="Votre mot de passe"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo/40 hover:text-indigo transition-colors"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {errors.password && (
              <p className="text-coral font-bold text-xs mt-1">
                {errors.password}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rememberMe"
              checked={form.rememberMe}
              onChange={(e) => handleChange("rememberMe", e.target.checked)}
              className="w-5 h-5 border-2 border-indigo rounded accent-indigo-light cursor-pointer"
            />
            <label
              htmlFor="rememberMe"
              className="font-data text-sm text-indigo/60 cursor-pointer select-none"
            >
              Se souvenir de moi
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-light text-white border-4 border-indigo rounded-xl py-3 font-display font-bold uppercase shadow-[6px_6px_0px_rgba(79,70,229,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(79,70,229,1)] active:translate-y-1 active:shadow-[3px_3px_0px_rgba(79,70,229,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>

          <div className="text-center pt-4 border-t-2 border-gray-200">
            <p className="font-data text-sm text-indigo/60">
              Pas encore de compte ?{" "}
              <Link
                to="/register"
                className="text-indigo-light font-bold hover:underline"
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
