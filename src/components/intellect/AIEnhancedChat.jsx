import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  Sparkles, Send, Zap, Globe, Brain, Wand2, ThumbsUp, ThumbsDown,
  Lightbulb, Shield, TrendingUp, MessageCircle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AIEnhancedChat({ message, onSuggest, user }) {
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [translation, setTranslation] = useState(null);
  const [sentiment, setSentiment] = useState(null);

  const analyzeMessage = useCallback(async () => {
    if (!message.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this message for a logistics/business platform in 2026:
"${message}"

Provide JSON with:
1. sentiment: 'positive'|'neutral'|'negative'
2. suggestions: array of 3 smart responses (professional, concise, contextual)
3. keywords: extracted business terms
4. urgency: 'low'|'medium'|'high'
5. actions: suggested follow-ups

Keep suggestions practical and AI-enhanced for a modern business platform.`,
        response_json_schema: {
          type: "object",
          properties: {
            sentiment: { type: "string" },
            suggestions: { type: "array", items: { type: "string" } },
            keywords: { type: "array", items: { type: "string" } },
            urgency: { type: "string" },
            actions: { type: "array", items: { type: "string" } }
          }
        }
      });

      setSentiment(analysis.sentiment);
      setAiSuggestions(analysis);
      setShowAIPanel(true);
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [message, isAnalyzing]);

  const translateMessage = useCallback(async () => {
    if (!message.trim()) return;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Translate this message to English and provide professional Danish version. Keep tone business-appropriate:
"${message}"

Provide JSON with:
1. english: translated to English
2. danish: professional Danish (if not already)
3. shortVersion: 1-sentence summary`,
        response_json_schema: {
          type: "object",
          properties: {
            english: { type: "string" },
            danish: { type: "string" },
            shortVersion: { type: "string" }
          }
        }
      });

      setTranslation(result);
      toast.success("Translation ready");
    } catch (error) {
      toast.error("Translation failed");
    }
  }, [message]);

  return (
    <div className="space-y-2">
      {/* AI Assistant Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 p-2 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 rounded-lg border border-violet-500/20"
      >
        <Sparkles className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
        <span className="text-[10px] text-slate-400">AI Assistant</span>
        
        <button
          onClick={analyzeMessage}
          disabled={isAnalyzing || !message.trim()}
          className="ml-auto text-[10px] px-2 py-0.5 rounded bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 disabled:opacity-40 transition-all flex items-center gap-1"
          title="Analyze message with AI"
        >
          {isAnalyzing ? (
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
          ) : (
            <Brain className="w-2.5 h-2.5" />
          )}
          Analyze
        </button>

        {message.trim() && (
          <button
            onClick={translateMessage}
            className="text-[10px] px-2 py-0.5 rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 transition-all flex items-center gap-1"
            title="Translate message"
          >
            <Globe className="w-2.5 h-2.5" />
            Translate
          </button>
        )}
      </motion.div>

      {/* Translation Panel */}
      <AnimatePresence>
        {translation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-2 bg-slate-800/40 rounded-lg border border-cyan-500/20 text-xs space-y-1"
          >
            <div>
              <p className="text-slate-400">EN:</p>
              <p className="text-cyan-300">{translation.english}</p>
            </div>
            {translation.danish && (
              <div>
                <p className="text-slate-400">DA:</p>
                <p className="text-cyan-300">{translation.danish}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Suggestions Panel */}
      <AnimatePresence>
        {showAIPanel && aiSuggestions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-lg border border-violet-500/20 space-y-2"
          >
            {/* Sentiment Badge */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-slate-400">Sentiment:</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                aiSuggestions.sentiment === 'positive' ? 'bg-emerald-500/20 text-emerald-300' :
                aiSuggestions.sentiment === 'negative' ? 'bg-red-500/20 text-red-300' :
                'bg-slate-500/20 text-slate-300'
              }`}>
                {aiSuggestions.sentiment}
              </span>
              {aiSuggestions.urgency && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  aiSuggestions.urgency === 'high' ? 'bg-red-500/20 text-red-300' :
                  aiSuggestions.urgency === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-slate-500/20 text-slate-300'
                }`}>
                  {aiSuggestions.urgency} priority
                </span>
              )}
            </div>

            {/* Smart Suggestions */}
            <div>
              <p className="text-[10px] font-semibold text-slate-300 mb-1">Smart Responses:</p>
              <div className="space-y-1">
                {aiSuggestions.suggestions?.slice(0, 3).map((sugg, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onSuggest?.(sugg);
                      setShowAIPanel(false);
                    }}
                    className="w-full text-left text-[10px] p-1.5 bg-slate-700/40 hover:bg-slate-700/60 rounded border border-slate-600/30 text-slate-300 hover:text-white transition-all group"
                  >
                    <div className="flex items-start gap-2">
                      <Zap className="w-2.5 h-2.5 text-violet-400 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span>{sugg}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Keywords & Actions */}
            {(aiSuggestions.keywords?.length > 0 || aiSuggestions.actions?.length > 0) && (
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {aiSuggestions.keywords?.length > 0 && (
                  <div>
                    <p className="text-slate-400 font-semibold mb-0.5">Topics:</p>
                    <div className="flex flex-wrap gap-1">
                      {aiSuggestions.keywords.slice(0, 3).map(k => (
                        <span key={k} className="px-1.5 py-0.5 bg-violet-500/20 text-violet-300 rounded text-[9px]">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {aiSuggestions.actions?.length > 0 && (
                  <div>
                    <p className="text-slate-400 font-semibold mb-0.5">Actions:</p>
                    <div className="space-y-0.5">
                      {aiSuggestions.actions.slice(0, 2).map((a, i) => (
                        <div key={i} className="text-slate-400 flex items-start gap-1">
                          <Lightbulb className="w-2.5 h-2.5 flex-shrink-0 text-amber-400 mt-0.5" />
                          <span className="text-[9px]">{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setShowAIPanel(false)}
              className="text-[9px] text-slate-500 hover:text-slate-400 mt-1"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}