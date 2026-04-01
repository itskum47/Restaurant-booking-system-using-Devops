import os
import httpx
from typing import Dict, List, Any, Optional
import structlog

logger = structlog.get_logger(__name__)

class PlacesService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_MAPS_API_KEY", "")
        self.base_url = "https://maps.googleapis.com/maps/api"
        self.enabled = bool(self.api_key and self.api_key != "mock")

    async def search_locations(self, query: str) -> List[Dict[str, str]]:
        """Search for locations using Google Places Autocomplete API"""
        if not self.enabled:
            # Return some mock locations for testing if no API key
            return [
                {"description": f"{query}, Mock City", "place_id": "mock_id_1"},
                {"description": f"{query}town, Mock State", "place_id": "mock_id_2"}
            ]

        try:
            url = f"{self.base_url}/place/autocomplete/json"
            params = {
                "input": query,
                "types": "(cities)",
                "key": self.api_key
            }
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                data = response.json()
                
                locations = []
                for prediction in data.get('predictions', [])[:5]:
                    locations.append({
                        'description': prediction['description'],
                        'place_id': prediction['place_id']
                    })
                return locations
        except Exception as e:
            logger.error(f"Error searching locations: {e}")
            return []

    async def geocode_location(self, city: str, country: str) -> Optional[Dict[str, Any]]:
        """Geocode a city and country to get coordinates"""
        if not self.enabled:
            return {
                "city": city,
                "country": country,
                "latitude": 34.0522,
                "longitude": -118.2437,
                "formatted_address": f"{city}, {country}"
            }

        try:
            url = f"{self.base_url}/geocode/json"
            params = {
                "address": f"{city}, {country}",
                "key": self.api_key
            }
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                data = response.json()
                
                if data['results']:
                    loc = data['results'][0]
                    return {
                        "city": city,
                        "country": country,
                        "latitude": loc['geometry']['location']['lat'],
                        "longitude": loc['geometry']['location']['lng'],
                        "formatted_address": loc['formatted_address']
                    }
                return None
        except Exception as e:
            logger.error(f"Error geocoding location: {e}")
            return None

    async def search_restaurants(self, location_details: Dict[str, Any], query: str = "", cuisine: str = "") -> List[Dict[str, Any]]:
        """Search for restaurants near a location"""
        if not self.enabled:
            # Fallback to internal mock service in booking routing
            return []

        try:
            url = f"{self.base_url}/place/nearbysearch/json"
            search_query = f"{cuisine} {query} restaurant".strip()
            
            params = {
                "location": f"{location_details['latitude']},{location_details['longitude']}",
                "radius": 5000,
                "type": "restaurant",
                "keyword": search_query,
                "key": self.api_key
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                data = response.json()
                
                restaurants = []
                for place in data.get('results', [])[:5]:
                    restaurants.append({
                        "id": place['place_id'],
                        "name": place['name'],
                        "cuisine": cuisine if cuisine else "Varied",
                        "city": location_details['city'],
                        "address": place.get('vicinity', ''),
                        "rating": place.get('rating', 0.0),
                        "price_range": "$" * place.get('price_level', 2),
                        "types": place.get('types', []),
                        "open_now": place.get('opening_hours', {}).get('open_now', False)
                    })
                return restaurants
        except Exception as e:
            logger.error(f"Error searching restaurants: {e}")
            return []

places_service = PlacesService()
