const express = require('express');

const router = express.Router();

const DEFAULT_API_URL = 'https://integrate.api.nvidia.com/v1';
const DEFAULT_MODEL = 'deepseek-ai/deepseek-v3.1';
const DEFAULT_RESTAURANT_SERVICE_URL = 'http://restaurant-service:3001';
const FOURSQUARE_API_URL = 'https://places-api.foursquare.com/places/search';
const FOURSQUARE_API_VERSION = '2025-06-17';

function extractLocationFromQuery(query) {
  const raw = String(query || '').trim();
  if (!raw) return '';

  const explicitMatch = raw.match(/\b(?:in|at|near)\s+([a-z\s.-]+)/i);
  if (explicitMatch?.[1]) {
    return explicitMatch[1].replace(/[^a-z\s.-]/gi, '').trim();
  }

  const spotsMatch = raw.match(/\b(?:restaurants?|places?|spots?)\s+(?:in|at|near)\s+([a-z\s.-]+)/i);
  if (spotsMatch?.[1]) {
    return spotsMatch[1].replace(/[^a-z\s.-]/gi, '').trim();
  }

  return raw;
}

function extractCuisineFromQuery(query) {
  const q = String(query || '').toLowerCase();
  const cuisines = [
    'sushi', 'ramen', 'japanese', 'chinese', 'indian', 'italian', 'korean', 'thai',
    'seafood', 'pizza', 'pasta', 'french', 'mexican', 'burger',
  ];

  return cuisines.find((term) => q.includes(term)) || '';
}

function filterByCuisineIntent(restaurants, cuisineQuery, minPreferredCount = 3) {
  if (!cuisineQuery) return restaurants;

  const aliases = {
    ramen: ['ramen', 'noodle', 'japanese'],
    sushi: ['sushi', 'japanese'],
    pasta: ['pasta', 'italian'],
    pizza: ['pizza', 'italian'],
  };

  const terms = aliases[cuisineQuery] || [cuisineQuery];

  const filtered = restaurants.filter((r) => {
    const text = `${r.name || ''} ${r.cuisine || ''} ${r.address || ''}`.toLowerCase();
    return terms.some((term) => text.includes(term));
  });

  if (filtered.length >= minPreferredCount) {
    return filtered;
  }

  // Keep cuisine-matched items first, then backfill from the same location results
  // so users still see enough cards when provider metadata is sparse.
  const seen = new Set(filtered.map((r) => r.id));
  const merged = [...filtered];
  restaurants.forEach((r) => {
    if (!r?.id || seen.has(r.id)) return;
    merged.push(r);
    seen.add(r.id);
  });

  return merged;
}

function filterRestaurantLikePlaces(restaurants) {
  const blockedTypes = ['bar', 'pub', 'nightclub'];
  const filtered = restaurants.filter((r) => {
    const cuisine = String(r.cuisine || '').toLowerCase();
    return !blockedTypes.some((type) => cuisine.includes(type));
  });

  return filtered.length > 0 ? filtered : restaurants;
}

function toTitleCase(value) {
  if (!value) return '';
  return String(value)
    .split(/[_\s,]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'restaurant-booking-system/1.0 (dev use)',
    },
  });

  const data = await response.json();
  return { response, data };
}

function mapPlacesToRestaurants(items) {
  return items.map((item, index) => {
    const address = item.address || {};
    const displayName = String(item.display_name || '').split(',')[0]?.trim() || `Restaurant ${index + 1}`;
    const cuisineRaw = item.extratags?.cuisine || item.type || 'restaurant';

    return {
      id: `${item.osm_type || 'osm'}-${item.osm_id || index}`,
      name: displayName,
      cuisine: toTitleCase(cuisineRaw),
      city: address.city || address.town || address.village || address.county || address.state || 'Unknown',
      address: item.display_name || '',
      rating: 4.3,
      price_range: '$$',
      source: 'osm',
      lat: item.lat,
      lon: item.lon,
    };
  });
}

function mapFoursquarePlacesToRestaurants(items) {
  return items.map((item, index) => {
    const location = item.location || {};
    const categories = Array.isArray(item.categories) ? item.categories : [];
    const cuisineRaw = categories[0]?.short_name || categories[0]?.name || 'Restaurant';
    const latitude = item.latitude ?? item.geocodes?.main?.latitude ?? null;
    const longitude = item.longitude ?? item.geocodes?.main?.longitude ?? null;

    return {
      id: item.fsq_place_id || item.fsq_id || `fsq-${index}`,
      name: item.name || `Restaurant ${index + 1}`,
      cuisine: toTitleCase(cuisineRaw),
      city: location.locality || location.region || location.country || 'Unknown',
      address: location.formatted_address || '',
      rating: 4.4,
      price_range: '$$',
      source: 'foursquare',
      lat: latitude,
      lon: longitude,
    };
  });
}

router.get('/restaurants', async (req, res) => {
  try {
    const restaurantServiceUrl = process.env.RESTAURANT_SERVICE_URL || DEFAULT_RESTAURANT_SERVICE_URL;
    const params = new URLSearchParams();

    ['cuisine', 'city', 'rating', 'price_range'].forEach((key) => {
      if (req.query[key]) {
        params.append(key, String(req.query[key]));
      }
    });

    const url = `${restaurantServiceUrl}/api/v1/restaurants${params.toString() ? `?${params.toString()}` : ''}`;
    const upstream = await fetch(url);
    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: 'Restaurant service error',
        details: data,
      });
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({
      error: 'Restaurant proxy failed',
      message: error.message,
    });
  }
});

router.get('/places/restaurants', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const locationQuery = extractLocationFromQuery(q) || q;
    const cuisineQuery = extractCuisineFromQuery(q);
    const limit = Math.min(15, Math.max(1, Number.parseInt(String(req.query.limit || '8'), 10) || 8));
    const foursquareApiKey = process.env.FOURSQUARE_API_KEY;

    if (!q) {
      return res.status(400).json({ error: 'q is required' });
    }

    // Foursquare-first global search.
    if (foursquareApiKey) {
      const fsqParams = new URLSearchParams({
        query: cuisineQuery ? `${cuisineQuery} restaurant` : 'restaurant',
        near: locationQuery,
        limit: String(limit),
        sort: 'RELEVANCE',
      });

      const fsqUrl = `${FOURSQUARE_API_URL}?${fsqParams.toString()}`;
      const fsqResp = await fetch(fsqUrl, {
        headers: {
          Authorization: `Bearer ${foursquareApiKey}`,
          Accept: 'application/json',
          'X-Places-Api-Version': FOURSQUARE_API_VERSION,
        },
      });

      if (fsqResp.ok) {
        const fsqData = await fsqResp.json();
        const fsqResults = Array.isArray(fsqData.results) ? fsqData.results : [];
        const restaurants = filterByCuisineIntent(
          filterRestaurantLikePlaces(mapFoursquarePlacesToRestaurants(fsqResults)),
          cuisineQuery
        );

        if (restaurants.length > 0) {
          return res.json({
            restaurants,
            count: restaurants.length,
            source: 'foursquare',
            query: q,
          });
        }
      }
    }

    // Step 1: geocode the place query so we can constrain search to that location.
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&q=${encodeURIComponent(locationQuery)}`;
    const { response: geocodeResp, data: geocodeData } = await fetchJson(geocodeUrl);

    if (!geocodeResp.ok) {
      return res.status(geocodeResp.status).json({
        error: 'Places geocode upstream error',
        details: geocodeData,
      });
    }

    const place = Array.isArray(geocodeData) && geocodeData.length > 0 ? geocodeData[0] : null;

    let restaurants = [];
    let centerLat = Number.NaN;
    let centerLon = Number.NaN;
    let countryCode = '';

    if (place) {
      const bbox = Array.isArray(place.boundingbox) ? place.boundingbox : null;
      countryCode = place.address?.country_code || '';
      centerLat = Number.parseFloat(String(place.lat || ''));
      centerLon = Number.parseFloat(String(place.lon || ''));

      const boundedParams = new URLSearchParams({
        format: 'jsonv2',
        addressdetails: '1',
        extratags: '1',
        limit: String(limit),
        q: cuisineQuery ? `${cuisineQuery} restaurant` : 'restaurant',
      });

      if (countryCode) {
        boundedParams.set('countrycodes', countryCode);
      }

      if (Number.isFinite(centerLat) && Number.isFinite(centerLon)) {
        // Prefer a center-radius box over provider bbox, because some city bboxes
        // (e.g. Tokyo relation) span very large areas and return unrelated places.
        const delta = 0.18;
        const south = centerLat - delta;
        const north = centerLat + delta;
        const west = centerLon - delta;
        const east = centerLon + delta;
        boundedParams.set('viewbox', `${west},${north},${east},${south}`);
        boundedParams.set('bounded', '1');
      } else if (bbox && bbox.length === 4) {
        const south = bbox[0];
        const north = bbox[1];
        const west = bbox[2];
        const east = bbox[3];
        boundedParams.set('viewbox', `${west},${north},${east},${south}`);
        boundedParams.set('bounded', '1');
      }

      const boundedUrl = `https://nominatim.openstreetmap.org/search?${boundedParams.toString()}`;
      const { response: boundedResp, data: boundedData } = await fetchJson(boundedUrl);

      if (!boundedResp.ok) {
        return res.status(boundedResp.status).json({
          error: 'Places bounded search upstream error',
          details: boundedData,
        });
      }

      restaurants = filterByCuisineIntent(
        filterRestaurantLikePlaces(mapPlacesToRestaurants(Array.isArray(boundedData) ? boundedData : [])),
        cuisineQuery
      );

      // If strict local radius is too sparse, expand radius once and backfill.
      if (restaurants.length < Math.min(3, limit) && Number.isFinite(centerLat) && Number.isFinite(centerLon)) {
        const widerParams = new URLSearchParams({
          format: 'jsonv2',
          addressdetails: '1',
          extratags: '1',
          limit: String(limit),
          q: cuisineQuery ? `${cuisineQuery} restaurant` : 'restaurant',
        });

        if (countryCode) {
          widerParams.set('countrycodes', countryCode);
        }

        const widerDelta = 0.35;
        const south = centerLat - widerDelta;
        const north = centerLat + widerDelta;
        const west = centerLon - widerDelta;
        const east = centerLon + widerDelta;
        widerParams.set('viewbox', `${west},${north},${east},${south}`);
        widerParams.set('bounded', '1');

        const widerUrl = `https://nominatim.openstreetmap.org/search?${widerParams.toString()}`;
        const { response: widerResp, data: widerData } = await fetchJson(widerUrl);

        if (widerResp.ok) {
          const widerRestaurants = filterByCuisineIntent(
            filterRestaurantLikePlaces(mapPlacesToRestaurants(Array.isArray(widerData) ? widerData : [])),
            cuisineQuery
          );

          const seen = new Set(restaurants.map((r) => r.id));
          widerRestaurants.forEach((r) => {
            if (!seen.has(r.id) && restaurants.length < limit) {
              restaurants.push(r);
              seen.add(r.id);
            }
          });
        }
      }
    }

    // Step 2: fallback query if bounded search is too sparse.
    if (restaurants.length < Math.min(3, limit)) {
      const fallbackTerm = cuisineQuery ? `${cuisineQuery} restaurant in ${locationQuery}` : `restaurant in ${locationQuery}`;
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&extratags=1&limit=${limit}&q=${encodeURIComponent(fallbackTerm)}`;
      const { response: fallbackResp, data: fallbackData } = await fetchJson(fallbackUrl);

      if (fallbackResp.ok) {
        const fallbackRestaurants = filterByCuisineIntent(
          filterRestaurantLikePlaces(mapPlacesToRestaurants(Array.isArray(fallbackData) ? fallbackData : [])),
          cuisineQuery
        );
        const seen = new Set(restaurants.map((r) => r.id));
        fallbackRestaurants.forEach((r) => {
          if (!seen.has(r.id) && restaurants.length < limit) {
            restaurants.push(r);
            seen.add(r.id);
          }
        });
      }
    }

    // Step 3: final backfill from same location without cuisine constraint
    // so users still get enough real cards when cuisine tags are sparse.
    if (restaurants.length < Math.min(3, limit) && cuisineQuery) {
      const genericParams = new URLSearchParams({
        format: 'jsonv2',
        addressdetails: '1',
        extratags: '1',
        limit: String(limit),
        q: 'restaurant',
      });

      if (countryCode) {
        genericParams.set('countrycodes', countryCode);
      }

      if (Number.isFinite(centerLat) && Number.isFinite(centerLon)) {
        const genericDelta = 0.35;
        const south = centerLat - genericDelta;
        const north = centerLat + genericDelta;
        const west = centerLon - genericDelta;
        const east = centerLon + genericDelta;
        genericParams.set('viewbox', `${west},${north},${east},${south}`);
        genericParams.set('bounded', '1');
      }

      const genericUrl = `https://nominatim.openstreetmap.org/search?${genericParams.toString()}`;
      const { response: genericResp, data: genericData } = await fetchJson(genericUrl);

      if (genericResp.ok) {
        const genericRestaurants = filterRestaurantLikePlaces(
          mapPlacesToRestaurants(Array.isArray(genericData) ? genericData : [])
        );
        const seen = new Set(restaurants.map((r) => r.id));
        genericRestaurants.forEach((r) => {
          if (!seen.has(r.id) && restaurants.length < limit) {
            restaurants.push(r);
            seen.add(r.id);
          }
        });
      }
    }

    return res.json({
      restaurants,
      count: restaurants.length,
      source: 'openstreetmap',
      query: q,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Places proxy failed',
      message: error.message,
    });
  }
});

router.post('/llm/chat', async (req, res) => {
  try {
    const apiKey = process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY;
    const baseUrl = process.env.NVIDIA_API_URL || DEFAULT_API_URL;
    const model = process.env.NVIDIA_MODEL || DEFAULT_MODEL;

    if (!apiKey) {
      return res.status(500).json({
        error: 'LLM key not configured',
      });
    }

    const { messages, temperature = 0.2, top_p = 0.7, max_tokens = 1024 } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        top_p,
        max_tokens,
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: 'Upstream LLM error',
        details: data,
      });
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({
      error: 'LLM proxy failed',
      message: error.message,
    });
  }
});

module.exports = router;
