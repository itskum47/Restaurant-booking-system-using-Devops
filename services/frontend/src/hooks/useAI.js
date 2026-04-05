import { useState } from 'react';

function normalizeApiBase(rawBase) {
  const base = (rawBase || 'http://localhost:3000').replace(/\/+$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
}

const API_BASE = normalizeApiBase(import.meta.env.VITE_API_URL);
const GATEWAY_LLM_URL = `${API_BASE}/public/llm/chat`;
const PUBLIC_RESTAURANTS_URL = `${API_BASE}/public/restaurants`;
const GLOBAL_RESTAURANTS_URL = `${API_BASE}/public/places/restaurants`;
const LLM_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'deepseek-ai/deepseek-v3.1';
const parsedRecommendationLimit = Number(import.meta.env.VITE_RECOMMENDATION_LIMIT || 20);
const RECOMMENDATION_LIMIT = Number.isFinite(parsedRecommendationLimit) && parsedRecommendationLimit > 0
  ? Math.min(parsedRecommendationLimit, 20)
  : 20;

const COLOR_PALETTE = [
  ['#0d1a0d', '#1a2e1a'],
  ['#1a0a0a', '#2e1515'],
  ['#0a0a1a', '#15152e'],
  ['#1a1200', '#2e2000'],
  ['#100a1a', '#1e1530'],
  ['#1a0d08', '#2e1a10'],
];

function getTimeGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function hasDiningKeywords(query) {
  const q = String(query || '').toLowerCase();
  return [
    'restaurant', 'dinner', 'lunch', 'breakfast', 'food', 'eat', 'cuisine',
    'table', 'book', 'reserve', 'hungry', 'sushi', 'pizza', 'pasta', 'rice',
    'chinese', 'china', 'indian', 'italian', 'japanese', 'korean', 'french', 'thai', 'shrimp', 'prawn', 'seafood',
    'chicken', 'momos', 'biryani', 'kebab', 'chaat', 'dosa', 'idli', 'vada', 'pav', 'paratha', 'paneer',
    'mughlai', 'south indian', 'north indian', 'street food', 'craving', 'recommend', 'suggest',
  ].some((keyword) => q.includes(keyword));
}

function isStreetFoodQuery(query) {
  const q = String(query || '').toLowerCase();
  return [
    'chaat', 'street food', 'street-food', 'pani puri', 'golgappa', 'sev puri', 'dahi puri',
    'papdi chaat', 'bhel', 'vada pav', 'pav bhaji', 'misal pav', 'bhature', 'bhatura',
    'lassi', 'dhaba', 'snack', 'snacks', 'samosa', 'kachori', 'paratha', 'tikki',
  ].some((keyword) => q.includes(keyword));
}

function isStreetFoodRestaurant(restaurant) {
  const text = `${restaurant?.name || ''} ${restaurant?.cuisine || ''} ${restaurant?.tag || ''} ${restaurant?.description || ''}`.toLowerCase();
  const excludedChains = [
    'subway', 'kfc', 'mcdonald', 'burger king', 'domino', 'pizza hut', 'starbucks',
  ];
  if (excludedChains.some((chain) => text.includes(chain))) return false;

  return [
    'chaat', 'lassi', 'bhature', 'bhatura', 'pav', 'puri', 'golgappa',
    'pani puri', 'sev puri', 'papdi chaat', 'bhel', 'paratha', 'samosa', 'kachori',
    'dhaba', 'tikki', 'momos', 'chole bhature',
  ].some((keyword) => text.includes(keyword));
}

function matchesQueryIntent(restaurant, query) {
  const q = String(query || '').toLowerCase();
  const text = `${restaurant?.name || ''} ${restaurant?.cuisine || ''} ${restaurant?.tag || ''} ${restaurant?.description || ''}`.toLowerCase();
  const { cuisineTerms } = deriveQuerySignals(q);

  if (isStreetFoodQuery(q)) {
    return isStreetFoodRestaurant(restaurant);
  }

  if (cuisineTerms.some((term) => ['indian', 'south indian', 'north indian', 'mughlai', 'biryani', 'kebab'].includes(term))) {
    return [
      'indian', 'south indian', 'north indian', 'mughlai', 'biryani', 'kebab', 'thali', 'dhaba', 'chaat',
      'dosa', 'idli', 'vada', 'pav', 'paneer', 'paratha', 'chai', 'lassi', 'snack', 'snacks',
    ].some((keyword) => text.includes(keyword));
  }

  if (cuisineTerms.length > 0) {
    return cuisineTerms.some((term) => text.includes(term));
  }

  return true;
}

function isLocationOnlyQuery(query) {
  const q = String(query || '').toLowerCase().trim();
  const { locationTerm, cuisineTerms } = deriveQuerySignals(q);

  if (!locationTerm || cuisineTerms.length > 0) return false;

  const words = q.split(/\s+/).filter(Boolean);
  return words.length <= 3 && !hasDiningKeywords(q);
}

function isCravingWithoutLocationQuery(query) {
  const q = String(query || '').toLowerCase().trim();
  const { locationTerm, cuisineTerms } = deriveQuerySignals(q);
  if (locationTerm) return false;
  return cuisineTerms.length > 0 || isStreetFoodQuery(q);
}

function resolveConversationLocation(history, currentMessage) {
  const recentMessages = [...(Array.isArray(history) ? history : []), { role: 'user', text: currentMessage }];

  for (let index = recentMessages.length - 1; index >= 0; index -= 1) {
    const message = recentMessages[index];
    if (message?.role !== 'user') continue;

    const text = String(message.text || '');
    if (!isLocationOnlyQuery(text)) continue;

    const { locationTerm } = deriveQuerySignals(text);
    if (locationTerm) return locationTerm;
  }

  return '';
}

function resolveConversationCraving(history) {
  const recentMessages = Array.isArray(history) ? history : [];

  for (let index = recentMessages.length - 1; index >= 0; index -= 1) {
    const message = recentMessages[index];
    if (message?.role !== 'user') continue;

    const text = String(message.text || '').trim();
    if (!text) continue;

    if (isCravingWithoutLocationQuery(text)) return text;
    if (isLocationOnlyQuery(text)) continue;
  }

  return '';
}

function hadLocationNeededPrompt(history) {
  const lastAiMessage = [...(Array.isArray(history) ? history : [])].reverse().find((message) => message?.role === 'ai');
  return lastAiMessage?.sourceReason === 'fallback_location_needed' || lastAiMessage?.sourceReason === 'location_needed_for_craving';
}

function hadLocationClarification(history) {
  const lastAiMessage = [...(Array.isArray(history) ? history : [])].reverse().find((message) => message?.role === 'ai');
  return lastAiMessage?.sourceReason === 'fallback_location_clarification' || lastAiMessage?.sourceReason === 'location_clarification';
}

const CUISINE_EMOJI = {
  italian: '🍝',
  japanese: '🍣',
  french: '🥂',
  mexican: '🌮',
  chinese: '🥢',
  american: '🥩',
  indian: '🍛',
  mediterranean: '🫒',
  thai: '🍜',
  korean: '🌸',
};

let catalogCache = null;
let catalogCacheAt = 0;
const CACHE_TTL_MS = 3 * 60 * 1000;

function toCardRestaurant(restaurant, index) {
  const pair = COLOR_PALETTE[index % COLOR_PALETTE.length];
  const cuisineKey = String(restaurant.cuisine || '').toLowerCase();
  const rating = Number(restaurant.rating || 4.2);

  return {
    id: restaurant.id,
    name: restaurant.name,
    cuisine: restaurant.cuisine || 'Cuisine',
    price: (restaurant.address && restaurant.address.toLowerCase().includes('india') ? '₹' : '$').repeat(restaurant.price_range === '$' || restaurant.price_range === '₹' ? 1 : restaurant.price_range === '$$' || restaurant.price_range === '₹₹' ? 2 : restaurant.price_range === '$$$' || restaurant.price_range === '₹₹₹' ? 3 : restaurant.price_range === '$$$$' || restaurant.price_range === '₹₹₹₹' ? 4 : 2),
    rating,
    stars: Math.max(1, Math.min(3, Math.round(rating) - 2)),
    times: ['7:00', '8:00', '9:00'],
    color1: pair[0],
    color2: pair[1],
    emoji: CUISINE_EMOJI[cuisineKey] || '🍽️',
    tag: restaurant.city || 'Local Favorite',
    description: restaurant.address || '',
  };
}

async function getGlobalRestaurants(query) {
  const q = String(query || '').trim();
  if (!q) return [];

  try {
    const { locationTerm, cuisineTerms } = deriveQuerySignals(q);
    const queries = [];

    if (locationTerm && cuisineTerms.length > 0) {
      queries.push(`${cuisineTerms[0]} restaurants in ${locationTerm}`);
    }
    if (locationTerm) {
      queries.push(`restaurants in ${locationTerm}`);
    }
    queries.push(q);

    const seen = new Set();
    const collected = [];

    for (const candidateQuery of queries) {
      const response = await fetch(`${GLOBAL_RESTAURANTS_URL}?q=${encodeURIComponent(candidateQuery)}&limit=${RECOMMENDATION_LIMIT}`);
      if (!response.ok) continue;

      const data = await response.json();
      const rows = Array.isArray(data.restaurants) ? data.restaurants : [];

      rows.forEach((restaurant) => {
        if (!restaurant?.id || seen.has(restaurant.id)) return;
        seen.add(restaurant.id);
        collected.push(restaurant);
      });

      if (collected.length >= RECOMMENDATION_LIMIT) break;
    }

    return collected.slice(0, RECOMMENDATION_LIMIT).map((restaurant, index) => toCardRestaurant(restaurant, index + 20));
  } catch {
    return [];
  }
}

async function getLiveRestaurantCatalog() {
  const now = Date.now();
  if (catalogCache && now - catalogCacheAt < CACHE_TTL_MS) {
    return catalogCache;
  }

  try {
    const response = await fetch(PUBLIC_RESTAURANTS_URL);
    if (!response.ok) return [];

    const data = await response.json();
    const rows = Array.isArray(data.restaurants) ? data.restaurants : [];
    const catalog = rows.map((r, i) => toCardRestaurant(r, i));

    catalogCache = catalog;
    catalogCacheAt = now;
    return catalog;
  } catch {
    return [];
  }
}

function buildSystemPrompt(restaurants, globalCandidates = [], userQuery = '') {
  const list = restaurants
    .map((r, i) => `INDEX ${i}: ${r.name} (${r.cuisine}, ${r.price}, ${r.tag}, rating ${r.rating})`)
    .join('\n');

  const globalList = globalCandidates
    .slice(0, RECOMMENDATION_LIMIT)
    .map((r, i) => `G${i}: ${r.name} (${r.cuisine}, ${r.price}, ${r.tag}, rating ${r.rating})`)
    .join('\n');

  return `You are Maya, DINE.AI's dining concierge.
User query: ${userQuery}

PRIMARY catalog (local partners):
${list}

GLOBAL catalog (real worldwide places):
${globalList || 'none'}

Rules:
- Keep tone warm and concise.
- Never invent restaurants.
- If requested cuisine/location is unavailable in PRIMARY catalog, use GLOBAL catalog options.
- Return ONLY valid JSON, no markdown, no extra text.
- Use exactly this shape:
  {"message":"string","recommendation_indices":[0,1,2],"is_dining_request":true}
- recommendation_indices must contain only valid indices from the catalog.
- For dining or location queries, is_dining_request must be true.
- For non-dining small talk, recommendation_indices must be [].`;
}

function parseResponse(raw, query, restaurants, globalCandidates = []) {
  const payload = parseAssistantPayload(raw);
  const payloadText = sanitizeAssistantText(payload?.message);

  if (payload && Array.isArray(payload.recommendation_indices)) {
    const indices = payload.recommendation_indices
      .map((n) => Number.parseInt(String(n), 10))
      .filter((n) => Number.isInteger(n) && n >= 0 && n < restaurants.length);

    if (indices.length > 0) {
      const selected = indices.map((i) => restaurants[i]).filter(Boolean);
      const inferredFromText = inferRestaurantsByName(raw, restaurants);
      const merged = ensureMinimumRecommendations(query, restaurants, mergeRestaurants(selected, inferredFromText), globalCandidates);
      return {
        text: shouldUseDeterministicReply(payloadText, merged.length) ? buildDeterministicDiningReply(query, merged) : payloadText,
        restaurants: merged,
        source: 'ai',
        sourceReason: 'json_indices',
      };
    }

    if (payload.is_dining_request === false) {
      if (isDiningRequest(query)) {
        const selected = ensureMinimumRecommendations(query, restaurants, [], globalCandidates);
        return {
          text: buildDeterministicDiningReply(query, selected),
          restaurants: selected,
          source: 'ai',
          sourceReason: 'ai_non_dining_overridden',
        };
      }
      return {
        text: isUnusableAssistantText(payloadText)
          ? 'Tell me your cuisine, area, and party size, and I will find suitable options.'
          : payloadText,
        restaurants: [],
        source: 'ai',
        sourceReason: 'json_non_dining',
      };
    }
  }

  const inferred = inferRestaurantIndices(raw, restaurants);
  if (inferred.length > 0) {
    const selected = inferred.map((i) => restaurants[i]).filter(Boolean);
    const expanded = ensureMinimumRecommendations(query, restaurants, selected, globalCandidates);
    return {
      text: shouldUseDeterministicReply(payloadText, expanded.length) ? buildDeterministicDiningReply(query, expanded) : payloadText,
      restaurants: expanded,
      source: 'ai',
      sourceReason: 'text_inferred',
    };
  }

  if (isDiningRequest(query)) {
    const selected = keywordMatchRestaurants(query, restaurants);
    const expanded = ensureMinimumRecommendations(query, restaurants, selected, globalCandidates);
    return {
      text: shouldUseDeterministicReply(payloadText, expanded.length) ? buildDeterministicDiningReply(query, expanded) : payloadText,
      restaurants: expanded,
      source: 'ai',
      sourceReason: 'keyword_match',
    };
  }

  return {
    text: isUnusableAssistantText(payloadText)
      ? 'Tell me your cuisine, area, and party size, and I will find suitable options.'
      : payloadText,
    restaurants: [],
    source: 'ai',
    sourceReason: 'no_recommendations',
  };
}

function parseAssistantPayload(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    const jsonSlice = text.slice(start, end + 1);
    try {
      return JSON.parse(jsonSlice);
    } catch {
      return null;
    }
  }
}

function sanitizeAssistantText(text) {
  return String(text || '')
    .replace(/\*\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function isUnusableAssistantText(text) {
  const t = String(text || '').trim().toLowerCase();
  if (!t) return true;
  if (t.length < 20) return true;
  return [
    "i'm unable to",
    'i am unable to',
    'unable to',
    'cannot help with that',
    "can't help with that",
  ].some((prefix) => t.startsWith(prefix));
}

function shouldUseDeterministicReply(text, selectedCount) {
  if (isUnusableAssistantText(text)) return true;
  if (!selectedCount) return false;

  const lower = String(text || '').toLowerCase();
  const contradictionMarkers = [
    "don't have",
    'do not have',
    'does not include',
    'not available',
    'cannot find',
    'no restaurants',
  ];

  return contradictionMarkers.some((marker) => lower.includes(marker));
}

function buildDeterministicDiningReply(query, selected) {
  if (!selected || selected.length === 0) {
    return "I couldn't match that exactly, but I can still help. Share your preferred cuisine, area, and budget and I'll narrow it down.";
  }

  const names = selected.map((r) => r.name).join(', ');
  const requested = String(query || '').trim();
  return `For "${requested}", I found solid options from tonight's live catalog: ${names}. Pick one and I can help with the best slot.`;
}

function inferRestaurantIndices(raw, restaurants) {
  const indices = new Set();

  const indexMatches = raw.matchAll(/index\s*[:#-]?\s*(\d+)/gi);
  for (const match of indexMatches) {
    const n = Number.parseInt(match[1], 10);
    if (Number.isInteger(n) && n >= 0 && n < restaurants.length) {
      indices.add(n);
    }
  }

  const lower = raw.toLowerCase();
  restaurants.forEach((r, i) => {
    if (lower.includes(String(r.name).toLowerCase())) {
      indices.add(i);
    }
  });

  return Array.from(indices).slice(0, 3);
}

function inferRestaurantsByName(raw, restaurants) {
  const lower = String(raw || '').toLowerCase();
  return restaurants.filter((restaurant) =>
    lower.includes(String(restaurant.name || '').toLowerCase())
  );
}

function mergeRestaurants(primary, secondary) {
  const seen = new Set();
  const merged = [];

  [...primary, ...secondary].forEach((restaurant) => {
    if (!restaurant || !restaurant.id || seen.has(restaurant.id)) return;
    seen.add(restaurant.id);
    merged.push(restaurant);
  });

  return merged;
}

function getRelaxedFallback(query, candidates, limit = RECOMMENDATION_LIMIT) {
  const pool = Array.isArray(candidates) ? candidates : [];
  if (pool.length === 0) return [];

  const q = String(query || '').toLowerCase();
  const { cuisineTerms } = deriveQuerySignals(q);

  if (isStreetFoodQuery(q)) {
    const relaxedStreet = pool.filter((restaurant) => {
      const text = `${restaurant?.name || ''} ${restaurant?.cuisine || ''} ${restaurant?.tag || ''} ${restaurant?.description || ''}`.toLowerCase();
      return [
        'indian', 'snack', 'snacks', 'street', 'sweets', 'food truck', 'dhaba',
        'chaat', 'puri', 'pav', 'lassi', 'kebab', 'biryani',
      ].some((token) => text.includes(token));
    });

    if (relaxedStreet.length > 0) return relaxedStreet.slice(0, limit);
  }

  if (cuisineTerms.length > 0) {
    const byCuisine = pool.filter((restaurant) => {
      const text = `${restaurant?.name || ''} ${restaurant?.cuisine || ''} ${restaurant?.tag || ''} ${restaurant?.description || ''}`.toLowerCase();
      return cuisineTerms.some((term) => text.includes(term));
    });

    if (byCuisine.length > 0) return byCuisine.slice(0, limit);
  }

  return pool.slice(0, limit);
}

function ensureMinimumRecommendations(query, restaurants, base, globalCandidates = [], limit = RECOMMENDATION_LIMIT) {
  const current = (Array.isArray(base) ? base : []).filter((restaurant) => matchesQueryIntent(restaurant, query));
  if (!isDiningRequest(query)) return current.slice(0, limit);

  const { locationTerm, cuisineTerms } = deriveQuerySignals(query);
  const cravingSpecific = cuisineTerms.length > 0 || isStreetFoodQuery(query);

  const keyword = keywordMatchRestaurants(query, restaurants, limit);
  const globalKeyword = keywordMatchRestaurants(query, globalCandidates, limit);

  const globalLocation = locationTerm
    ? globalCandidates.filter((restaurant) => {
        const haystack = `${restaurant.name} ${restaurant.cuisine} ${restaurant.tag} ${restaurant.description}`.toLowerCase();
        return haystack.includes(locationTerm);
      })
    : [];

  const globalCuisine = cuisineTerms.length > 0
    ? globalCandidates.filter((restaurant) => {
        const haystack = `${restaurant.name} ${restaurant.cuisine} ${restaurant.tag} ${restaurant.description}`.toLowerCase();
        return cuisineTerms.some((term) => haystack.includes(term));
      })
    : [];

  const globalPreferred = mergeRestaurants(globalLocation, mergeRestaurants(globalCuisine, globalKeyword));

  // If query contains a location and we found no direct location matches,
  // still prioritize global places so recommendations stay geographically relevant.
  const locationFallback = locationTerm && globalPreferred.length === 0
    ? globalCandidates.slice(0, limit)
    : [];

  // For location-specific queries, only global candidates should lead the shortlist.
  if (locationTerm) {
    const scopedGlobal = globalLocation.length > 0 ? globalLocation : globalCandidates;
    const scopedGlobalCuisine = cuisineTerms.length > 0
      ? scopedGlobal.filter((restaurant) => {
          const haystack = `${restaurant.name} ${restaurant.cuisine} ${restaurant.tag} ${restaurant.description}`.toLowerCase();
          return cuisineTerms.some((term) => haystack.includes(term)) && matchesQueryIntent(restaurant, query);
        })
      : [];
    const scopedGlobalKeyword = keywordMatchRestaurants(query, scopedGlobal, limit).filter((restaurant) => matchesQueryIntent(restaurant, query));
    const locationFirst = cravingSpecific
      ? mergeRestaurants(
          scopedGlobalCuisine,
          mergeRestaurants(
            scopedGlobalKeyword,
            mergeRestaurants(
              globalLocation.filter((restaurant) => matchesQueryIntent(restaurant, query)),
              locationFallback.filter((restaurant) => matchesQueryIntent(restaurant, query))
            )
          )
        )
      : mergeRestaurants(
          globalLocation.filter((restaurant) => matchesQueryIntent(restaurant, query)),
          mergeRestaurants(scopedGlobalCuisine, mergeRestaurants(scopedGlobalKeyword, locationFallback))
        );

    if (locationFirst.length > 0) {
      return locationFirst.slice(0, limit);
    }

    const locationScoped = mergeRestaurants(
      current,
      mergeRestaurants(
        keyword.filter((restaurant) => matchesQueryIntent(restaurant, query)),
        [...restaurants].filter((restaurant) => matchesQueryIntent(restaurant, query)).sort((a, b) => b.rating - a.rating).slice(0, limit)
      )
    ).slice(0, limit);

    if (locationScoped.length > 0) return locationScoped;
    return getRelaxedFallback(query, scopedGlobal, limit);
  }

  const topRated = [...restaurants].filter((restaurant) => matchesQueryIntent(restaurant, query)).sort((a, b) => b.rating - a.rating).slice(0, limit);
  const finalScoped = mergeRestaurants(
    current,
    mergeRestaurants(
      globalPreferred.filter((restaurant) => matchesQueryIntent(restaurant, query)),
      mergeRestaurants(keyword.filter((restaurant) => matchesQueryIntent(restaurant, query)), topRated)
    )
  ).slice(0, limit);

  if (finalScoped.length > 0) return finalScoped;
  return getRelaxedFallback(query, globalCandidates, limit);
}

function deriveQuerySignals(query) {
  const q = String(query || '').toLowerCase();
  const locationMatch = q.match(/\b(?:in|at|near)\s+([a-z\s.-]+)/i);
  let locationTerm = locationMatch
    ? locationMatch[1].replace(/[^a-z\s-]/gi, '').trim()
    : '';

  const cuisineTerms = [
    'sushi', 'japanese', 'chinese', 'indian', 'italian', 'korean', 'thai',
    'seafood', 'pizza', 'pasta', 'french', 'mexican', 'burger', 'chaat', 'dosa', 'idli', 'vada', 'pav',
    'paratha', 'paneer', 'mughlai', 'biryani', 'kebab', 'street food', 'south indian', 'north indian',
  ].filter((term) => q.includes(term));

  // Interpret short prompts like "delhi" as location intent.
  if (!locationTerm) {
    const words = q.split(/\s+/).filter(Boolean);
    const hasBookingWords = ['book', 'reserve', 'table', 'tonight', 'dinner', 'lunch', 'breakfast'].some((word) => q.includes(word));
    if (words.length > 0 && words.length <= 3 && !hasBookingWords && cuisineTerms.length === 0) {
      locationTerm = words.join(' ').replace(/[^a-z\s-]/gi, '').trim();
    }
  }

  return { locationTerm, cuisineTerms };
}

function isDiningRequest(query) {
  const q = String(query || '').toLowerCase();
  if (hasDiningKeywords(q) && !isLocationOnlyQuery(q)) return true;

  const { locationTerm, cuisineTerms } = deriveQuerySignals(q);
  if (locationTerm || cuisineTerms.length > 0) return true;

  return false;
}

function keywordMatchRestaurants(query, restaurants, limit = RECOMMENDATION_LIMIT) {
  const q = String(query || '').toLowerCase();
  const normalized = q
    .replace(/\bchina\b/g, 'chinese')
    .replace(/\bshrimp\b/g, 'seafood')
    .replace(/\bprawn\b/g, 'seafood');
  const { locationTerm } = deriveQuerySignals(q);
  const stopTokens = new Set([
    'in', 'at', 'near', 'me', 'restaurant', 'restaurants', 'place', 'places', 'best', 'good', 'top', 'for', 'the', 'a', 'an', 'of', 'to', 'and',
    locationTerm,
  ].filter(Boolean));
  const meaningfulTokens = normalized
    .split(/\s+/)
    .filter((token) => token.length > 2 && !stopTokens.has(token));

  const direct = restaurants.filter((r) => {
    if (!matchesQueryIntent(r, q)) return false;
    const text = `${r.name} ${r.cuisine} ${r.tag}`.toLowerCase();
    return text.includes(normalized) || meaningfulTokens.some((token) => text.includes(token));
  });

  if (direct.length > 0) return direct.slice(0, limit);

  if (isStreetFoodQuery(q)) {
    const streetFoodMatches = restaurants
      .filter((restaurant) => isStreetFoodRestaurant(restaurant) && matchesQueryIntent(restaurant, q))
      .sort((a, b) => b.rating - a.rating);

    if (streetFoodMatches.length > 0) return streetFoodMatches.slice(0, limit);
    return [];
  }

  return [...restaurants].sort((a, b) => b.rating - a.rating).slice(0, limit);
}

function isGreeting(query) {
  const q = String(query || '').toLowerCase().trim();
  return ['hello', 'hi', 'hey', 'good morning', 'good evening', 'yo'].some((g) => q === g || q.startsWith(`${g} `));
}

function localFallback(query, restaurants, globalCandidates = []) {
  if (isGreeting(query)) {
    return {
      text: `${getTimeGreeting()}. I'm Maya, your personal dining concierge. What are we having today?`,
      restaurants: [],
      source: 'fallback',
      sourceReason: 'fallback_greeting',
    };
  }

  if (isCravingWithoutLocationQuery(query)) {
    return {
      text: 'Great choice. Where are we having it?',
      restaurants: [],
      source: 'fallback',
      sourceReason: 'fallback_location_needed',
    };
  }

  if (isLocationOnlyQuery(query)) {
    const { locationTerm } = deriveQuerySignals(query);
    const city = locationTerm ? locationTerm.charAt(0).toUpperCase() + locationTerm.slice(1) : 'That area';
    return {
      text: `${city} noted. What are you craving - chaat, Mughlai, South Indian, or something else?`,
      restaurants: [],
      source: 'fallback',
      sourceReason: 'fallback_location_clarification',
    };
  }

  if (!isDiningRequest(query)) {
    if (globalCandidates.length > 0) {
      const selected = globalCandidates.slice(0, RECOMMENDATION_LIMIT);
      return {
        text: 'Here are strong options I found based on your request.',
        restaurants: selected,
        source: 'ai',
        sourceReason: 'fallback_from_global_search',
      };
    }

    return {
      text: "Tell me what cuisine, vibe, or area you want and I'll find the best available options.",
      restaurants: [],
      source: 'fallback',
      sourceReason: 'fallback_non_dining',
    };
  }

  const selected = ensureMinimumRecommendations(query, restaurants, [], globalCandidates);
  
  // If we found real restaurants through our recommendation engine, mark as AI Live
  // (not "fallback" since we're still providing intelligent recommendations)
  if (selected.length > 0) {
    return {
      text: 'Here are strong options from tonight\'s live catalog.',
      restaurants: selected,
      source: 'ai',
      sourceReason: 'recommended_by_engine',
    };
  }

  return {
    text: 'Here are strong options from tonight\'s live catalog.',
    restaurants: selected,
    source: 'fallback',
    sourceReason: 'fallback_dining',
  };
}

export function useAI() {
  const [loading, setLoading] = useState(false);

  const chat = async (userMessage, history = []) => {
    setLoading(true);
    try {
      const conversationLocation = resolveConversationLocation(history, userMessage);
      const conversationCraving = resolveConversationCraving(history);
      const needsCravingClarification = hadLocationClarification(history) && !hasDiningKeywords(userMessage) && deriveQuerySignals(userMessage).cuisineTerms.length === 0;

      if (needsCravingClarification) {
        const city = conversationLocation ? conversationLocation.charAt(0).toUpperCase() + conversationLocation.slice(1) : 'that area';
        return {
          text: `I still need a food craving for ${city}. Try chaat, Mughlai, South Indian, biryani, or something else.`,
          restaurants: [],
          source: 'fallback',
          sourceReason: 'fallback_craving_clarification',
        };
      }

      if (isCravingWithoutLocationQuery(userMessage) && !conversationLocation) {
        return {
          text: 'Great choice. Where are we having it?',
          restaurants: [],
          source: 'fallback',
          sourceReason: 'location_needed_for_craving',
        };
      }

      const locationOnlyReplyToCraving = isLocationOnlyQuery(userMessage) && hadLocationNeededPrompt(history) && Boolean(conversationCraving);

      if (isLocationOnlyQuery(userMessage) && !locationOnlyReplyToCraving) {
        return localFallback(userMessage, [], []);
      }

      const effectiveQuery = locationOnlyReplyToCraving
        ? `${conversationCraving} in ${conversationLocation}`
        : conversationLocation && !deriveQuerySignals(userMessage).locationTerm
          ? `${userMessage} in ${conversationLocation}`
          : userMessage;

      const restaurants = await getLiveRestaurantCatalog();
      const globalCandidates = await getGlobalRestaurants(effectiveQuery);
      const systemPrompt = buildSystemPrompt(restaurants, globalCandidates, effectiveQuery);

      const response = await fetch(GATEWAY_LLM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: LLM_MODEL,
          max_tokens: 700,
          temperature: 0.2,
          top_p: 0.7,
          messages: [
            { role: 'system', content: systemPrompt },
            ...history.slice(-6).map((m) => ({
              role: m.role === 'ai' ? 'assistant' : 'user',
              content: m.text,
            })),
            { role: 'user', content: userMessage },
          ],
        }),
      });

      if (!response.ok) {
        console.error('LLM proxy error:', await response.json());
        return localFallback(userMessage, restaurants, globalCandidates);
      }

      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content || '';
      return parseResponse(raw, effectiveQuery, restaurants, globalCandidates);
    } catch (err) {
      console.error('Chat error:', err);
      const restaurants = await getLiveRestaurantCatalog();
      const conversationLocation = resolveConversationLocation(history, userMessage);
      const effectiveQuery = conversationLocation && !deriveQuerySignals(userMessage).locationTerm
        ? `${userMessage} in ${conversationLocation}`
        : userMessage;
      const globalCandidates = await getGlobalRestaurants(effectiveQuery);
      return localFallback(userMessage, restaurants, globalCandidates);
    } finally {
      setLoading(false);
    }
  };

  return { chat, loading };
}
