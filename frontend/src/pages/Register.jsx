import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register as registerApi } from "../api/client";
import { useToast } from "../components/Toast";
import { validatePassword, validateUsername } from "../utils/validation";
import PasswordStrength from "../components/PasswordStrength";

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const validate = () => {
    const errs = {};

    const usernameError = validateUsername(form.username);
    if (usernameError) errs.username = usernameError;

    const passwordErrors = validatePassword(form.password);
    if (passwordErrors.length > 0) errs.password = passwordErrors[0];

    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = "Les mots de passe ne correspondent pas";
    }

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
      await registerApi({ username: form.username, password: form.password });
      toast("Compte créé avec succès ! Vous pouvez maintenant vous connecter.");
      navigate("/login");
    } catch (err) {
      const detail =
        err.response?.data?.detail || "Erreur lors de l'inscription";
      if (err.response?.status === 409) {
        setErrors({ username: "Ce nom d'utilisateur est déjà pris" });
      } else {
        setErrors({ _global: detail });
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
          <p className="font-data text-indigo/60">Créez votre compte</p>
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
              placeholder="Choisissez un nom d'utilisateur"
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
                placeholder="Minimum 8 caractères"
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
            <PasswordStrength password={form.password} />
          </div>

          <div>
            <label className="block font-display font-bold text-xs uppercase text-indigo/60 mb-2">
              Confirmer le mot de passe *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
                className="input-brutal pr-12"
                placeholder="Répétez le mot de passe"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo/40 hover:text-indigo transition-colors"
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-coral font-bold text-xs mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-light text-white border-4 border-indigo rounded-xl py-3 font-display font-bold uppercase shadow-[6px_6px_0px_rgba(79,70,229,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(79,70,229,1)] active:translate-y-1 active:shadow-[3px_3px_0px_rgba(79,70,229,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? "Création..." : "Créer mon compte"}
          </button>

          <div className="text-center pt-4 border-t-2 border-gray-200">
            <p className="font-data text-sm text-indigo/60">
              Vous avez déjà un compte ?{" "}
              <Link
                to="/login"
                className="text-indigo-light font-bold hover:underline"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
