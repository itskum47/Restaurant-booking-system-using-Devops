import { useState } from 'react';
import { aiService } from '../services/api';
import LocationSelector from './chat/LocationSelector';

function ChatInterface({ onRecommendations, onRestaurantSelect }) {
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState({ city: 'Los Angeles', country: 'United States' });
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: 'Hi! I\'m your AI booking assistant. Tell me what kind of restaurant you\'re looking for!',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message;
    setMessage('');

    // Add user message to chat
    setMessages(prev => [...prev, {
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    setIsLoading(true);

    try {
      // Send to AI service
      const response = await aiService.processBooking(userMessage, messages, location);

      // Add AI response to chat
      setMessages(prev => [...prev, {
        type: 'bot',
        content: response.message,
        timestamp: new Date(),
        data: response
      }]);

      // Pass recommendations to parent
      if (response.recommendations && response.recommendations.length > 0) {
        onRecommendations(response.recommendations);
      }

    } catch (error) {
      console.error('AI service error:', error);
      
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again or browse restaurants manually.',
        timestamp: new Date(),
        error: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "Table for 2 at an Italian restaurant tonight",
    "Sushi place for 4 people this Saturday",
    "Romantic French restaurant for 2 on Friday evening",
    "Family-friendly restaurant for 6 this weekend"
  ];

  const handleQuickPrompt = (prompt) => {
    setMessage(prompt);
  };

  return (
    <div className="card h-[600px] flex flex-col">
      <div className="flex items-center mb-4 pb-4 border-b border-gray-200">
        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
          <span className="text-xl">🤖</span>
        </div>
        <div className="ml-3 flex-1 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
            <p className="text-xs text-gray-500">Global natural language booking</p>
          </div>
        </div>
      </div>

      <LocationSelector onLocationChange={(loc) => {
        setLocation(loc);
        setMessages(prev => [...prev, {
          type: 'bot',
          content: `Concierge location updated to ${loc.city || 'your current location'}. How can I help you dine there?`,
          timestamp: new Date()
        }]);
      }} />

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.type === 'user'
                  ? 'bg-primary-600 text-white'
                  : msg.error
                  ? 'bg-red-100 text-red-900'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              
              {msg.data?.extracted && Object.keys(msg.data.extracted).length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-300 text-xs">
                  <p className="font-semibold mb-1">Understood:</p>
                  <ul className="space-y-0.5">
                    {msg.data.extracted.cuisine && <li>🍽️ {msg.data.extracted.cuisine}</li>}
                    {msg.data.extracted.party_size && <li>👥 {msg.data.extracted.party_size} people</li>}
                    {msg.data.extracted.date && <li>📅 {msg.data.extracted.date}</li>}
                    {msg.data.extracted.time && <li>🕐 {msg.data.extracted.time}</li>}
                    {msg.data.extracted.location && <li>📍 {msg.data.extracted.location}</li>}
                  </ul>
                </div>
              )}
              
              <p className="text-xs opacity-70 mt-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      {messages.length <= 2 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-2">Try these:</p>
          <div className="space-y-2">
            {quickPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleQuickPrompt(prompt)}
                className="w-full text-left text-xs bg-gray-50 hover:bg-gray-100 rounded px-3 py-2 transition-colors"
                disabled={isLoading}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your ideal dining experience..."
          className="input-field flex-1"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="btn-primary px-6"
          disabled={isLoading || !message.trim()}
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default ChatInterface;
