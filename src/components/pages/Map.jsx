import React, { useState, useEffect } from 'react';
import MapView from '../MapView';
import { fetchNearbyAccessibilityMarkers } from '../../services/accessibilityService';
import './Map.css';

export default function Map() {
  const [activeFilters, setActiveFilters] = useState({
    wheelchair: false,
    elevators: false,
    restrooms: false,
    benches: false,
    parking: false,
    ramps: false,
  });

  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([40.7128, -74.006]); // Default NYC
  const [markers, setMarkers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Request user location on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = [position.coords.latitude, position.coords.longitude];
          setUserLocation(location);
          setMapCenter(location);
          loadMarkers(location, activeFilters);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Use default location if permission denied
          loadMarkers(mapCenter, activeFilters);
        }
      );
    } else {
      loadMarkers(mapCenter, activeFilters);
    }
  }, []);

  // Reload markers when filters change
  useEffect(() => {
    if (userLocation || mapCenter) {
      loadMarkers(userLocation || mapCenter, activeFilters);
    }
  }, [activeFilters]);

  const loadMarkers = async (location, filters) => {
    setIsLoading(true);
    try {
      const data = await fetchNearbyAccessibilityMarkers(location, filters);
      setMarkers(data);
    } catch (error) {
      console.error('Error loading markers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFilter = (filterName) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const handleLocationFound = (latlng) => {
    const location = [latlng.lat, latlng.lng];
    setUserLocation(location);
    setMapCenter(location);
    loadMarkers(location, activeFilters);
  };

  const filters = [
    { id: 'wheelchair', icon: '♿', label: 'Wheelchair Routes' },
    { id: 'elevators', icon: '🛗', label: 'Elevators' },
    { id: 'restrooms', icon: '🚻', label: 'Restrooms' },
    { id: 'benches', icon: '🪑', label: 'Benches' },
    { id: 'parking', icon: '🅿️', label: 'Accessible Parking' },
    { id: 'ramps', icon: '📐', label: 'Ramps' }
  ];

  return (
    <div className="map-page">
      <div className="map-header">
        <h1>Accessible Routes</h1>
        <p>Find and navigate paths that suit your needs</p>
      </div>

      <div className="filter-bar" role="toolbar" aria-label="Accessibility filters">
        <div className="filter-scroll">
          {filters.map(filter => (
            <button
              key={filter.id}
              className={`filter-btn ${activeFilters[filter.id] ? 'active' : ''}`}
              onClick={() => toggleFilter(filter.id)}
              aria-pressed={activeFilters[filter.id]}
              aria-label={`${filter.label} filter ${activeFilters[filter.id] ? 'active' : 'inactive'}`}
            >
              <span className="filter-icon" aria-hidden="true">{filter.icon}</span>
              <span className="filter-label">{filter.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="map-container" role="region" aria-label="Interactive map">
        <MapView
          center={mapCenter}
          zoom={15}
          markers={markers}
          filters={activeFilters}
          userLocation={userLocation}
          onLocationFound={handleLocationFound}
        />
        {isLoading && (
          <div className="map-loading" aria-live="polite">
            <div className="spinner" aria-hidden="true"></div>
            <span>Loading accessibility data...</span>
          </div>
        )}
      </div>

      <div className="map-actions">
        <button className="route-button primary" aria-label="Find accessible route">
          <svg className="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span>Find Accessible Route</span>
        </button>
        
        <button className="route-button secondary" aria-label="Get current location">
          <svg className="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>My Location</span>
        </button>
      </div>
    </div>
  );
}
