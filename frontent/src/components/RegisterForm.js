import React, { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, UserPlus, AlertCircle, Loader2, Activity, Globe, Users, Briefcase, UserCircle, PlusCircle, User } from 'lucide-react';

// Configuration des pays
const AFRICAN_COUNTRIES = ["Algérie", "Angola", "Bénin", "Botswana", "Burkina Faso", "Burundi", "Cameroun", "Cap-Vert", "Comores", "Congo", "Côte d'Ivoire", "Djibouti", "Égypte", "Éthiopie", "Gabon", "Gambie", "Ghana", "Guinée", "Kenya", "Madagascar", "Mali", "Maroc", "Maurice", "Mauritanie", "Mozambique", "Namibie", "Niger", "Nigéria", "Ouganda", "Rwanda", "Sénégal", "Seychelles", "Somalie", "Soudan", "Tanzanie", "Tchad", "Togo", "Tunisie", "Zambie", "Zimbabwe"].sort();

const SUGGESTED_COMPANIES = ["OMS", "UNICEF", "Union Africaine", "Ministère de la Santé", "Croix-Rouge", "GAVI", "CDC Afrique"];

const registerTranslations = {
  fr: {
    subtitle: "Création de compte professionnel",
    namePlaceholder: "Nom Complet",
    emailPlaceholder: "Adresse Email",
    genderPlaceholder: "Genre",
    companyPlaceholder: "Organisation / Entreprise",
    otherCompany: "Nom de l'organisation",
    jobPlaceholder: "Poste occupé",
    countryPlaceholder: "Pays de résidence",
    passPlaceholder: "Mot de passe",
    confirmPlaceholder: "Confirmer mot de passe",
    btnRegister: "S'inscrire",
    btnLoading: "Traitement...",
    alreadyAccount: "Déjà un compte ?",
    loginLink: "Se connecter",
    successMsg: "Inscription réussie ! En attente de validation admin.",
    other: "Autre (Précisez...)",
    errorFields: "Veuillez remplir tous les champs",
    errorMatch: "Les mots de passe diffèrent",
    male: "Homme", female: "Femme"
  },
  en: {
    subtitle: "Professional Account Creation",
    namePlaceholder: "Full Name",
    emailPlaceholder: "Email Address",
    genderPlaceholder: "Gender",
    companyPlaceholder: "Organization / Company",
    otherCompany: "Organization Name",
    jobPlaceholder: "Job Title",
    countryPlaceholder: "Country of Residence",
    passPlaceholder: "Password",
    confirmPlaceholder: "Confirm Password",
    btnRegister: "Register",
    btnLoading: "Processing...",
    alreadyAccount: "Already have an account?",
    loginLink: "Sign In",
    successMsg: "Registration successful! Waiting for admin approval.",
    other: "Other (Specify...)",
    errorFields: "Please fill all fields",
    errorMatch: "Passwords do not match",
    male: "Male", female: "Female"
  }
};

export default function RegisterForm({ onNavigateToLogin, language }) {
  const t = registerTranslations[language] || registerTranslations.fr;

  const [formData, setFormData] = useState({
    full_name: '', email: '', gender: '', company: '', otherCompany: '', job: '', country: '', password: '', confirmPassword: ''
  });
  const [showOtherCompany, setShowOtherCompany] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'company') setShowOtherCompany(value === 'Other');
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const finalCompany = showOtherCompany ? formData.otherCompany : formData.company;

    if (!formData.full_name || !formData.email || !formData.gender || !finalCompany || !formData.job || !formData.country || !formData.password) {
      setError(t.errorFields); return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(t.errorMatch); return;
    }

    setLoading(true);
    try {
      await axios.post('https://vaccination-coverage-tracker-backend.onrender.com/api/register', { ...formData, company: finalCompany });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-10">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border dark:border-gray-700">
        
        <div className="text-center mb-6">
          <div className="flex justify-center items-center space-x-3 mb-2">
            <Activity className="text-blue-600" size={32} />
            <h1 className="text-2xl font-bold dark:text-white text-nowrap">Vaccination Tracker</h1>
          </div>
          <p className="text-gray-500 text-sm italic">{t.subtitle}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-xs font-bold border-l-4 border-red-500">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus size={32} />
            </div>
            <p className="text-green-700 font-bold mb-6">{t.successMsg}</p>
            <button onClick={onNavigateToLogin} className="text-blue-600 font-bold hover:underline">
              {t.loginLink}
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-3">
              
              {/* NOUVEAU : NOM COMPLET */}
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <input name="full_name" type="text" className="w-full bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl py-2.5 pl-10 pr-4 text-sm dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder={t.namePlaceholder} onChange={handleChange} required />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input name="email" type="email" className="w-full bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl py-2.5 pl-10 pr-4 text-sm dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder={t.emailPlaceholder} onChange={handleChange} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Users className="absolute left-3 top-3 text-gray-400" size={18} />
                  <select name="gender" className="w-full bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl py-2.5 pl-10 pr-4 text-sm dark:text-white outline-none appearance-none cursor-pointer" onChange={handleChange} required>
                    <option value="">{t.genderPlaceholder}</option>
                    <option value="Male">{t.male}</option>
                    <option value="Female">{t.female}</option>
                  </select>
                </div>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 text-gray-400" size={18} />
                  <select name="country" className="w-full bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl py-2.5 pl-10 pr-4 text-sm dark:text-white outline-none appearance-none cursor-pointer" onChange={handleChange} required>
                    <option value="">{t.countryPlaceholder}</option>
                    {AFRICAN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="relative">
                <Briefcase className="absolute left-3 top-3 text-gray-400" size={18} />
                <select name="company" className="w-full bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl py-2.5 pl-10 pr-4 text-sm dark:text-white outline-none appearance-none cursor-pointer" onChange={handleChange} required>
                  <option value="">{t.companyPlaceholder}</option>
                  {SUGGESTED_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="Other">+ {t.other}</option>
                </select>
              </div>

              {showOtherCompany && (
                <div className="relative">
                  <PlusCircle className="absolute left-3 top-3 text-blue-500" size={18} />
                  <input name="otherCompany" type="text" className="w-full bg-blue-50 dark:bg-gray-700 border border-blue-200 dark:border-gray-600 rounded-xl py-2.5 pl-10 pr-4 text-sm dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder={t.otherCompany} onChange={handleChange} required />
                </div>
              )}

              <div className="relative">
                <UserCircle className="absolute left-3 top-3 text-gray-400" size={18} />
                <input name="job" type="text" className="w-full bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl py-2.5 pl-10 pr-4 text-sm dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder={t.jobPlaceholder} onChange={handleChange} required />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input name="password" type="password" className="w-full bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl py-2.5 pl-10 pr-4 text-sm dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder={t.passPlaceholder} onChange={handleChange} required />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input name="confirmPassword" type="password" className="w-full bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl py-2.5 pl-10 pr-4 text-sm dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder={t.confirmPlaceholder} onChange={handleChange} required />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
                <span>{loading ? t.btnLoading : t.btnRegister}</span>
              </button>
            </form>

            <div className="mt-6 text-center text-sm border-t dark:border-gray-700 pt-4">
              <span className="text-gray-500">{t.alreadyAccount} </span>
              <button onClick={onNavigateToLogin} className="text-blue-600 font-bold hover:underline">
                {t.loginLink}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}