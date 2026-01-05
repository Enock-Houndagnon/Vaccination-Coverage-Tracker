import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapChart({ data, selectedCountry }) {
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    // Charger le fichier JSON que vous venez de trouver
    fetch('/wca_admbnda_adm2_ocha.json')
      .then(res => res.json())
      .then(json => {
        // On filtre pour n'afficher que le pays sélectionné dans le dashboard
        const countryFeatures = json.features.filter(f => 
          f.properties.admin0Name === selectedCountry
        );
        setGeoData({ ...json, features: countryFeatures });
      })
      .catch(err => console.error("Erreur de chargement du JSON:", err));
  }, [selectedCountry]);

  // Fonction pour définir la couleur de chaque département
  const getStyle = (feature) => {
    // On récupère le nom du département dans le fichier JSON
    const deptNameInGeo = feature.properties.admin2Name;
    
    // On cherche la ligne correspondante dans vos données importées
    const record = data.find(d => 
      d.location_name?.toLowerCase().trim() === deptNameInGeo?.toLowerCase().trim()
    );

    const rate = record ? record.coverage_rate : 0;

    return {
      fillColor: rate === 0 ? '#cbd5e1' : // Gris si pas de données
                 rate >= 80 ? '#16a34a' : // Vert
                 rate >= 60 ? '#f59e0b' : // Orange
                 rate >= 40 ? '#ea580c' : // Orange foncé
                              '#dc2626',  // Rouge
      weight: 1,
      opacity: 1,
      color: 'white', // Couleur des bordures entre départements
      fillOpacity: 0.7,
    };
  };

  return (
    <div className="h-[600px] w-full border rounded-xl overflow-hidden shadow-lg">
      <MapContainer center={[7.36, 12.35]} zoom={6} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {geoData && (
          <GeoJSON 
            key={selectedCountry} // Force le rafraîchissement au changement de pays
            data={geoData} 
            style={getStyle}
            onEachFeature={(feature, layer) => {
              layer.bindPopup(`
                <strong>Département : ${feature.properties.admin2Name}</strong><br/>
                Pays : ${feature.properties.admin0Name}
              `);
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}