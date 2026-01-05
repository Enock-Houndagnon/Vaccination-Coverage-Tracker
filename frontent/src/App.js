import React, { useState } from 'react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Dashboard from './components/Dashboard';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('login');
  const [language, setLanguage] = useState('fr'); // État global de la langue

  const handleLoginSuccess = (userData) => setUser(userData);
  const handleLogout = () => {
    setUser(null);
    setCurrentPage('login');
  };

  // Si connecté, on envoie la langue au Dashboard
  if (user) {
    return (
      <Dashboard 
        user={user} 
        onLogout={handleLogout} 
        language={language} 
        setLanguage={setLanguage} 
      />
    );
  }

  // Sinon, on affiche le Login avec le sélecteur
  return (
    <div className="relative">
      {/* Sélecteur de langue global (hors fenêtre de login) */}
      <div className="absolute top-5 right-10 z-50 flex items-center bg-white p-2 rounded-lg shadow-sm border">
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-transparent border-none text-sm font-bold cursor-pointer focus:ring-0"
        >
          <option value="fr">Français (FR)</option>
          <option value="en">English (EN)</option>
        </select>
      </div>

      {currentPage === 'login' ? (
        <LoginForm 
          onLoginSuccess={handleLoginSuccess} 
          onNavigateToRegister={() => setCurrentPage('register')}
          language={language}
        />
      ) : (
        <RegisterForm 
          onNavigateToLogin={() => setCurrentPage('login')} 
          language={language}
        />
      )}
    </div>
  );
}

export default App;