import React from 'react';

function GoogleMapsButton({ origin, destination, selectedHotels, selectedRestaurants }) {
    const generateGoogleMapsURL = () => {
      const base = "https://www.google.com/maps/dir/?api=1";
  
      // Combine hotels + restaurants into one array of waypoints
      const combinedWaypoints = [
        ...Object.values(selectedHotels),
        ...Object.values(selectedRestaurants || {}) // if null/undefined, handle safely
      ];
  
      // Map to lat,lng format
      const waypoints = combinedWaypoints
        .map(place => {
          const lat = typeof place.geometry.location.lat === 'function'
            ? place.geometry.location.lat()
            : place.geometry.location.lat;
          const lng = typeof place.geometry.location.lng === 'function'
            ? place.geometry.location.lng()
            : place.geometry.location.lng;
          return `${lat},${lng}`;
        })
        .join('|');
  
      const url = `${base}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&waypoints=${encodeURIComponent(waypoints)}&travelmode=driving`;
      return url;
    };
  
    return (
      <a
        href={generateGoogleMapsURL()}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block mt-4 text-center"
      >
        View Trip in Google Maps
      </a>
    );
  }
  

export default GoogleMapsButton;
