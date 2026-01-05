import React, { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, LogIn, AlertCircle, Loader2, Activity } from 'lucide-react';

const loginTranslations = {
  fr: {
    subtitle: "Connectez-vous à votre espace",
    emailPlaceholder: "Adresse Email",
    passPlaceholder: "Mot de passe",
    btnConnect: "Se connecter",
    btnLoading: "Connexion...",
    googleBtn: "Continuer avec Google",
    noAccount: "Pas de compte ?",
    registerLink: "S'inscrire",
    errorFields: "Champs vides",
    errorAuth: "Erreur d'authentification"
  },
  en: {
    subtitle: "Sign in to your account",
    emailPlaceholder: "Email Address",
    passPlaceholder: "Password",
    btnConnect: "Sign In",
    btnLoading: "Signing in...",
    googleBtn: "Continue with Google",
    noAccount: "No account?",
    registerLink: "Register",
    errorFields: "Empty fields",
    errorAuth: "Auth error"
  }
};

export default function LoginForm({ onLoginSuccess, onNavigateToRegister, language }) {
  const t = loginTranslations[language] || loginTranslations.fr;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError(t.errorFields); return; }
    setLoading(true);
    try {
      const response = await axios.post('https://vaccination-coverage-tracker-backend.onrender.com/api/login', { email, password });
      if (response.data.user) onLoginSuccess(response.data.user);
    } catch (err) {
      setError(t.errorAuth);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border dark:border-gray-700">
        
        {/* LOGO ET TITRE FIXE */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-3 mb-2">
            <Activity className="text-blue-600" size={32} />
            <h1 className="text-2xl font-bold dark:text-white tracking-tight">Vaccination Tracker</h1>
          </div>
          <p className="text-gray-500 text-sm italic">{t.subtitle}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm font-bold">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="email"
              className="w-full bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl py-2.5 pl-10 pr-4 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="password"
              className="w-full bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl py-2.5 pl-10 pr-4 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t.passPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
            <span>{loading ? t.btnLoading : t.btnConnect}</span>
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t dark:border-gray-700"></span></div>
          <span className="relative bg-white dark:bg-gray-800 px-2 text-xs text-gray-400 uppercase font-bold">OR</span>
        </div>

        <button
          onClick={() => console.log("Google Login")}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border dark:border-gray-600 text-gray-700 dark:text-white font-bold py-2.5 rounded-xl hover:bg-gray-50 transition-all active:scale-95"
        >
          <img src="https://www.svgrepo.com/show/355037/google.svg" alt="G" className="w-5 h-5" />
          <span className="text-sm">{t.googleBtn}</span>
        </button>

        <div className="mt-8 text-center text-sm">
          <span className="text-gray-500">{t.noAccount} </span>
          <button onClick={onNavigateToRegister} className="text-blue-600 font-bold hover:underline">
            {t.registerLink}
          </button>
        </div>
      </div>
    </div>
  );
}