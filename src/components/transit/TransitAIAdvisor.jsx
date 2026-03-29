import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Sparkles, AlertCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function TransitAIAdvisor({ buses = [], trips = [], lines = [] }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'I\'m your Transit AI Advisor. Ask me about route optimization, predictive insights, or operational recommendations.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setLoading(true);

    try {
      const context = `Active buses: ${buses.length}, Live trips: ${trips.length}, Bus lines: ${lines.length}`;
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `As a transit operations AI advisor, analyze this transit network and provide actionable recommendations:\n\nContext: ${context}\n\nUser question: ${input}\n\nProvide specific, data-driven recommendations.`,
        add_context_from_internet: false,
      });
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      toast.error('AI analysis failed');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    'How can we reduce delays on peak routes?',
    'Which lines need capacity optimization?',
    'What\'s our current network efficiency?'
  ];

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Chat */}
      <div className="col-span-2 rounded-xl p-6 bg-slate-900/60 border border-slate-800/60">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-bold text-white">AI Transit Advisor</h3>
        </div>
        <div className="space-y-4 mb-4 h-96 overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs p-3 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-purple-600/30 text-purple-100 border border-purple-500/30'
                  : 'bg-slate-800/50 text-slate-300 border border-slate-700/50'
              }`}>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about transit optimization..."
            className="flex-1 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
            disabled={loading}
          />
          <Button onClick={handleSendMessage} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-4">
        <div className="rounded-xl p-4 bg-slate-900/60 border border-slate-800/60">
          <h4 className="text-sm font-bold text-white mb-3">Quick Questions</h4>
          <div className="space-y-2">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => {
                  setInput(q);
                  setTimeout(() => {
                    const button = document.activeElement;
                    if (button) {
                      const event = new KeyboardEvent('keypress', { key: 'Enter' });
                      button.dispatchEvent(event);
                    }
                  }, 100);
                }}
                className="w-full text-left text-xs p-2 rounded bg-purple-600/10 border border-purple-500/20 text-purple-300 hover:bg-purple-600/20 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-4 bg-slate-900/60 border border-slate-800/60">
          <div className="flex items-start gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-300">AI Recommendation</p>
              <p className="text-[11px] text-slate-400 mt-1">Analyze crowding patterns to optimize line frequencies</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 bg-slate-900/60 border border-slate-800/60">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-300">Insight</p>
              <p className="text-[11px] text-slate-400 mt-1">Peak hour efficiency: 87% (+5% vs last week)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}