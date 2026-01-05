import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const ageTranslations = {
  fr: {
    title: "Volume par Âge",
    desc: "Répartition des vaccinations par catégorie démographique.",
    groups: {
      "0-11 months": "0-11 mois",
      "1-4 years": "1-4 ans",
      "5-9 years": "5-9 ans",
      "10-14 years": "10-14 ans",
      "15+ years": "15 ans +",
      "Unknown": "Inconnu"
    }
  },
  en: {
    title: "Volume by Age",
    desc: "Distribution of vaccinations by demographic category.",
    groups: {
      "0-11 months": "0-11 months",
      "1-4 years": "1-4 years",
      "5-9 years": "5-9 years",
      "10-14 years": "10-14 years",
      "15+ years": "15+ years",
      "Unknown": "Unknown"
    }
  }
};

export default function AgeGroupChart({ data, language = 'fr' }) {
  const t = ageTranslations[language];
  const AGE_ORDER = ["0-11 months", "1-4 years", "5-9 years", "10-14 years", "15+ years"];

  const processed = data.reduce((acc, curr) => {
    const group = curr.age_group || 'Unknown';
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(processed)
    .map(key => ({ 
      originalName: key,
      name: t.groups[key] || key, // Traduction ici
      count: processed[key] 
    }))
    .sort((a, b) => AGE_ORDER.indexOf(a.originalName) - AGE_ORDER.indexOf(b.originalName));

  return (
    <div className="h-80 w-full flex flex-col">
      <div className="mb-4 text-left">
        <h4 className="font-black text-gray-400 uppercase text-[10px] tracking-widest">{t.title}</h4>
        <p className="text-xs text-gray-500">{t.desc}</p>
      </div>
      <div className="flex-1">
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} style={{fontSize: '10px', fontWeight: 'bold'}} />
            <YAxis axisLine={false} tickLine={false} style={{fontSize: '10px'}} />
            <Tooltip 
               cursor={{fill: '#f8fafc'}} 
               contentStyle={{borderRadius: '15px', border:'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}