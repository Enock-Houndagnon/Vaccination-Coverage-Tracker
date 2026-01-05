import React, { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function DataUpload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus('idle');
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    setStatus('uploading');
    try {
      const response = await axios.post('https://vaccination-coverage-tracker-backend.onrender.com/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus('success');
      setMessage(`Succès : ${response.data.message}`);
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.error || "Erreur lors de l'envoi");
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto mt-10">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          {status === 'success' ? <CheckCircle className="h-16 w-16 text-green-500" /> : 
           status === 'error' ? <AlertCircle className="h-16 w-16 text-red-500" /> : 
           <div className="p-4 bg-blue-50 rounded-full"><Upload className="h-10 w-10 text-blue-600" /></div>}
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Importer des données CSV</h2>
        <div className="flex flex-col items-center space-y-4">
          <label className="w-full flex flex-col items-center px-4 py-6 bg-gray-50 text-blue-700 rounded-lg border-2 border-dashed border-blue-200 cursor-pointer hover:bg-blue-100">
            <FileText className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">{file ? file.name : "Choisir un fichier .csv"}</span>
            <input type='file' className="hidden" onChange={handleFileChange} accept=".csv" />
          </label>
          {file && status !== 'uploading' && (
            <button onClick={handleUpload} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">
              Lancer l'importation vers PostgreSQL
            </button>
          )}
          {status === 'uploading' && <div className="flex items-center text-blue-600"><Loader2 className="animate-spin mr-2" /> Analyse et injection...</div>}
          {message && <p className={`mt-4 text-sm ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
        </div>
      </div>
    </div>
  );
}