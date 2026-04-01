import React, { useState } from 'react';
import { aiService } from '../../services/api';

function LocationSelector({ onLocationChange }) {
  const [city, setCity] = useState('Los Angeles');
  const [country, setCountry] = useState('United States');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fallback direct update
  const handleLocationChange = () => {
    onLocationChange({ city, country });
    setShowDropdown(false);
  };

  // Autocomplete support via AI service
  const handleSearch = async (e) => {
    const query = e.target.value;
    setCity(query);
    
    if (query.length > 2) {
      setIsSearching(true);
      setShowDropdown(true);
      try {
        const res = await aiService.searchLocations(query);
        if (res.locations) {
          setSearchResults(res.locations);
        }
      } catch (err) {
        console.error('Location search error:', err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setShowDropdown(false);
      setSearchResults([]);
    }
  };

  const handleSelectLocation = (loc) => {
    // If loc has city/country parsed
    if (loc.city && loc.country) {
      setCity(loc.city);
      setCountry(loc.country);
      onLocationChange({ city: loc.city, country: loc.country, place_id: loc.place_id });
    } else {
      // Fallback if the API just returned text components
      const parts = loc.description.split(', ');
      const newCity = parts[0] || city;
      const newCountry = parts[parts.length - 1] || country;
      setCity(newCity);
      setCountry(newCountry);
      onLocationChange({ city: newCity, country: newCountry, place_id: loc.place_id });
    }
    setShowDropdown(false);
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      setIsSearching(true);
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        // In a real app we would reverse geocode this. For now we just pass lat/long 
        // down and let the backend resolve to nearby cities if needed
        onLocationChange({
          latitude,
          longitude
        });
        setIsSearching(false);
      }, (err) => {
        console.error(err);
        setIsSearching(false);
      });
    }
  };

  return (
    <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4 shadow-sm relative">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center">
          <span className="mr-2">📍</span> Where are you dining?
        </h3>
        <button 
          onClick={handleUseMyLocation}
          className="text-xs text-primary-600 hover:text-primary-800 flex items-center"
          disabled={isSearching}
        >
          {isSearching ? '⏳ Finding...' : 'Use My Location'}
        </button>
      </div>
      
      <div className="flex gap-2 relative">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search city..."
            value={city}
            onChange={handleSearch}
            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          />
          
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
              {searchResults.map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectLocation(loc)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-0"
                >
                  {loc.description}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <input
          type="text"
          placeholder="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-1/3 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
        />
        
        <button 
          onClick={handleLocationChange}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition duration-150 ease-in-out"
        >
          Set
        </button>
      </div>
      
      <div className="mt-3 text-xs text-center text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
        Concierge active for: <strong className="text-gray-700">{city}, {country}</strong>
      </div>
    </div>
  );
}

export default LocationSelector;
