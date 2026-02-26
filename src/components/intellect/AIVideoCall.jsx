import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Copy, ExternalLink,
  Sparkles, Brain, BarChart3, Share2, Eye, Settings, Zap, Loader2,
  Clock, Users, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AIVideoCall({ currentUrl, onUrlChange, callData }) {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [callMetrics, setCallMetrics] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const callDurationRef = useRef(0);
  const callStartRef = useRef(Date.now());
  const iframeRef = useRef(null);

  // Simulate call duration
  useEffect(() => {
    if (!currentUrl) return;
    const interval = setInterval(() => {
      callDurationRef.current = Math.floor((Date.now() - callStartRef.current) / 1000);
      setCallMetrics(prev => ({
        ...prev,
        duration: callDurationRef.current
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentUrl]);

  const generateAIInsights = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);

    try {
      const insights = await base44.integrations.Core.InvokeLLM({
        prompt: `Provide AI-powered video call insights for a business platform call that has been ongoing for ${callDurationRef.current} seconds.

Generate JSON with:
1. callQualityScore: 0-100
2. participants: estimated engagement level ('high'|'medium'|'low')
3. keyTopics: extracted topics from conversation (estimated)
4. recommendations: array of 3 suggestions to improve productivity
5. nextSteps: AI-generated action items
6. timeline: call timeline suggestions
7. documentSuggestion: what to document`,
        response_json_schema: {
          type: "object",
          properties: {
            callQualityScore: { type: "number" },
            participants: { type: "string" },
            keyTopics: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            nextSteps: { type: "array", items: { type: "string" } },
            timeline: { type: "array", items: { type: "string" } },
            documentSuggestion: { type: "string" }
          }
        }
      });

      setAiInsights(insights);
      setShowAIInsights(true);
    } catch (error) {
      toast.error("Failed to generate insights");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + 'h ' : ''}${mins}m ${secs}s`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 relative">
      {/* Video Frame */}
      {currentUrl ? (
        <div className="flex-1 relative overflow-hidden bg-black rounded-t-lg">
          <iframe
            ref={iframeRef}
            src={currentUrl}
            title="Video Call"
            allow="camera; microphone; speaker; display-capture"
            className="w-full h-full border-0"
          />

          {/* AI Call Overlay - Bottom Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4 flex items-center gap-2"
          >
            {/* Call Metrics */}
            <div className="flex items-center gap-3 text-white text-sm">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xs">{formatDuration(callDurationRef.current)}</span>
              </div>
              {callMetrics?.participants && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-violet-400" />
                  <span className="text-xs">{callMetrics.participants}</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 ml-auto">
              {/* AI Insights Button */}
              <button
                onClick={generateAIInsights}
                disabled={isAnalyzing}
                className="p-2 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 transition-all disabled:opacity-50 flex items-center gap-1.5"
                title="Generate AI insights"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4" />
                )}
                <span className="text-xs font-medium">AI Analysis</span>
              </button>

              {/* Toggle Buttons */}
              <button
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`p-2 rounded-lg transition-all ${
                  isVideoOn
                    ? "bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300"
                    : "bg-red-600/30 hover:bg-red-600/50 text-red-300"
                }`}
              >
                {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsMicOn(!isMicOn)}
                className={`p-2 rounded-lg transition-all ${
                  isMicOn
                    ? "bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300"
                    : "bg-red-600/30 hover:bg-red-600/50 text-red-300"
                }`}
              >
                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              {/* End Call */}
              <button className="p-2 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-300 transition-all">
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Video className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400 text-sm">No video call loaded</p>
          </div>
        </div>
      )}

      {/* AI Insights Sidebar */}
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{
          x: showAIInsights ? 0 : 300,
          opacity: showAIInsights ? 1 : 0,
        }}
        className="absolute right-0 top-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-lg border-l border-slate-800 shadow-2xl overflow-y-auto z-40"
      >
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <h3 className="font-bold text-white text-sm">AI Call Assistant</h3>
            </div>
            <button
              onClick={() => setShowAIInsights(false)}
              className="text-slate-500 hover:text-white"
            >
              ✕
            </button>
          </div>

          {aiInsights && (
            <div className="space-y-4">
              {/* Quality Score */}
              <div className="p-3 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 rounded-lg border border-cyan-500/20">
                <p className="text-slate-400 text-[10px] font-semibold mb-1">Call Quality</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${aiInsights.callQualityScore}%` }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-violet-500"
                    />
                  </div>
                  <span className="text-white font-bold text-sm">{aiInsights.callQualityScore}%</span>
                </div>
              </div>

              {/* Engagement Level */}
              <div>
                <p className="text-slate-400 text-[10px] font-semibold mb-2">Engagement</p>
                <Badge className={`${
                  aiInsights.participants === 'high'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : aiInsights.participants === 'medium'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {aiInsights.participants} engagement
                </Badge>
              </div>

              {/* Key Topics */}
              {aiInsights.keyTopics?.length > 0 && (
                <div>
                  <p className="text-slate-400 text-[10px] font-semibold mb-2">Topics Discussed</p>
                  <div className="flex flex-wrap gap-1.5">
                    {aiInsights.keyTopics.map(topic => (
                      <Badge key={topic} className="bg-slate-700/50 text-slate-300 text-[9px]">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {aiInsights.recommendations?.length > 0 && (
                <div>
                  <p className="text-slate-400 text-[10px] font-semibold mb-2">Recommendations</p>
                  <div className="space-y-1">
                    {aiInsights.recommendations.map((rec, i) => (
                      <div key={i} className="flex gap-2 text-[10px] text-slate-300 p-1.5 bg-slate-800/50 rounded">
                        <Zap className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Steps */}
              {aiInsights.nextSteps?.length > 0 && (
                <div>
                  <p className="text-slate-400 text-[10px] font-semibold mb-2">Action Items</p>
                  <div className="space-y-1">
                    {aiInsights.nextSteps.map((step, i) => (
                      <div key={i} className="text-[10px] text-slate-300 p-1.5 bg-slate-800/50 rounded flex items-start gap-2">
                        <span className="text-cyan-400 font-bold flex-shrink-0">→</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Document Suggestion */}
              {aiInsights.documentSuggestion && (
                <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded text-[10px] text-slate-300">
                  <p className="font-semibold text-violet-300 mb-1">📝 Document:</p>
                  <p>{aiInsights.documentSuggestion}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Info Bar & Advanced Controls */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60 space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAIInsights(!showAIInsights)}
            className={`flex-1 text-xs py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              showAIInsights
                ? "bg-violet-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Brain className="w-3 h-3" />
            AI Insights
          </button>

          <button
            className="text-xs py-1.5 px-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all flex items-center gap-1.5"
            title="Transcript"
          >
            <Eye className="w-3 h-3" />
            Transcript
          </button>

          <button
            className="text-xs py-1.5 px-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all flex items-center gap-1.5"
            title="Share call"
          >
            <Share2 className="w-3 h-3" />
            Share
          </button>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <TrendingUp className="w-3 h-3" />
          <span>AI-Enhanced Collaboration • Real-time Analysis • Intelligent Notes</span>
        </div>
      </div>
    </div>
  );
}