import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import {
  Brain, Send, X, Plus, Trash2, MessageSquare, Loader2,
  Sparkles, ChevronDown, Zap, Activity, Bot, User,
  Copy, CheckCheck, AlertCircle, Minimize2, Maximize2,
  Clock, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

const AGENT_NAME = "harbor_intellect";

const QUICK_PROMPTS = [
  "Analyze the fleet's overall performance and give me a strategic report",
  "Identify all critical alerts and recommend actions",
  "What is the total CO₂ emissions for all active shipments?",
  "Give me a compliance overview across all modules",
  "Optimize all active routes and estimate savings",
  "Show me a risk assessment of the entire operation",
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.div key={i} className="w-2 h-2 rounded-full"
          animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay }}
          style={{ background: "#06b6d4", boxShadow: "0 0 8px rgba(6,182,212,0.6)" }}
        />
      ))}
      <span className="text-xs text-slate-500 ml-2 font-mono">H.A.R.B.O.R thinking...</span>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isSystem) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 group ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-1"
          style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))", border: "1px solid rgba(6,182,212,0.3)" }}>
          <Brain className="w-4 h-4" style={{ color: "#06b6d4" }} />
        </div>
      )}

      <div className={`max-w-[80%] relative ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {!isUser && (
          <div className="text-[10px] font-mono tracking-widest uppercase mb-1" style={{ color: "#8b5cf6" }}>
            H.A.R.B.O.R INTELLECT
          </div>
        )}

        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed relative ${
          isUser
            ? "bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-white"
            : "text-slate-200"
        }`}
          style={!isUser ? {
            background: "rgba(15,23,42,0.8)",
            border: "1px solid rgba(6,182,212,0.15)",
            backdropFilter: "blur(10px)"
          } : {}}>

          {message.content ? (
            isUser ? (
              <p>{message.content}</p>
            ) : (
              <ReactMarkdown
                className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:leading-relaxed [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_strong]:text-cyan-300 [&_code]:text-violet-300 [&_code]:bg-violet-500/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h1]:text-cyan-400 [&_h2]:text-cyan-400 [&_h3]:text-cyan-400 [&_blockquote]:border-l-2 [&_blockquote]:border-cyan-500/50 [&_blockquote]:pl-3 [&_blockquote]:text-slate-400"
                components={{
                  a: ({ children, href }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300">
                      {children}
                    </a>
                  )
                }}
              >
                {message.content}
              </ReactMarkdown>
            )
          ) : (
            <TypingIndicator />
          )}

          {/* Tool calls */}
          {message.tool_calls?.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-slate-700/50 pt-3">
              {message.tool_calls.map((tc, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
                  <div className={`w-1.5 h-1.5 rounded-full ${tc.status === 'completed' ? 'bg-green-400' : tc.status === 'running' ? 'bg-yellow-400 animate-pulse' : 'bg-slate-500'}`} />
                  <span className="text-slate-400">{tc.name?.replace(/_/g, ' ')}</span>
                  {tc.status === 'running' && <Loader2 className="w-3 h-3 text-yellow-400 animate-spin ml-auto" />}
                  {tc.status === 'completed' && <CheckCheck className="w-3 h-3 text-green-400 ml-auto" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Copy button */}
        {!isUser && message.content && (
          <button onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity self-start mt-1 px-2 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1"
            style={{ color: "#64748b", background: "rgba(15,23,42,0.5)" }}>
            {copied ? <><CheckCheck className="w-3 h-3 text-green-400" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
          </button>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-1"
          style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.3)" }}>
          <User className="w-4 h-4" style={{ color: "#8b5cf6" }} />
        </div>
      )}
    </motion.div>
  );
}

function ConversationList({ conversations, activeId, onSelect, onCreate, onDelete }) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b" style={{ borderColor: "rgba(6,182,212,0.15)" }}>
        <button onClick={onCreate}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all"
          style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)", color: "#06b6d4" }}>
          <Plus className="w-4 h-4" />
          New conversation
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-xs font-mono">No conversations yet</div>
        )}
        {conversations.map(conv => (
          <div key={conv.id}
            onClick={() => onSelect(conv)}
            className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all text-xs ${
              activeId === conv.id
                ? "text-white"
                : "text-slate-400 hover:text-white"
            }`}
            style={activeId === conv.id ? {
              background: "rgba(6,182,212,0.1)",
              border: "1px solid rgba(6,182,212,0.25)"
            } : { border: "1px solid transparent" }}>
            <div className="flex items-center gap-2 min-w-0">
              <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-cyan-500" />
              <span className="truncate font-mono text-[11px]">
                {conv.metadata?.name || "Chat"}
              </span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 hover:text-red-400 flex-shrink-0">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HarborSuperAgentChat({ onClose }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Load conversations
  useEffect(() => {
    loadConversations();
    return () => { unsubscribeRef.current?.(); };
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const convs = await base44.agents.listConversations({ agent_name: AGENT_NAME });
      setConversations(convs || []);
      if (convs?.length > 0) {
        await selectConversation(convs[0]);
      } else {
        await createNewConversation();
      }
    } catch (err) {
      toast.error("Could not load conversations");
    }
    setIsLoading(false);
  };

  const subscribeToConversation = (convId) => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = base44.agents.subscribeToConversation(convId, (data) => {
      setMessages(data.messages || []);
    });
  };

  const selectConversation = async (conv) => {
    unsubscribeRef.current?.();
    setActiveConversation(conv);
    const full = await base44.agents.getConversation(conv.id);
    setMessages(full.messages || []);
    subscribeToConversation(conv.id);
  };

  const createNewConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: AGENT_NAME,
      metadata: { name: `Chat ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` }
    });
    setConversations(prev => [conv, ...prev]);
    setActiveConversation(conv);
    setMessages([]);
    subscribeToConversation(conv.id);
  };

  const deleteConversation = async (convId) => {
    if (activeConversation?.id === convId) {
      const remaining = conversations.filter(c => c.id !== convId);
      if (remaining.length > 0) await selectConversation(remaining[0]);
      else await createNewConversation();
    }
    setConversations(prev => prev.filter(c => c.id !== convId));
  };

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || !activeConversation || isSending) return;
    setInput("");
    setIsSending(true);
    try {
      await base44.agents.addMessage(activeConversation, { role: "user", content: msg });
    } catch {
      toast.error("Message could not be sent");
    }
    setIsSending(false);
    inputRef.current?.focus();
  }, [input, activeConversation, isSending]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isThinking = messages.length > 0 && messages[messages.length - 1]?.role === "user" && isSending;
  const visibleMessages = messages.filter(m => m.role !== "system");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="fixed z-50 flex flex-col overflow-hidden"
      style={{
        inset: isMaximized ? "12px" : undefined,
        top: isMaximized ? 12 : "5%",
        left: isMaximized ? 12 : "5%",
        right: isMaximized ? 12 : "5%",
        bottom: isMaximized ? 12 : "5%",
        background: "rgba(2,8,18,0.97)",
        border: "1px solid rgba(6,182,212,0.3)",
        borderRadius: 20,
        backdropFilter: "blur(20px)",
        boxShadow: "0 0 60px rgba(6,182,212,0.1), 0 0 120px rgba(139,92,246,0.05), inset 0 1px 0 rgba(6,182,212,0.15)"
      }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[20px]">
        <div className="absolute top-0 left-1/4 w-96 h-32 opacity-20 blur-3xl"
          style={{ background: "linear-gradient(180deg, #06b6d4, transparent)" }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-32 opacity-10 blur-3xl"
          style={{ background: "linear-gradient(0deg, #8b5cf6, transparent)" }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between px-5 py-3.5 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(6,182,212,0.15)", background: "rgba(6,182,212,0.03)" }}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, #06b6d4, #8b5cf6, transparent)" }} />
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))", border: "1px solid rgba(6,182,212,0.4)" }}>
              <Brain className="w-5 h-5" style={{ color: "#06b6d4" }} />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-black animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black font-mono tracking-widest uppercase" style={{ color: "#06b6d4" }}>
                H.A.R.B.O.R INTELLECT
              </h2>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md uppercase tracking-widest"
                style={{ color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.08)" }}>
                SUPER AI
              </span>
            </div>
            <p className="text-[10px] font-mono tracking-widest" style={{ color: "rgba(6,182,212,0.4)" }}>
              NexusVectis Neural Command Center • All Modules Active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSidebar(!showSidebar)}
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono tracking-wider flex items-center gap-1.5 transition-all"
            style={{ color: "#64748b", border: "1px solid rgba(100,116,139,0.2)", background: "rgba(15,23,42,0.5)" }}>
            <MessageSquare className="w-3 h-3" />
            {showSidebar ? "Hide" : "Chats"}
          </button>
          <button onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 rounded-lg transition-all hover:bg-slate-800/60"
            style={{ color: "#64748b" }}>
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={onClose}
            className="p-1.5 rounded-lg transition-all hover:bg-red-500/20 hover:text-red-400"
            style={{ color: "#64748b" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 overflow-hidden"
              style={{ borderRight: "1px solid rgba(6,182,212,0.1)", background: "rgba(6,182,212,0.02)" }}>
              <div style={{ width: 220 }}>
                <ConversationList
                  conversations={conversations}
                  activeId={activeConversation?.id}
                  onSelect={selectConversation}
                  onCreate={createNewConversation}
                  onDelete={deleteConversation}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.15))", border: "1px solid rgba(6,182,212,0.3)" }}>
                    <Brain className="w-8 h-8 animate-pulse" style={{ color: "#06b6d4" }} />
                  </div>
                  <motion.div className="absolute inset-0 rounded-2xl border"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ borderColor: "#06b6d4" }} />
                </div>
                <p className="text-xs font-mono tracking-widest uppercase" style={{ color: "rgba(6,182,212,0.6)" }}>
                  Initializing H.A.R.B.O.R...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {visibleMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 gap-6">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-20 h-20 rounded-full border flex items-center justify-center"
                      style={{ borderColor: "rgba(6,182,212,0.2)", background: "rgba(6,182,212,0.05)" }}>
                      <Sparkles className="w-8 h-8" style={{ color: "#06b6d4" }} />
                    </motion.div>
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-black font-mono tracking-widest uppercase" style={{ color: "#06b6d4" }}>
                        Ready for command
                      </h3>
                      <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                        H.A.R.B.O.R Intellect is your Super AI with full access to all platform modules
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
                      {QUICK_PROMPTS.slice(0, 4).map((prompt, i) => (
                        <button key={i} onClick={() => sendMessage(prompt)}
                          className="px-3 py-2.5 rounded-xl text-left text-[11px] leading-snug transition-all hover:text-white"
                          style={{
                            color: "#64748b",
                            background: "rgba(6,182,212,0.04)",
                            border: "1px solid rgba(6,182,212,0.1)"
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.3)"; e.currentTarget.style.background = "rgba(6,182,212,0.08)"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.1)"; e.currentTarget.style.background = "rgba(6,182,212,0.04)"; }}>
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {visibleMessages.map((msg, i) => (
                  <MessageBubble key={i} message={msg} />
                ))}

                {isThinking && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))", border: "1px solid rgba(6,182,212,0.3)" }}>
                      <Brain className="w-4 h-4" style={{ color: "#06b6d4" }} />
                    </div>
                    <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(6,182,212,0.15)" }}>
                      <TypingIndicator />
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick prompts strip */}
              {visibleMessages.length > 0 && (
                <div className="px-5 pb-2 flex gap-2 overflow-x-auto scrollbar-hide flex-shrink-0">
                  {QUICK_PROMPTS.slice(0, 3).map((p, i) => (
                    <button key={i} onClick={() => sendMessage(p)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-mono transition-all whitespace-nowrap"
                      style={{ color: "#64748b", border: "1px solid rgba(6,182,212,0.1)", background: "rgba(6,182,212,0.03)" }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#06b6d4"; e.currentTarget.style.borderColor = "rgba(6,182,212,0.3)"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "rgba(6,182,212,0.1)"; }}>
                      {p.length > 40 ? p.slice(0, 40) + "..." : p}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="flex-shrink-0 p-4" style={{ borderTop: "1px solid rgba(6,182,212,0.1)" }}>
                <div className="relative flex items-end gap-3 rounded-2xl p-3"
                  style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(6,182,212,0.2)", boxShadow: "0 0 20px rgba(6,182,212,0.05)" }}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Command H.A.R.B.O.R Intellect... (Enter to send)"
                    disabled={isSending}
                    rows={1}
                    className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 resize-none outline-none leading-relaxed font-light"
                    style={{ minHeight: 24, maxHeight: 120, overflowY: "auto" }}
                    onInput={e => {
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isSending}
                    className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      background: input.trim() && !isSending
                        ? "linear-gradient(135deg, #06b6d4, #8b5cf6)"
                        : "rgba(6,182,212,0.1)",
                      boxShadow: input.trim() && !isSending ? "0 0 20px rgba(6,182,212,0.3)" : "none"
                    }}>
                    {isSending
                      ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                      : <Send className="w-4 h-4 text-white" />
                    }
                  </button>
                </div>
                <p className="text-[9px] font-mono text-slate-600 text-center mt-2 tracking-wider">
                  H.A.R.B.O.R has access to all platform entities and modules
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}