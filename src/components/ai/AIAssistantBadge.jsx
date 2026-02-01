import { motion } from "framer-motion";
import { Sparkles, MessageCircle } from "lucide-react";
import { useState } from "react";

export default function AIAssistantBadge() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div className="fixed bottom-6 right-6 z-40">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          className="absolute bottom-16 right-0 w-80 p-4 rounded-2xl bg-slate-900/95 border border-violet-500/30 backdrop-blur-xl shadow-2xl"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h3 className="font-semibold text-white text-sm">AI Assistant</h3>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            I'm analyzing your fleet in real-time. Ask me anything about optimization, predictive insights, or route planning.
          </p>
          <div className="text-xs text-slate-500">
            💡 "Suggest fuel savings opportunities"<br />
            📊 "Analyze vehicle efficiency"<br />
            ⚠️ "Predict maintenance issues"
          </div>
        </motion.div>
      )}

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg hover:shadow-violet-500/50 transition-shadow flex items-center justify-center"
      >
        {isOpen ? (
          <MessageCircle className="w-6 h-6 text-white" />
        ) : (
          <Sparkles className="w-6 h-6 text-white animate-pulse" />
        )}
      </motion.button>
    </motion.div>
  );
}