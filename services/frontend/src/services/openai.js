// services/frontend/src/services/openai.js
// ✅ OpenAI integration via NVIDIA API (compatible OpenAI client)

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const API_URL = import.meta.env.VITE_OPENAI_API_URL || "https://integrate.api.nvidia.com/v1";
const MODEL = import.meta.env.VITE_OPENAI_MODEL || "minimaxai/minimax-m2.5";

const SYSTEM_PROMPT = `You are DINE, a luxury AI dining concierge.
If the user mentions a location but doesn't mention what they want to eat, kindly ask them what type of cuisine or what they are having today before providing any recommendations.
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
If you are still asking for cuisine preference, leave the recommendations array empty.
Otherwise, always return exactly 3 recommendations. Return ONLY the JSON object.`;

export async function askOpenAI(userMessage, history = []) {
  console.log("🤖 Calling OpenAI (NVIDIA):", userMessage);

  // Build messages array for OpenAI
  const messages = [
    // System prompt
    {
      role: "system",
      content: SYSTEM_PROMPT
    },
    // Add conversation history
    ...history.map(h => ({
      role: h.role === "assistant" ? "assistant" : "user",
      content: h.content
    })),
    // Current message
    {
      role: "user",
      content: userMessage
    }
  ];

  try {
    const response = await fetch(`${API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.8,
        top_p: 0.9,
        max_tokens: 1024,
        stream: false
      })
    });

    if (!response.ok) {
      const err = await response.json();
      const msg = err.error?.message || response.statusText;
      console.error("❌ OpenAI API error:", msg);

      if (response.status === 429) throw new Error("Rate limit hit. Wait a moment and try again.");
      if (response.status === 401) throw new Error("API key invalid or expired. Check your VITE_OPENAI_API_KEY.");
      if (response.status === 404) throw new Error("Model not found. Check VITE_OPENAI_MODEL.");
      throw new Error(msg);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content?.trim();

    if (!rawText) throw new Error("Empty response from OpenAI");

    console.log("✅ OpenAI responded");

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
  } catch (error) {
    console.error("❌ OpenAI request failed:", error);
    throw error;
  }
}
