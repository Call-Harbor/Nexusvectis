import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Send, Mic, Zap, Paperclip, FileText, X, Sparkles, Shield, Building2, Satellite, Newspaper, Brain } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function IntellectCommandBar({
  input, setInput, messages, streamingMessage, messagesEndRef,
  uploadedFiles, setUploadedFiles, isUploading, setIsUploading,
  isListening, setIsListening, fileInputRef,
  processCommand, setShowCompanyAnalysis, setShowProfileSearch, handleQuickAction, openWindow,
}) {
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  
  const removeFile = (index) => setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  
  const quickActions = [
    { label: 'Company', icon: Building2, color: 'fuchsia', action: () => openWindow('company_analytics', { x: 0, y: 0 }) },
    { label: 'People', icon: Building2, color: 'blue', action: () => openWindow('profile_search', { x: 0, y: 0 }) },
    { label: 'Weather', icon: Satellite, color: 'violet', action: () => handleQuickAction('openSatelliteWeather') },
    { label: 'Risk', icon: Shield, color: 'red', action: () => handleQuickAction('openNeuroRisk') },
    { label: 'News', icon: Newspaper, color: 'emerald', action: () => handleQuickAction('openNewsIntelligence') },
  ];

  const handleFileUpload = async (e) => {
    const { base44 } = await import("@/api/base44Client");
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setIsUploading(true);
    const newFiles = await Promise.all(files.map(async (file) => {
      const response = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = response?.data?.file_url || response?.file_url;
      if (!fileUrl) throw new Error('Upload failed');
      return { name: file.name, url: fileUrl, type: file.type };
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
    toast.success(`✅ Uploaded ${files.length} file(s)`);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVoice = async () => {
    if (!('webkitSpeechRecognition' in window)) { toast.error('Voice input not supported'); return; }
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-US'; recognition.continuous = false; recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => setInput(event.results[0][0].transcript);
    recognition.onerror = () => { toast.error('Voice input failed'); setIsListening(false); };
    recognition.start();
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Messages */}
        <div className="mb-3 sm:mb-4 max-h-32 sm:max-h-48 overflow-y-auto space-y-1.5 sm:space-y-2">
          {messages.slice(-5).map((msg, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
              <div className={`text-sm p-3 rounded-lg backdrop-blur-xl ${
                msg.role === 'user' ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-300' :
                msg.role === 'system' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' :
                'bg-slate-800/50 border border-slate-700/50 text-slate-200'
              }`}>
                <span className="font-semibold mr-1">{msg.role === 'user' ? '>' : msg.role === 'system' ? '⚡' : '🧠'}</span>
                {msg.streaming ? <span className="animate-pulse">{msg.content || 'Thinking...'}</span>
                  : msg.role === 'assistant' ? <div className="prose prose-sm prose-invert max-w-none"><ReactMarkdown>{typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}</ReactMarkdown></div>
                  : msg.content}
              </div>
              {msg.files?.length > 0 && (
                <div className="flex flex-wrap gap-1 ml-4">
                  {msg.files.map((file, i) => (
                    <div key={i} className="flex items-center gap-1 px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded text-[10px]">
                      <FileText className="w-3 h-3 text-cyan-400" />
                      <span className="text-slate-400">{file.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
          {streamingMessage && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-sm p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300">
              <span className="font-semibold mr-1">🧠</span>{streamingMessage}<span className="animate-pulse ml-1">▊</span>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Circular Quick Menu */}
        <div className="mb-4 flex justify-center">
          <div className="relative w-40 h-40">
            {/* Brain Icon Button */}
            <button onClick={() => setShowQuickMenu(!showQuickMenu)}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center transition-all z-20"
              style={{ border: "2px solid rgba(6,182,212,0.5)", background: "rgba(6,182,212,0.08)", boxShadow: showQuickMenu ? "0 0 30px rgba(6,182,212,0.4)" : "0 0 15px rgba(6,182,212,0.2)" }}>
              <Brain className="w-8 h-8" style={{ color: "#06b6d4" }} />
            </button>

            {/* Circular Menu Items */}
            <AnimatePresence>
              {showQuickMenu && (
                <div className="absolute inset-0">
                  {quickActions.map((action, idx) => {
                    const angle = (idx / quickActions.length) * Math.PI * 2;
                    const radius = 70;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    const Icon = action.icon;
                    return (
                      <motion.div key={idx}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ delay: idx * 0.05, duration: 0.3 }}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                        style={{ x, y }}>
                        <button onClick={() => { action.action(); setShowQuickMenu(false); }}
                          className="w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:scale-110"
                          style={{ border: `1.5px solid rgba(139,92,246,0.4)`, background: "rgba(139,92,246,0.08)", boxShadow: "0 0 12px rgba(139,92,246,0.2)" }}>
                          <Icon className="w-5 h-5" style={{ color: "#8b5cf6" }} />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-3">
          <AnimatePresence>
            {uploadedFiles.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 rounded-2xl border-2 border-cyan-500/40 backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Paperclip className="w-4 h-4 text-cyan-300" />
                  <span className="text-cyan-300 text-sm font-semibold">{uploadedFiles.length} file(s) attached</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-500/40 to-violet-500/40 border-2 border-cyan-500/60 rounded-xl">
                      <FileText className="w-4 h-4 text-cyan-200" />
                      <span className="text-white text-xs font-medium max-w-[150px] truncate">{file.name}</span>
                      <button onClick={() => removeFile(idx)} className="text-slate-300 hover:text-red-300 ml-1 p-1 hover:bg-red-500/20 rounded"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2 sm:gap-3">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); processCommand(); } }}
              placeholder="Command FLEET AI... (e.g. 'generate tasks for fleet expansion project', 'weekly project summary', 'identify risks for route optimization project')"
              className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 bg-slate-900/60 border-2 border-cyan-500/40 rounded-xl sm:rounded-2xl text-sm sm:text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/20 backdrop-blur-xl transition-all"
            />
            <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" accept="*/*" />
            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} size="sm"
              className={`px-3 sm:px-4 lg:px-6 border-2 rounded-xl sm:rounded-2xl transition-all shadow-lg ${isUploading ? 'bg-gradient-to-r from-cyan-500/40 to-violet-500/40 border-cyan-500/60 animate-pulse' : 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 hover:from-cyan-500/30 hover:to-violet-500/30 border-cyan-500/40'}`}>
              {isUploading ? <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-cyan-300" /> : <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" />}
            </Button>
            <Button onClick={handleVoice} size="sm" className={`px-3 sm:px-4 lg:px-6 ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-800 hover:bg-slate-700'} rounded-xl sm:rounded-2xl hidden sm:flex`}>
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button onClick={processCommand} disabled={!input.trim()} size="sm"
              className="px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-500 bg-[length:200%_auto] hover:bg-right rounded-xl sm:rounded-2xl shadow-lg shadow-cyan-500/30 disabled:opacity-50 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <Send className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
            </Button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2"><Zap className="w-3 h-3 text-cyan-500" /><span>Press Enter to send</span></div>
          <span className="text-slate-600">{uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s) ready` : 'Attach files for AI analysis'}</span>
        </div>
      </div>
    </div>
  );
}