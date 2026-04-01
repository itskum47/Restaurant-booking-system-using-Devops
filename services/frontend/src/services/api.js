import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  },
);

export const aiService = {
  processBooking: async (message, conversationHistory = [], location = null) => {
    const payload = {
      message,
      conversation_history: conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    };
    if (location) {
      payload.location = location;
    }
    const response = await api.post('/v1/ai/booking', payload);
    return response.data;
  },

  searchLocations: async (query) => {
    const response = await api.get('/v1/ai/locations/search', { params: { q: query } });
    return response.data;
  },

  getRecommendations: async (params = {}) => {
    const response = await api.get('/v1/ai/recommendations', { params });
    return response.data;
  },
};

export const restaurantService = {
  getAllRestaurants: async (filters = {}) => {
    const response = await api.get('/v1/restaurants', { params: filters });
    return response.data;
  },

  getRestaurant: async (id) => {
    const response = await api.get(`/v1/restaurants/${id}`);
    return response.data;
  },

  getAvailability: async (restaurantId, date) => {
    const response = await api.get(`/v1/restaurants/${restaurantId}/availability/${date}`);
    return response.data;
  },
};

export const bookingService = {
  createBooking: async (bookingData) => {
    const response = await api.post('/v1/bookings', bookingData);
    return response.data;
  },

  getBooking: async (id) => {
    const response = await api.get(`/v1/bookings/${id}`);
    return response.data;
  },

  getUserBookings: async (userId, status = null) => {
    const params = status ? { status } : {};
    const response = await api.get(`/v1/bookings/user/${userId}`, { params });
    return response.data;
  },

  cancelBooking: async (id, reason = 'user_requested') => {
    const response = await api.put(`/v1/bookings/${id}/cancel`, { reason });
    return response.data;
  },
};

export default api;
