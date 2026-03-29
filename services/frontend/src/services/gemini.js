// services/frontend/src/services/gemini.js
// ✅ NO SDK — direct REST API call using v1 endpoint

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// v1 endpoint — works with free tier
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent?key=${API_KEY}`;

const SYSTEM_PROMPT = `You are DINE, a luxury AI dining concierge.
Always respond with ONLY valid JSON in this exact format, no markdown:
{
  "response": "warm conversational reply (2-3 sentences)",
  "recommendations": [
    {
      "name": "Restaurant Name",
      "cuisine": "Cuisine Type", 
      "description": "One evocative sentence",
      "price_range": "$$",
      "vibe": "intimate/cozy/trendy/rooftop",
      "location": "Area, City",
      "rating": 4.7,
      "available_time": "7:30 PM",
      "why_recommended": "Why this fits the request"
    }
  ],
  "intent": {
    "cuisine": null,
    "party_size": null,
    "date": null,
    "time": null,
    "occasion": null,
    "location": null
  }
}
Always return exactly 3 recommendations. Return ONLY the JSON object.`;

export async function askGemini(userMessage, history = []) {
  console.log("🤖 Calling Gemini REST API (v1):", userMessage);

  // Build conversation contents array
  const contents = [
    // Inject system prompt as first user turn
    {
      role: "user",
      parts: [{ text: SYSTEM_PROMPT }]
    },
    {
      role: "model", 
      parts: [{ text: '{"response":"Understood. I am DINE, your luxury dining concierge.","recommendations":[],"intent":{}}' }]
    },
    // Add conversation history
    ...history.map(h => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }]
    })),
    // Current message
    {
      role: "user",
      parts: [{ text: userMessage }]
    }
  ];

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: 1024,
      }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    const msg = err.error?.message || response.statusText;
    console.error("❌ Gemini API error:", msg);

    if (response.status === 429) throw new Error("Rate limit hit. Wait 60 seconds and try again.");
    if (response.status === 403) throw new Error("API key invalid or quota exhausted. Check https://aistudio.google.com");
    if (response.status === 404) throw new Error("Model not found. Check your API key region.");
    throw new Error(msg);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!rawText) throw new Error("Empty response from Gemini");

  console.log("✅ Gemini responded");

  // Strip markdown code fences if present
  const clean = rawText
    .replace(/^```json\s*/m, "")
    .replace(/^```\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();

  try {
    return JSON.parse(clean);
  } catch {
    // If not valid JSON, wrap the text as a plain response
    return {
      response: rawText,
      recommendations: [],
      intent: {}
    };
  }
}
