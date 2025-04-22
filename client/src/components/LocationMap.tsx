import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './leaflet-fixes.css';
import { useLanguage } from '@/hooks/useLanguage';
import L from 'leaflet';

// Fix Leaflet marker icon issue
// @ts-ignore - Leaflet has known issues with webpack/vite asset imports
delete L.Icon.Default.prototype._getIconUrl; 
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// We'll use the default Leaflet icon set up above for simplicity

type Location = {
  latitude: number;
  longitude: number;
  name?: string;
};

type LocationMapProps = {
  location: Location;
  places?: Array<Location & { name: string; description?: string; imageUrl?: string }>;
  zoom?: number;
  className?: string;
};

// Helper component to set the map view
function SetMapView({ location, zoom }: { location: Location; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView([location.latitude, location.longitude], zoom);
  }, [location, map, zoom]);
  
  return null;
}

export default function LocationMap({ location, places = [], zoom = 13, className = "h-64 w-full rounded-lg" }: LocationMapProps) {
  const { language } = useLanguage();
  
  const translations = {
    yourLocation: language === 'es' ? 'Tu ubicación' : 'Your location',
    clickToSeePhotos: language === 'es' ? 'Click para ver fotos' : 'Click to see photos'
  };

  return (
    <div className={className}>
      <MapContainer 
        center={[location.latitude, location.longitude]} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <SetMapView location={location} zoom={zoom} />
        
        {/* Main location marker */}
        <Marker 
          position={[location.latitude, location.longitude]} 
        >
          <Popup>{location.name || translations.yourLocation}</Popup>
        </Marker>
        
        {/* Additional places markers */}
        {places.map((place, index) => (
          <Marker
            key={index}
            position={[place.latitude, place.longitude]}
          >
            <Popup className="leaflet-popup-content-max-w-sm">
              <div className="max-w-xs">
                <div className="font-medium mb-1">{place.name}</div>
                {place.description && (
                  <p className="text-sm mb-2">{place.description}</p>
                )}
                {place.imageUrl && (
                  <img 
                    src={place.imageUrl} 
                    alt={place.name} 
                    className="w-full h-24 object-cover rounded" 
                  />
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}