import { useState, useEffect } from 'react';
import { restaurantService } from '../services/api';

function RestaurantList({ aiRecommendations, onRestaurantSelect }) {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    cuisine: '',
    city: '',
    rating: ''
  });

  useEffect(() => {
    // If AI recommendations are available, use them
    if (aiRecommendations && aiRecommendations.length > 0) {
      setRestaurants(aiRecommendations);
      setIsLoading(false);
    } else {
      // Otherwise, fetch all restaurants
      fetchRestaurants();
    }
  }, [aiRecommendations]);

  const fetchRestaurants = async () => {
    setIsLoading(true);
    try {
      const data = await restaurantService.getAllRestaurants(filters);
      setRestaurants(data.restaurants || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setRestaurants([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchRestaurants();
  };

  const cuisineOptions = ['Italian', 'Japanese', 'French', 'Mexican', 'Chinese', 'American', 'Indian', 'Thai', 'Korean', 'Mediterranean'];
  const cityOptions = ['Downtown', 'Uptown', 'Midtown'];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Filter Restaurants</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cuisine
            </label>
            <select
              value={filters.cuisine}
              onChange={(e) => handleFilterChange('cuisine', e.target.value)}
              className="input-field"
            >
              <option value="">All Cuisines</option>
              {cuisineOptions.map(cuisine => (
                <option key={cuisine} value={cuisine}>{cuisine}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              className="input-field"
            >
              <option value="">All Locations</option>
              {cityOptions.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Rating
            </label>
            <select
              value={filters.rating}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
              className="input-field"
            >
              <option value="">Any Rating</option>
              <option value="4.0">4.0+</option>
              <option value="4.5">4.5+</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleApplyFilters}
          className="btn-primary mt-4 w-full md:w-auto"
        >
          Apply Filters
        </button>
      </div>

      {/* Restaurant Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {aiRecommendations.length > 0 ? 'AI Recommendations' : 'Available Restaurants'}
          </h2>
          <span className="text-sm text-gray-500">
            {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''}
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="card animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 text-lg">No restaurants found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or use the AI assistant</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {restaurants.map((restaurant) => (
              <div key={restaurant.id} className="card cursor-pointer hover:scale-105 transition-transform">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {restaurant.name}
                  </h3>
                  <div className="flex items-center bg-yellow-100 px-2 py-1 rounded">
                    <span className="text-yellow-700 font-semibold text-sm">
                      ⭐ {restaurant.rating}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600 flex items-center">
                    <span className="mr-2">🍽️</span>
                    <span className="font-medium">{restaurant.cuisine}</span>
                  </p>
                  <p className="text-sm text-gray-600 flex items-center">
                    <span className="mr-2">📍</span>
                    <span>{restaurant.city} • {restaurant.address}</span>
                  </p>
                  <p className="text-sm text-gray-600 flex items-center">
                    <span className="mr-2">💰</span>
                    <span>{restaurant.price_range}</span>
                  </p>
                </div>

                {restaurant.available_slots && restaurant.available_slots.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Available times today:</p>
                    <div className="flex flex-wrap gap-2">
                      {restaurant.available_slots.slice(0, 6).map((slot, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                        >
                          {slot}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => onRestaurantSelect(restaurant)}
                  className="btn-primary w-full"
                >
                  Book Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RestaurantList;
