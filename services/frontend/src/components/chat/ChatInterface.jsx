import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { askOpenAI } from '../../services/openai';
import { restaurantService } from '../../services/api';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import RestaurantCard from '../restaurant/RestaurantCard';
import LoadingShimmer from '../ui/LoadingShimmer';

function getTimeGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const starterMessage = {
  id: 1,
  role: 'assistant',
  content: `${getTimeGreeting()}. I'm your personal dining concierge. What are we having today?`,
  timestamp: new Date().toISOString(),
};

function mapRestaurant(raw, index) {
  return {
    id: raw.id || raw._id || index + 1,
    name: raw.name,
    cuisine: raw.cuisine || 'Contemporary',
    rating: Number(raw.rating || 4.7),
    priceRange: raw.price_range || raw.priceRange || 3,
    imageUrl:
      raw.image_url ||
      raw.imageUrl ||
      `https://images.unsplash.com/photo-${1514933651103 + index}?auto=format&fit=crop&w=800&q=80`,
    availableSlots: raw.available_slots || raw.availableSlots || ['7:30 PM', '8:00 PM', '8:30 PM'],
    distance: raw.distance || '2.4 mi',
    address: raw.address || 'Premier District',
  };
}

function ChatInterface() {
  const [messages, setMessages] = useState([starterMessage]);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);

  const shownMatches = useMemo(() => matches.slice(0, 3), [matches]);

  const handleSend = async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage = { 
      id: Date.now(), 
      role: 'user', 
      content: trimmed,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      console.log('🤖 Calling OpenAI with:', trimmed);
      
      // Call OpenAI directly with conversation history
      const openaiResponse = await askOpenAI(trimmed, conversationHistory);

      console.log('✅ OpenAI response received:', openaiResponse);

      // Map OpenAI recommendations to restaurant cards
      const geminiRestaurants = (openaiResponse?.recommendations || []).map((rec, index) => ({
        id: `gemini-${Date.now()}-${index}`,
        name: rec.name,
        cuisine: rec.cuisine || 'Contemporary',
        rating: Number(rec.rating || 4.7),
        priceRange: ['$', '₹'].some(c => rec.price_range === c) ? 1 : ['$$', '₹₹'].some(c => rec.price_range === c) ? 2 : ['$$$', '₹₹₹'].some(c => rec.price_range === c) ? 3 : 4,
        imageUrl: `https://images.unsplash.com/photo-${1514933651103 + index}?auto=format&fit=crop&w=800&q=80`,
        availableSlots: rec.available_time ? [rec.available_time] : ['7:30 PM', '8:00 PM', '8:30 PM'],
        distance: '2.4 mi',
        address: rec.location || 'Premier District',
        description: rec.description,
        vibe: rec.vibe,
        why_recommended: rec.why_recommended
      }));

      setMatches(geminiRestaurants);

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: (openaiResponse?.response || `I found ${geminiRestaurants.length} perfect matches for you.`).toString(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update conversation history for multi-turn conversations
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: trimmed },
        { role: 'assistant', content: openaiResponse?.response || '' }
      ]);

    } catch (err) {
      console.error('❌ OpenAI error:', err);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: err.message || 'I apologize, but I encountered an issue. Please check the browser console for details.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`chat-container flex flex-col gap-5 rounded-2xl border border-[var(--border-subtle)] bg-[rgba(17,17,20,0.75)] p-4 md:flex-row md:p-6 ${loading ? 'ai-thinking' : ''}`}>
      <div className="md:w-[55%]">
        <h2 className="mb-4 font-[var(--font-display)] text-4xl">◆ AI Concierge</h2>
        <hr className="gold-divider mb-4" />
        <div className="hide-scrollbar flex max-h-[540px] flex-col gap-4 overflow-y-auto pr-2">
          {messages.map((message) => (
            <ChatBubble key={message.id} role={message.role} content={message.content} />
          ))}
          {loading ? <ChatBubble role="assistant" typing /> : null}
        </div>
        <ChatInput onSend={handleSend} disabled={loading} />
      </div>

      <div className="md:w-[45%]">
        <h3 className="mb-4 font-[var(--font-display)] text-3xl">Tonight&apos;s Matches</h3>
        <hr className="gold-divider mb-4" />

        <div className="hidden space-y-4 md:block">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => (
                <LoadingShimmer key={index} className="h-32 w-full rounded-xl" />
              ))
            : shownMatches.map((restaurant, index) => (
                <motion.div
                  key={restaurant.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.35 }}
                >
                  <RestaurantCard {...restaurant} variant="compact" />
                </motion.div>
              ))}
        </div>

        <motion.div
          initial={false}
          animate={{ y: shownMatches.length ? 0 : 20 }}
          className="fixed inset-x-0 bottom-[58px] z-40 rounded-t-2xl border border-[var(--border-subtle)] bg-[rgba(17,17,20,0.95)] p-4 backdrop-blur-xl md:hidden"
        >
          <p className="mb-3 text-xs uppercase tracking-[0.1em] text-[var(--accent-gold)]">Tonight&apos;s Matches</p>
          <div className="hide-scrollbar flex snap-x-mandatory gap-3 overflow-x-auto pb-2">
            {shownMatches.map((restaurant, index) => (
              <motion.div
                key={restaurant.id}
                className="snap-start min-w-[260px]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.35 }}
              >
                <RestaurantCard {...restaurant} variant="compact" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        <button className="btn-ghost mt-4 hidden w-full md:block">View All {matches.length || 12} →</button>
      </div>
    </section>
  );
}

export default ChatInterface;
