import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapChart({ data, selectedCountry }) {
  // Coordonnées par défaut (Centre du Cameroun)
  const position = [7.3697, 12.3547]; 

  // Simulation de coordonnées pour les départements (pour l'exemple)
  // Dans un vrai projet, ces coordonnées viennent d'un fichier GeoJSON
  const getCoords = (name) => {
    const coords = {
      'Mfoundi': [3.8480, 11.5021],
      'Wouri': [4.0511, 9.7679],
      'Diamaré': [10.5913, 14.3159],
      'Fako': [4.1620, 9.2314],
      'Mezam': [5.9631, 10.1591]
    };
    return coords[name] || [7.3697 + (Math.random() - 0.5), 12.3547 + (Math.random() - 0.5)];
  };

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-inner border dark:border-gray-700">
      <MapContainer center={position} zoom={6} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {data.map((d, idx) => (
          <CircleMarker 
            key={idx}
            center={getCoords(d.location_name)}
            radius={d.coverage_rate / 10}
            fillColor={d.coverage_rate > 80 ? '#22c55e' : d.coverage_rate > 50 ? '#f59e0b' : '#ef4444'}
            color="white"
            weight={1}
            fillOpacity={0.7}
          >
            <Popup>
              <div className="font-sans">
                <h4 className="font-bold text-blue-600">{d.location_name}</h4>
                <p>Vaccine: <b>{d.vaccine_type}</b></p>
                <p>Coverage: <b>{d.coverage_rate}%</b></p>
              </div>
            </Popup>
            <Tooltip>{d.location_name}: {d.coverage_rate}%</Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}