import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// Fix for default marker icons in Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom accessible location icons
const createAccessibleIcon = (type, color) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `
      <div class="marker-pin" style="background-color: ${color};">
        <i class="marker-icon" aria-label="${type}"></i>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42],
  });
};

// Component to handle map events and user location
function MapController({ center, onLocationFound, userLocation }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);

  useMapEvents({
    locationfound(e) {
      if (onLocationFound) {
        onLocationFound(e.latlng);
      }
    },
  });

  useEffect(() => {
    if (userLocation) {
      map.setView(userLocation, 16);
    }
  }, [userLocation, map]);

  return null;
}

/**
 * MapView - Accessible map component using OpenStreetMap + Leaflet
 * 
 * @param {Object} props
 * @param {Array} props.center - [latitude, longitude] for map center
 * @param {number} props.zoom - Zoom level (default: 13)
 * @param {Array} props.markers - Array of marker objects { position: [lat, lng], type: 'wheelchair'|'elevator'|'restroom'|'bench'|'parking'|'ramp', title: string, description: string }
 * @param {Object} props.filters - Active filter states { wheelchair: bool, elevators: bool, restrooms: bool, benches: bool, parking: bool, ramps: bool }
 * @param {Function} props.onLocationFound - Callback when user location is found
 * @param {Array} props.userLocation - User's current location [lat, lng]
 */
export default function MapView({
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 13,
  markers = [],
  filters = {},
  onLocationFound,
  userLocation,
}) {
  const mapRef = useRef(null);
  const [isLocating, setIsLocating] = useState(false);

  // Filter markers based on active filters
  const filteredMarkers = markers.filter(marker => {
    if (!marker.type) return true;
    return filters[marker.type] !== false;
  });

  // Icon colors for different accessibility features
  const iconColors = {
    wheelchair: '#4285F4',
    elevators: '#34A853',
    restrooms: '#FBBC04',
    benches: '#EA4335',
    parking: '#9C27B0',
    ramps: '#00BCD4',
  };

  const handleLocateUser = () => {
    setIsLocating(true);
    if (mapRef.current) {
      mapRef.current.locate({ setView: true, maxZoom: 16 });
    }
    setTimeout(() => setIsLocating(false), 2000);
  };

  return (
    <div className="map-view-container" role="application" aria-label="Accessible navigation map">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        zoomControl={true}
        attributionControl={true}
      >
        {/* OpenStreetMap tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Map controller for events */}
        <MapController
          center={center}
          onLocationFound={onLocationFound}
          userLocation={userLocation}
        />

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={L.divIcon({
              className: 'user-location-marker',
              html: `
                <div class="user-location-dot" role="img" aria-label="Your current location">
                  <div class="pulse-ring"></div>
                </div>
              `,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })}
          >
            <Popup>
              <strong>Your Location</strong>
            </Popup>
          </Marker>
        )}

        {/* Accessibility markers */}
        {filteredMarkers.map((marker, index) => (
          <Marker
            key={`marker-${index}`}
            position={marker.position}
            icon={createAccessibleIcon(marker.type, iconColors[marker.type] || '#4285F4')}
            eventHandlers={{
              click: () => {
                // Announce to screen readers
                const announcement = `Selected ${marker.type}: ${marker.title}`;
                const liveRegion = document.getElementById('map-announcer');
                if (liveRegion) {
                  liveRegion.textContent = announcement;
                }
              },
            }}
          >
            <Popup>
              <div className="marker-popup">
                <h3>{marker.title}</h3>
                {marker.description && <p>{marker.description}</p>}
                {marker.rating && (
                  <div className="rating" aria-label={`Rating: ${marker.rating} out of 5 stars`}>
                    {'★'.repeat(Math.floor(marker.rating))}
                    {'☆'.repeat(5 - Math.floor(marker.rating))}
                    <span className="rating-text">({marker.rating}/5)</span>
                  </div>
                )}
                {marker.lastChecked && (
                  <p className="last-checked">
                    <small>Last checked: {marker.lastChecked}</small>
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Locate me button */}
      <button
        className={`locate-button ${isLocating ? 'locating' : ''}`}
        onClick={handleLocateUser}
        aria-label="Center map on my location"
        title="Find my location"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      {/* Screen reader announcements */}
      <div
        id="map-announcer"
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
    </div>
  );
}
