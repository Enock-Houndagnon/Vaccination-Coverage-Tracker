import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AgeGroupChart({ data }) {
  const processed = data.reduce((acc, curr) => {
    const group = curr.age_group || 'Unknown';
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(processed).map(key => ({ name: key, count: processed[key] }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={chartData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}