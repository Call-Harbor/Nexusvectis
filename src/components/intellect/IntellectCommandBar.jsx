import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Send, Mic, MicOff, Zap, Paperclip, FileText, X, Sparkles, Shield, Building2, Satellite, Newspaper, LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import MessageFormatter from "./MessageFormatter";
import VoiceController from "./VoiceController";

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

  const [showVoiceController, setShowVoiceController] = useState(false);

  const handleVoiceToggle = () => {
    const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!supported) { toast.error("Voice input not supported in this browser"); return; }
    setShowVoiceController(p => !p);
    setIsListening(p => !p);
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <AnimatePresence>
        {showVoiceController && (
          <VoiceController
            language="da-DK"
            onTranscript={(text) => setInput(text)}
            onSend={() => { setShowVoiceController(false); setIsListening(false); processCommand(); }}
            onClose={() => { setShowVoiceController(false); setIsListening(false); }}
          />
        )}
      </AnimatePresence>
      <div className="max-w-4xl mx-auto">
        {/* Messages */}
        <div className="mb-3 sm:mb-4 max-h-32 sm:max-h-48 overflow-y-auto space-y-1.5 sm:space-y-2 pr-2">
          {messages.slice(-5).map((msg, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
              <div className={`text-sm p-2.5 sm:p-3 rounded-lg backdrop-blur-md font-mono text-[11px] sm:text-sm ${
                msg.role === 'user' ? 'bg-cyan-500/8 border border-cyan-500/25 text-cyan-200 ml-8' :
                msg.role === 'system' ? 'bg-emerald-500/8 border border-emerald-500/25 text-emerald-200' :
                'bg-slate-800/30 border border-slate-700/40 text-slate-100'
              }`}>
                <span className="font-semibold mr-1">{msg.role === 'user' ? '>' : msg.role === 'system' ? '⚡' : '🧠'}</span>
                {msg.streaming ? <span className="animate-pulse">{msg.content || 'Thinking...'}</span>
                  : msg.role === 'assistant' ? <MessageFormatter content={msg.content} isAssistant={true} />
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

          <div className="flex gap-3 sm:gap-4">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); processCommand(); } }}
              placeholder="COMMAND FLEET AI..."
              className="flex-1 px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-950 border-2 rounded-lg sm:rounded-xl text-sm sm:text-base text-cyan-400 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:shadow-lg focus:shadow-cyan-500/30 font-mono tracking-wide backdrop-blur transition-all"
              style={{ borderColor: "rgba(6,182,212,0.5)" }}
            />
            <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" accept="*/*" />
            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} 
              className={`px-3 py-3 sm:px-4 rounded-lg transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'}`}
              style={{ color: "#06b6d4", border: "1px solid rgba(6,182,212,0.3)" }}>
              {isUploading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            </button>
            <button
              onClick={handleVoiceToggle}
              className={`px-3 py-3 sm:px-4 rounded-lg transition-all flex relative`}
              style={isListening
                ? { color: "#f87171", border: "1px solid rgba(239,68,68,0.5)", background: "rgba(239,68,68,0.1)", boxShadow: "0 0 12px rgba(239,68,68,0.2)" }
                : { color: "#06b6d4", border: "1px solid rgba(6,182,212,0.3)" }
              }
              title="Advanced Voice Control"
            >
              {isListening
                ? <><MicOff className="w-4 h-4" /><motion.span animate={{ scale: [1,1.6,1], opacity:[1,0.3,1] }} transition={{ duration: 0.8, repeat: Infinity }} className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-400" /></>
                : <Mic className="w-4 h-4" />
              }
            </button>
            <button onClick={processCommand} disabled={!input.trim()} 
              className="px-4 py-3 sm:px-5 rounded-lg font-mono tracking-widest uppercase text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: "#06b6d4", border: "1px solid rgba(6,182,212,0.5)", background: "rgba(6,182,212,0.08)", boxShadow: "0 0 12px rgba(6,182,212,0.15)" }}>
              SEND
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2"><Zap className="w-3 h-3 text-cyan-500" /><span>Press Enter to send • <span style={{color:"rgba(6,182,212,0.7)"}}>Mic for voice control</span></span></div>
          <span className="text-slate-600">{uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s) ready` : 'Attach files for AI analysis'}</span>
        </div>
      </div>
    </div>
  );
}