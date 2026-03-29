import { useState } from 'react';
import { RESTAURANTS } from '../data/restaurants';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const RESTAURANT_LIST = RESTAURANTS.map((r, i) =>
  `INDEX ${i}: ${r.name} (${r.cuisine}, ${r.price}, ${r.tag}, ${r.stars} Michelin star)`
).join('\n');

const SYSTEM_PROMPT = `You are Maya, DINE.AI's warm and sophisticated dining concierge.
You help guests discover extraordinary restaurants and make reservations.

PARTNER RESTAURANTS:
${RESTAURANT_LIST}

CONVERSATION RULES:
- Be warm, witty, and human — like a knowledgeable friend who knows all the best tables
- For greetings (hello, hi, hey, good evening etc) → respond warmly, introduce yourself briefly, ask what they're looking for
- For small talk → engage naturally, keep it brief, steer toward dining
- For restaurant/food/dining requests → recommend from the list above

RECOMMENDATION FORMAT:
Only include the RECOMMEND tag when the user is asking about food, restaurants, dining, or making a booking.
When recommending, end your response with:
RECOMMEND:X,Y,Z
(using index numbers from the list)

Do NOT include RECOMMEND for: greetings, small talk, thanks, questions about you, etc.

EXAMPLES:

User: "hello"
You: "Good evening! I'm Maya, your personal dining concierge. Whether you're planning a romantic dinner, a celebration, or just a great meal — I'm here to find you the perfect table. What are you in the mood for tonight?"

User: "what can you do"  
You: "I know every great table in the city — from intimate hideaways to legendary dining rooms. Tell me the occasion, your cravings, or even just a mood, and I'll find you something extraordinary. What are you thinking tonight?"

User: "romantic dinner for 2"
You: "How beautiful. For an unforgettable romantic evening, I have three extraordinary settings in mind — each one is intimate, stunning, and utterly memorable.
RECOMMEND:0,2,5"

User: "japanese food"
You: "Excellent taste. From Nobu's transcendent black cod to Atomix's boundary-pushing omakase — Japanese cuisine at its finest awaits you tonight.
RECOMMEND:0,4"

User: "thanks"
You: "My pleasure entirely. If you ever need a table — whether tonight or for a special occasion — I'm always here. Enjoy your evening! ✨"`;

export function useAI() {
  const [loading, setLoading] = useState(false);

  const chat = async (userMessage, history = []) => {
    setLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;

      if (!apiKey) {
        console.warn('⚠️ No VITE_GROQ_API_KEY');
        await new Promise(r => setTimeout(r, 1000));
        return smartFallback(userMessage);
      }

      const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          max_tokens: 350,
          temperature: 0.85,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.slice(-6).map(m => ({
              role: m.role === 'ai' ? 'assistant' : 'user',
              content: m.text,
            })),
            { role: 'user', content: userMessage },
          ],
        }),
      });

      if (!response.ok) {
        console.error('Groq error:', await response.json());
        return smartFallback(userMessage);
      }

      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content || '';
      console.log('🤖 AI raw:', raw);

      return parseResponse(raw, userMessage);

    } catch (err) {
      console.error('Chat error:', err);
      return smartFallback(userMessage);
    } finally {
      setLoading(false);
    }
  };

  return { chat, loading };
}

// ─────────────────────────────────────────────
// Parse response — only show cards if RECOMMEND present
// ─────────────────────────────────────────────
function parseResponse(raw, originalQuery) {
  const recommendMatch = raw.match(/RECOMMEND:\s*([\d,\s]+)/i);

  // Clean text — remove RECOMMEND line
  const text = raw
    .replace(/RECOMMEND[^\n]*/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (recommendMatch) {
    const indices = recommendMatch[1]
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n >= 0 && n < RESTAURANTS.length);

    if (indices.length > 0) {
      return {
        text,
        restaurants: indices.map(i => RESTAURANTS[i]).filter(Boolean),
      };
    }
  }

  // No RECOMMEND tag → conversational response, no cards
  // But check if user was clearly asking for restaurants
  if (isDiningRequest(originalQuery)) {
    return {
      text,
      restaurants: getSmartRecs(originalQuery),
    };
  }

  // Pure conversation — no restaurant cards
  return { text, restaurants: [] };
}

// ─────────────────────────────────────────────
// Detect if message is a dining/restaurant request
// ─────────────────────────────────────────────
function isDiningRequest(query) {
  const q = query.toLowerCase();
  const diningKeywords = [
    'restaurant', 'dinner', 'lunch', 'breakfast', 'eat', 'food', 'dining',
    'table', 'reservation', 'book', 'reserve', 'cuisine', 'hungry',
    'tonight', 'near me', 'nearby', 'recommend', 'suggestion',
    'japanese', 'italian', 'french', 'chinese', 'indian', 'korean',
    'sushi', 'pasta', 'seafood', 'steak', 'pizza', 'ramen',
    'romantic', 'anniversary', 'birthday', 'celebration', 'date',
    'business dinner', 'corporate', 'michelin', 'fine dining',
    'cheap', 'expensive', 'budget', 'luxury', 'affordable',
    'menu', 'chef', 'tasting', 'omakase', 'buffet',
  ];
  return diningKeywords.some(kw => q.includes(kw));
}

// ─────────────────────────────────────────────
// Smart fallback when no API key
// ─────────────────────────────────────────────
function smartFallback(query) {
  const q = query.toLowerCase();

  // Greeting → no cards
  if (isGreeting(q)) {
    return {
      text: "Good evening! I'm Maya, your personal dining concierge. Whether you're planning a romantic dinner, a celebration, or just a great meal — I'm here to find you the perfect table. What are you in the mood for tonight?",
      restaurants: [],
    };
  }

  // Small talk → no cards
  if (isSmallTalk(q)) {
    return {
      text: "I'm doing wonderfully, thank you for asking! I spend my days discovering the most extraordinary dining experiences in the city. Now — shall we find you the perfect table tonight? 🍽️",
      restaurants: [],
    };
  }

  // Thanks → no cards
  if (q.includes('thank') || q.includes('thanks') || q.includes('great') || q.includes('perfect')) {
    return {
      text: "My pleasure entirely! If you ever need a table — whether tonight or for a special occasion — I'm always here. Enjoy your evening! ✨",
      restaurants: [],
    };
  }

  // Dining request → show cards
  if (isDiningRequest(q)) {
    return {
      text: generateDiningResponse(q),
      restaurants: getSmartRecs(q),
    };
  }

  // Default → gentle redirect
  return {
    text: "I'm best at finding extraordinary dining experiences! Tell me what you're craving, an occasion you're planning, or a city you're in — and I'll find you something unforgettable.",
    restaurants: [],
  };
}

function isGreeting(q) {
  return ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
    'good night', 'howdy', 'hiya', 'greetings', 'sup', "what's up", 'yo']
    .some(g => q.includes(g));
}

function isSmallTalk(q) {
  return ['how are you', 'how r u', 'how do you', "what's your name", 'who are you',
    'what are you', 'what can you do', 'help me', 'what do you do']
    .some(s => q.includes(s));
}

function generateDiningResponse(q) {
  if (q.includes('romantic') || q.includes('date') || q.includes('anniversary'))
    return "For an unforgettable romantic evening, I've selected three extraordinary settings — intimate, stunning, and built for connection.";
  if (q.includes('birthday') || q.includes('celebration'))
    return "A birthday deserves a truly memorable stage. These venues treat celebrations as the art form they are.";
  if (q.includes('japanese') || q.includes('sushi') || q.includes('omakase'))
    return "Japanese cuisine at its most transcendent — precision, artistry, and soul on every plate.";
  if (q.includes('italian') || q.includes('pasta'))
    return "Italian soul food elevated to high art. These restaurants remind us why Italian cuisine is the world's most beloved.";
  if (q.includes('near me') || q.includes('nearby') || q.includes('tonight'))
    return "I've found the finest tables available for you tonight. Each one promises an evening worth remembering.";
  if (q.includes('surprise') || q.includes('anything') || q.includes('you decide'))
    return "Allow me to surprise you. Three extraordinary options — each a completely different kind of magic.";
  return "I've curated some exceptional options for you tonight. Each one is extraordinary in its own way.";
}

function getSmartRecs(query) {
  const q = query.toLowerCase();

  if (q.includes('japanese') || q.includes('sushi') || q.includes('tokyo') || q.includes('omakase'))
    return [RESTAURANTS[0], RESTAURANTS[4]];
  if (q.includes('italian') || q.includes('pasta') || q.includes('italy'))
    return [RESTAURANTS[1], RESTAURANTS[3], RESTAURANTS[5]];
  if (q.includes('french') || q.includes('seafood') || q.includes('paris'))
    return [RESTAURANTS[2]];
  if (q.includes('korean') || q.includes('seoul'))
    return [RESTAURANTS[4]];
  if (q.includes('romantic') || q.includes('date') || q.includes('anniversary'))
    return [RESTAURANTS[0], RESTAURANTS[2], RESTAURANTS[5]];
  if (q.includes('birthday') || q.includes('celebration'))
    return [RESTAURANTS[1], RESTAURANTS[5], RESTAURANTS[4]];
  if (q.includes('business') || q.includes('corporate'))
    return [RESTAURANTS[2], RESTAURANTS[0], RESTAURANTS[1]];

  // Shuffle for vague dining requests
  return [...RESTAURANTS].sort(() => Math.random() - 0.5).slice(0, 3);
}
