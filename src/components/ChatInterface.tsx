import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Loader2, Sparkles } from 'lucide-react';
import ExpertMessage from './ExpertMessage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  yearLevel: string;
  subject: string;
  sessionId: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ yearLevel, subject, sessionId }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: `Hello! I'm your Expert ${yearLevel} ${subject} tutor. I've reviewed the VCAA curriculum for our session—what would you like to master today?` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Using your specific Cloud Run URL
      const response = await fetch('https://voxii-tutor-backend-919882895306.australia-southeast1.run.app/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage,
          year_level: yearLevel,
          subject: subject,
        }),
      });

      if (!response.ok) throw new Error('Backend connection failed');

      const data = await response.json();
      
      setMessages((prev) => [
        ...prev, 
        { role: 'assistant', content: data.response }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev, 
        { role: 'assistant', content: "I'm having a quick look at my textbooks. Please try sending that again in a second!" }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto bg-slate-50 shadow-2xl">
      {/* Expert Header */}
      <div className="p-5 border-b bg-white flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Sparkles className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">Voxii Master Tutor</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-tighter">
              {yearLevel} • {subject} • VCAA Aligned
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-100">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-green-700 uppercase">Live Pipeline Connected</span>
        </div>
      </div>

      {/* Message Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatars */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
              msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}>
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>

            {/* Content Bubbles */}
            <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-5 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
            }`}>
              {msg.role === 'assistant' ? (
                <ExpertMessage text={msg.content} />
              ) : (
                <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
              <Bot size={20} className="text-blue-500" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 rounded-tl-none flex items-center gap-3 text-slate-400 italic">
              <Loader2 size={18} className="animate-spin text-blue-500" />
              <span>Analyzing curriculum data...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t">
        <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask your ${subject} question...`}
            className="w-full p-4 pr-16 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-30 transition-all shadow-lg shadow-blue-500/20"
          >
            <Send size={20} />
          </button>
        </form>
        <div className="mt-3 flex justify-center items-center gap-4">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Expert Reasoning v2.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;