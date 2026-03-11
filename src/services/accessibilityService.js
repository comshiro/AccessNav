/**
 * Accessibility Service
 * Handles fetching accessibility data from various sources
 * TODO: Replace mock data with actual API calls (Overpass API, backend, etc.)
 */

/**
 * Fetch nearby accessibility markers based on location
 * @param {Array} location - [latitude, longitude]
 * @param {Object} filters - Active filter states
 * @returns {Promise<Array>} Array of accessibility markers
 */
export async function fetchNearbyAccessibilityMarkers(location, filters = {}) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const [lat, lng] = location;

  // Mock data - In production, this would query:
  // 1. Backend API for community-verified accessibility reviews
  // 2. Overpass API for OSM accessibility tags (wheelchair=yes, etc.)
  // 3. Cached local data for offline support
  const allMarkers = [
    {
      id: 'marker-1',
      position: [lat + 0.002, lng + 0.002],
      type: 'wheelchair',
      title: 'Accessible Entrance',
      description: 'Wheelchair accessible entrance with automatic doors',
      rating: 4.5,
      reviewCount: 12,
      lastChecked: '2 days ago',
      osmId: 'node/123456789',
    },
    {
      id: 'marker-2',
      position: [lat - 0.003, lng + 0.001],
      type: 'elevators',
      title: 'Public Elevator',
      description: 'Working elevator to subway platform',
      rating: 4.0,
      reviewCount: 8,
      lastChecked: '1 week ago',
      osmId: 'node/234567890',
    },
    {
      id: 'marker-3',
      position: [lat + 0.001, lng - 0.002],
      type: 'restrooms',
      title: 'Accessible Restroom',
      description: 'Clean accessible restroom with grab bars',
      rating: 5.0,
      reviewCount: 24,
      lastChecked: 'Today',
      osmId: 'node/345678901',
    },
    {
      id: 'marker-4',
      position: [lat - 0.001, lng - 0.003],
      type: 'benches',
      title: 'Rest Area',
      description: 'Shaded bench area with back support',
      rating: 4.2,
      reviewCount: 6,
      lastChecked: '3 days ago',
      osmId: 'node/456789012',
    },
    {
      id: 'marker-5',
      position: [lat + 0.003, lng - 0.001],
      type: 'parking',
      title: 'Accessible Parking',
      description: 'Designated accessible parking spaces available',
      rating: 4.8,
      reviewCount: 15,
      lastChecked: 'Yesterday',
      osmId: 'node/567890123',
    },
    {
      id: 'marker-6',
      position: [lat - 0.002, lng + 0.003],
      type: 'ramps',
      title: 'Curb Ramp',
      description: 'Well-maintained curb ramp with good slope',
      rating: 4.7,
      reviewCount: 10,
      lastChecked: '5 days ago',
      osmId: 'node/678901234',
    },
  ];

  // Filter markers based on active filters
  // If no filters are active, show all markers
  const hasActiveFilters = Object.values(filters).some(value => value === true);
  
  if (!hasActiveFilters) {
    return allMarkers;
  }

  return allMarkers.filter(marker => filters[marker.type] === true);
}

/**
 * Fetch accessible route between two points
 * @param {Array} start - [latitude, longitude]
 * @param {Array} end - [latitude, longitude]
 * @param {Object} preferences - User accessibility preferences
 * @returns {Promise<Object>} Route data with waypoints
 */
export async function fetchAccessibleRoute(start, end, preferences = {}) {
  // TODO: Implement OSRM or GraphHopper routing with accessibility constraints
  await new Promise(resolve => setTimeout(resolve, 800));

  return {
    coordinates: [start, end],
    distance: 1.2, // km
    duration: 15, // minutes
    accessibilityScore: 4.5,
    warnings: [],
    waypoints: [],
  };
}

/**
 * Submit accessibility review for a location
 * @param {Object} review - Review data
 * @returns {Promise<Object>} Submitted review with ID
 */
export async function submitAccessibilityReview(review) {
  // TODO: POST to backend API
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    id: `review-${Date.now()}`,
    ...review,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Report accessibility issue
 * @param {Object} issue - Issue details
 * @returns {Promise<Object>} Submitted issue with ID
 */
export async function reportAccessibilityIssue(issue) {
  // TODO: POST to backend API
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    id: `issue-${Date.now()}`,
    ...issue,
    status: 'pending',
    timestamp: new Date().toISOString(),
  };
}
