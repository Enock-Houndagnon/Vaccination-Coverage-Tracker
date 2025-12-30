import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Activity, Database, LayoutDashboard, UploadCloud, 
  Search, Moon, Sun, FileDown, Map as MapIcon, History, Globe, Settings, Filter
} from 'lucide-react';
import AgeGroupChart from './AgeGroupChart';
import TimeSeriesChart from './TimeSeriesChart';
import DataUpload from './DataUpload';
import MapChart from './MapChart'; 

export default function Dashboard() {
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [activeTab, setActiveTab] = useState('analytics');
  const [darkMode, setDarkMode] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchData();
    fetchHistory();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/vaccination');
      setAllData(response.data);
      setFilteredData(response.data);
    } catch (error) { console.error('Erreur API:', error); }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/history');
      setHistory(response.data);
    } catch (error) { console.error('Erreur History:', error); }
  };

  useEffect(() => {
    let results = allData;
    if (selectedCountry !== 'all') results = results.filter(d => d.country === selectedCountry);
    if (selectedLocation !== 'all') results = results.filter(d => d.location_name === selectedLocation);
    if (searchTerm) results = results.filter(d => d.vaccine_type?.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredData(results);
  }, [searchTerm, selectedCountry, selectedLocation, allData]);

  const countries = Array.from(new Set(allData.map(d => d.country)));
  const locations = Array.from(new Set(
    allData
      .filter(d => selectedCountry === 'all' || d.country === selectedCountry)
      .map(d => d.location_name)
  ));

  const SidebarItem = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => setActiveTab(id)} 
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all mb-1 ${
        activeTab === id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        
        {/* SIDEBAR (Masquée à l'impression) */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 fixed h-full z-50 print:hidden">
          <div className="p-6 flex items-center space-x-3">
            <Activity className="text-blue-600" size={28} />
            <h1 className="text-xl font-bold dark:text-white">VaxTracker Pro</h1>
          </div>
          <nav className="px-4 mt-4">
            <SidebarItem id="analytics" icon={LayoutDashboard} label="Analyses" />
            <SidebarItem id="map" icon={MapIcon} label="Carte Géo" />
            <SidebarItem id="upload" icon={UploadCloud} label="Importation" />
            <SidebarItem id="history" icon={History} label="Historique" />
            <SidebarItem id="settings" icon={Settings} label="Paramètres" />
          </nav>
        </aside>

        <main className="flex-1 ml-64 print:ml-0">
          
          {/* HEADER (Masqué à l'impression) */}
          <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 h-20 flex items-center px-8 sticky top-0 z-40 gap-4 print:hidden">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Chercher vaccin..." 
                className="w-full bg-gray-100 dark:bg-gray-700 border-none rounded-lg py-2 pl-10 text-sm dark:text-white"
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>

            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3">
              <Globe size={16} className="text-gray-400 mr-2" />
              <select 
                value={selectedCountry} 
                onChange={(e) => {setSelectedCountry(e.target.value); setSelectedLocation('all');}}
                className="bg-transparent border-none py-2 text-sm dark:text-white focus:ring-0 cursor-pointer"
              >
                <option value="all">Tous les Pays</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3">
              <Filter size={16} className="text-gray-400 mr-2" />
              <select 
                value={selectedLocation} 
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-transparent border-none py-2 text-sm dark:text-white focus:ring-0 cursor-pointer"
              >
                <option value="all">Toutes Régions / Dépt</option>
                {locations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="flex items-center space-x-2 ml-auto">
              {/* BOUTON EXPORTATION RÉTABLI */}
              <button 
                onClick={() => window.print()} 
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold shadow-lg shadow-blue-500/20"
              >
                <FileDown size={18} className="mr-2" /> Exporter Rapport
              </button>

              <button onClick={() => setDarkMode(!darkMode)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-yellow-400">
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </header>

          <div className="p-8">
            {activeTab === 'analytics' && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <StatCard title="Total Vaccinations" value={filteredData.length.toLocaleString()} />
                  <StatCard title="Taux de Couverture" value={`${(filteredData.reduce((acc, c) => acc + (c.coverage_rate || 0), 0) / (filteredData.length || 1)).toFixed(1)}%`} />
                  <StatCard title="Types de Vaccins" value={new Set(filteredData.map(d => d.vaccine_type)).size} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                    <h3 className="dark:text-white font-bold mb-6">Répartition par Âge</h3>
                    <AgeGroupChart data={filteredData} />
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                    <h3 className="dark:text-white font-bold mb-6">Évolution Temporelle</h3>
                    <TimeSeriesChart data={filteredData} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'map' && (
              <div className="animate-in fade-in duration-500">
                <h2 className="text-2xl font-bold mb-6 dark:text-white">Distribution Géographique</h2>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border dark:border-gray-700 shadow-sm">
                  <MapChart data={filteredData} />
                </div>
              </div>
            )}

            {activeTab === 'upload' && <DataUpload onUploadSuccess={() => {fetchData(); fetchHistory();}} />}
            {activeTab === 'history' && <HistoryTable data={history} />}
            
            {activeTab === 'settings' && (
              <div className="p-12 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
                <Settings size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-bold dark:text-white">Configuration Système</h3>
                <p className="text-gray-500 mt-2">Gérez ici vos connexions PostgreSQL et les accès utilisateurs.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm">
      <p className="text-xs font-bold text-gray-400 uppercase">{title}</p>
      <p className="text-3xl font-black mt-2 dark:text-white">{value}</p>
    </div>
  );
}

function HistoryTable({ data }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Fichier</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Pays concernés</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Vaccins</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Lignes</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y dark:divide-gray-700">
          {data.map((log) => (
            <tr key={log.id} className="dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
              <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-200">{log.filename}</td>
              
              {/* Affichage des Pays sous forme de badges */}
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                  {log.countries?.split(', ').map((c, i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-[10px] font-medium border border-blue-100 dark:border-blue-800">
                      {c}
                    </span>
                  ))}
                </div>
              </td>

              {/* Affichage des Vaccins sous forme de badges */}
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                  {log.vaccines?.split(', ').map((v, i) => (
                    <span key={i} className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded text-[10px] font-medium border border-purple-100 dark:border-purple-800">
                      {v}
                    </span>
                  ))}
                </div>
              </td>

              <td className="px-6 py-4 text-blue-600 font-black">{log.rows_imported.toLocaleString()}</td>
              <td className="px-6 py-4 text-xs text-gray-400">{new Date(log.upload_date).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}