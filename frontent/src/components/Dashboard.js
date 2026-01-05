import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Activity, LayoutDashboard, UploadCloud, 
  Search, Moon, Sun, FileDown, Map as MapIcon, 
  History, Globe, Settings, Filter, Loader2, LogOut, 
  RefreshCw, AlertCircle, ShieldCheck, Trash2, UserCheck, Info
} from 'lucide-react';
import AgeGroupChart from './AgeGroupChart';
import TimeSeriesChart from './TimeSeriesChart';
import DataUpload from './DataUpload';
import MapChart from './MapChart'; 

const translations = {
  fr: {
    dashboard: "Tableau de bord",
    map: "Carte Géo",
    upload: "Importation",
    history: "Historique",
    settings: "Paramètres",
    admin: "Gestion Admin",
    searchPlaceholder: "Chercher vaccin...",
    allCountries: "Tous les Pays",
    allRegions: "Toutes Régions",
    export: "Exporter",
    logout: "Déconnexion",
    totalVax: "Total Vaccinations",
    avgRate: "Taux Moyen",
    vaxTypes: "Types de Vaccins",
    file: "Fichier",
    countries: "Pays Concernés",
    vaccines: "Vaccins",
    date: "Date",
    templateTitle: "Structure du fichier CSV",
    templateHelp: "Les colonnes suivantes sont obligatoires :",
    downloadTemplate: "Modèle CSV",
    approve: "Approuver",
    reject: "Rejeter",
    noPending: "Aucun utilisateur en attente."
  },
  en: {
    dashboard: "Dashboard",
    map: "Geo Map",
    upload: "Data Import",
    history: "History",
    settings: "Settings",
    admin: "Admin Management",
    searchPlaceholder: "Search vaccine...",
    allCountries: "All Countries",
    allRegions: "All Regions",
    export: "Export",
    logout: "Logout",
    totalVax: "Total Vaccinations",
    avgRate: "Average Rate",
    vaxTypes: "Vaccine Types",
    file: "File",
    countries: "Countries",
    vaccines: "Vaccines",
    date: "Date",
    templateTitle: "CSV Structure",
    templateHelp: "The following columns are mandatory:",
    downloadTemplate: "CSV Template",
    approve: "Approve",
    reject: "Reject",
    noPending: "No pending users."
  }
};

export default function Dashboard({ user, onLogout, language, setLanguage }) {
  const t = translations[language] || translations.fr;

  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics');
  const [searchTerm, setSearchTerm] = useState(''); 
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [darkMode, setDarkMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);

  const isProvisional = user?.status === 'provisional';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchAllData();
    if (isAdmin) fetchPendingUsers();
  }, [isAdmin]);

  const fetchAllData = async () => {
    if (!loading) setIsRefreshing(true);
    try {
      const endpoints = [axios.get('https://vaccination-coverage-tracker-backend.onrender.com/api/vaccination')];
      if (!isProvisional) endpoints.push(axios.get('https://vaccination-coverage-tracker-backend.onrender.com/api/history'));
      const results = await Promise.all(endpoints);
      setAllData(results[0].data);
      if (!isProvisional) setHistory(results[1].data);
    } catch (error) { console.error(error); } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const res = await axios.get('https://vaccination-coverage-tracker-backend.onrender.com/api/admin/pending-users');
      setPendingUsers(res.data);
    } catch (err) { console.error(err); }
  };

  // --- ACTIONS ADMIN (RÉPARÉES) ---
  const handleApprove = async (userId, name, country) => {
    const scope = window.confirm(`Donner un accès complet (AFRIQUE) à ${name} ?\n\nOK = Accès Total (AFRIQUE)\nAnnuler = Accès Limité à (${country})`) 
                  ? 'All' 
                  : country;
    try {
      await axios.post('https://vaccination-coverage-tracker-backend.onrender.com/api/admin/approve-user', { user_id: userId, scope: scope });
      alert(`Utilisateur ${name} approuvé !`);
      fetchPendingUsers();
    } catch (err) { alert("Erreur lors de l'approbation"); }
  };

  const handleReject = async (userId, name) => {
    if (!window.confirm(`Supprimer définitivement l'accès pour ${name} ?`)) return;
    try {
      await axios.post('https://vaccination-coverage-tracker-backend.onrender.com/api/admin/reject-user', { user_id: userId });
      alert(`Utilisateur ${name} rejeté.`);
      fetchPendingUsers();
    } catch (err) { alert("Erreur lors du rejet"); }
  };

  useEffect(() => {
    let results = [...allData];
    const userScope = user?.scope?.toLowerCase();
    const hasFullAccess = !userScope || userScope === 'all' || userScope === 'afrique';

    if (!hasFullAccess) {
      results = results.filter(d => d.country?.toLowerCase() === userScope);
    } else if (selectedCountry !== 'all') {
      results = results.filter(d => d.country?.toLowerCase() === selectedCountry.toLowerCase());
    }

    if (selectedLocation !== 'all') {
      results = results.filter(d => d.location_name?.toLowerCase() === selectedLocation.toLowerCase());
    }
    
    if (searchTerm) {
      results = results.filter(d => d.vaccine_type?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    setFilteredData(results);
  }, [searchTerm, selectedCountry, selectedLocation, allData, user]);

  const countriesList = Array.from(new Set(allData.map(d => d.country)));
  const locationsList = Array.from(new Set(allData.filter(d => {
    const userScope = user?.scope?.toLowerCase();
    return (!userScope || userScope === 'all' || userScope === 'afrique') ? (selectedCountry === 'all' || d.country === selectedCountry) : (d.country?.toLowerCase() === userScope);
  }).map(d => d.location_name)));

  const downloadCSVTemplate = () => {
    const cols = "country,location_name,vaccine_type,age_group,coverage_rate,vaccination_date\n";
    const example = "Cameroon,Littoral,BCG,0-11 months,85.0,2023-12-01";
    const blob = new Blob([cols + example], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_vaccination.csv';
    a.click();
  };

  if (loading) return <div className="h-screen flex items-center justify-center dark:bg-gray-900"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        
        {isProvisional && (
          <div className="fixed top-0 inset-x-0 z-[100] bg-red-600 text-white text-center py-2 text-xs font-bold shadow-lg">
            <AlertCircle className="inline mr-2" size={14}/> {t.provisionalMsg}
          </div>
        )}

        <aside className={`w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 fixed h-full flex flex-col justify-between ${isProvisional ? 'pt-10' : ''}`}>
          <div>
            <div className="p-6 flex items-center gap-3">
              <Activity className="text-blue-600" size={28} />
              <h1 className="text-xl font-bold dark:text-white">VaxTracker</h1>
            </div>
            <nav className="px-4">
              <SidebarLink active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={LayoutDashboard} label={t.dashboard} />
              <SidebarLink active={activeTab === 'map'} onClick={() => setActiveTab('map')} icon={MapIcon} label={t.map} />
              {!isProvisional && <SidebarLink active={activeTab === 'upload'} onClick={() => setActiveTab('upload')} icon={UploadCloud} label={t.upload} />}
              {!isProvisional && <SidebarLink active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} label={t.history} />}
              {isAdmin && <SidebarLink active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon={ShieldCheck} label={t.admin} />}
              <SidebarLink active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={Settings} label={t.settings} />
            </nav>
          </div>
          <div className="p-4 border-t dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4 px-2 text-left">
              <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">{user?.full_name ? user.full_name[0] : 'U'}</div>
              <div className="flex-1 truncate">
                <p className="text-sm font-bold dark:text-white truncate">{user?.full_name || user?.email}</p>
                <p className="text-[10px] text-blue-500 font-black">SCOPE: {user?.scope}</p>
              </div>
            </div>
            <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100"><LogOut size={18} /> {t.logout}</button>
          </div>
        </aside>

        <main className={`flex-1 ml-64 ${isProvisional ? 'mt-10' : ''}`}>
          <header className="h-20 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center px-8 gap-4 sticky top-0 z-40">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input type="text" placeholder={t.searchPlaceholder} className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg py-2 pl-10 text-sm dark:text-white outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div className={`flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 ${(!user?.scope || user.scope.toLowerCase() === 'all' || user.scope.toLowerCase() === 'afrique') ? '' : 'opacity-50 pointer-events-none'}`}>
              <Globe size={16} className="text-gray-400 mr-2" />
              <select value={(!user?.scope || user.scope.toLowerCase() === 'all' || user.scope.toLowerCase() === 'afrique') ? selectedCountry : user.scope} onChange={(e) => {setSelectedCountry(e.target.value); setSelectedLocation('all');}} className="bg-transparent border-none py-2 text-sm dark:text-white focus:ring-0">
                {(!user?.scope || user.scope.toLowerCase() === 'all' || user.scope.toLowerCase() === 'afrique') && <option value="all">{t.allCountries}</option>}
                {countriesList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3">
              <Filter size={16} className="text-gray-400 mr-2" />
              <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="bg-transparent border-none py-2 text-sm dark:text-white focus:ring-0">
                <option value="all">{t.allRegions}</option>
                {locationsList.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 ml-auto">
                <button onClick={fetchAllData} className="p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                    <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
                </button>
                <button onClick={() => setDarkMode(!darkMode)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-yellow-400">
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button disabled={isProvisional} onClick={() => window.print()} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${isProvisional ? 'bg-gray-200 text-gray-400' : 'bg-blue-600 text-white'}`}>
                    <FileDown size={18} /> {t.export}
                </button>
            </div>
          </header>

          <div className="p-8">
            {activeTab === 'analytics' && (
              <div className="animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <StatCard title={t.totalVax} value={filteredData.length.toLocaleString()} />
                  <StatCard title={t.avgRate} value={(filteredData.reduce((acc, curr) => acc + (parseFloat(curr.coverage_rate) || 0), 0) / (filteredData.length || 1)).toFixed(2) + "%"} />
                  <StatCard title={t.vaxTypes} value={new Set(filteredData.map(d => d.vaccine_type)).size} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border dark:border-gray-700 shadow-sm"><AgeGroupChart data={filteredData} /></div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border dark:border-gray-700 shadow-sm"><TimeSeriesChart data={filteredData} /></div>
                </div>
              </div>
            )}

            {activeTab === 'map' && <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border dark:border-gray-700 min-h-[500px] shadow-sm"><MapChart data={filteredData} /></div>}
            
            {activeTab === 'upload' && !isProvisional && (
              <div className="space-y-6 max-w-4xl mx-auto">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-2xl flex items-center gap-6 shadow-sm">
                  <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg"><Info size={28} /></div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-black text-blue-900 dark:text-blue-100">{t.templateTitle}</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">{t.templateHelp}</p>
                    <div className="flex flex-wrap gap-2">
                      {['country', 'location_name', 'vaccine_type', 'age_group', 'coverage_rate', 'vaccination_date'].map(c => (
                        <code key={c} className="px-2 py-1 bg-white dark:bg-gray-800 rounded border text-[10px] font-mono font-bold text-blue-600 shadow-sm">{c}</code>
                      ))}
                    </div>
                  </div>
                  <button onClick={downloadCSVTemplate} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-gray-700 rounded-xl text-blue-600 font-bold text-sm hover:shadow-md transition-all">
                    <FileDown size={18} /> {t.downloadTemplate}
                  </button>
                </div>
                <DataUpload onUploadSuccess={fetchAllData} />
              </div>
            )}

            {activeTab === 'history' && !isProvisional && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-700 text-gray-400 border-b dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-xs font-black uppercase">{t.file}</th>
                      <th className="px-6 py-4 text-xs font-black uppercase">{t.countries}</th>
                      <th className="px-6 py-4 text-xs font-black uppercase">{t.vaccines}</th>
                      <th className="px-6 py-4 text-xs font-black uppercase">{t.date}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {history.map(h => (
                      <tr key={h.id} className="dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900/50">
                        <td className="px-6 py-4 font-bold">{h.filename}</td>
                        <td className="px-6 py-4 text-xs">{h.countries}</td>
                        <td className="px-6 py-4 text-xs text-blue-500 font-bold">{h.vaccines || 'N/A'}</td>
                        <td className="px-6 py-4 text-xs text-gray-400">{new Date(h.upload_date).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'admin' && isAdmin && (
               <div className="space-y-4 max-w-4xl mx-auto">
                <h2 className="text-xl font-black dark:text-white flex items-center gap-2"><ShieldCheck className="text-blue-600"/> {t.admin}</h2>
                {pendingUsers.length === 0 ? <div className="p-20 border-2 border-dashed rounded-3xl text-gray-400 font-bold">{t.noPending}</div> : 
                  pendingUsers.map(u => (
                    <div key={u.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border dark:border-gray-700 flex items-center justify-between shadow-sm animate-in slide-in-from-right-4 duration-300">
                       <div className="flex items-center gap-4 text-left">
                        <div className="h-12 w-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-xl">{u.full_name ? u.full_name[0] : 'U'}</div>
                        <div><p className="font-black dark:text-white leading-none">{u.full_name || u.email}</p><p className="text-xs text-gray-500 mt-1">{u.company} • {u.country}</p></div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleReject(u.id, u.full_name || u.email)} className="px-4 py-2 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors">{t.reject}</button>
                        <button onClick={() => handleApprove(u.id, u.full_name || u.email, u.country)} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-colors">{t.approve}</button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border dark:border-gray-700 max-w-2xl mx-auto shadow-xl">
                <h2 className="text-2xl font-black dark:text-white mb-8 flex items-center gap-3"><Settings className="text-blue-600"/> {t.settings}</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                    <div className="text-left"><p className="font-bold dark:text-white">Mode Sombre</p><p className="text-xs text-gray-500">Interface de nuit</p></div>
                    <button onClick={() => setDarkMode(!darkMode)} className={`w-12 h-6 rounded-full relative transition-colors ${darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}><div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-6' : ''}`}></div></button>
                  </div>
                  <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                    <div className="text-left"><p className="font-bold dark:text-white">Langue</p><p className="text-xs text-gray-500">Choisir le langage</p></div>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-white dark:bg-gray-800 border-none font-bold rounded-lg text-sm dark:text-white focus:ring-0 cursor-pointer"><option value="fr">Français</option><option value="en">English</option></select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarLink({ active, onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
      <Icon size={20} /> <span className="font-bold">{label}</span>
    </button>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border dark:border-gray-700 shadow-sm border-b-4 border-b-blue-600 text-left">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
      <p className="text-3xl font-black mt-1 dark:text-white tracking-tighter">{value}</p>
    </div>
  );
}