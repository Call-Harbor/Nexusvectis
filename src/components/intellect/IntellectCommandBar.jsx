import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Send, Mic, Zap, Paperclip, FileText, X, Sparkles, Shield, Building2, Satellite, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function IntellectCommandBar({
  input, setInput, messages, streamingMessage, messagesEndRef,
  uploadedFiles, setUploadedFiles, isUploading, setIsUploading,
  isListening, setIsListening, fileInputRef,
  processCommand, setShowCompanyAnalysis, setShowProfileSearch, handleQuickAction, openWindow,
}) {
  const removeFile = (index) => setUploadedFiles(prev => prev.filter((_, i) => i !== index));

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
                  : msg.role === 'assistant' ? <div className="prose prose-sm prose-invert max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
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

        {/* Quick Buttons */}
        <div className="flex gap-2 flex-wrap mb-3">
          <Button onClick={() => openWindow('company_analytics', { x: 0, y: 0 })} variant="outline" size="sm" className="border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500/10">
            <Building2 className="w-3.5 h-3.5 mr-1.5" />Company Analytics
          </Button>
          <Button onClick={() => setShowProfileSearch(true)} variant="outline" size="sm" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
            <Building2 className="w-3.5 h-3.5 mr-1.5" />People Search
          </Button>
          <Button onClick={() => handleQuickAction('openSatelliteWeather')} variant="outline" size="sm" className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10">
            <Satellite className="w-3.5 h-3.5 mr-1.5" />Satellite & Weather
          </Button>
          <Button onClick={() => handleQuickAction('openNeuroRisk')} variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
            <Shield className="w-3.5 h-3.5 mr-1.5" />Neuro Risk Fusion
          </Button>
          <Button onClick={() => handleQuickAction('openNewsIntelligence')} variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
            <Newspaper className="w-3.5 h-3.5 mr-1.5" />News Feed
          </Button>
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
              placeholder="Command FLEET AI... (e.g. 'predict maintenance', 'forecast demand', 'analyze CO2')"
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