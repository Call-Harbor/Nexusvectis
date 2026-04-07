import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * AIAgentCursor — renders a glowing AI cursor that visually navigates
 * the UI like a human: moves to elements, clicks, types, scrolls.
 *
 * Listens for `harbor_ai_action` custom events on `window`.
 * Event detail: { type: "click"|"type"|"scroll"|"focus"|"read", target?, value?, label? }
 */
export default function AIAgentCursor() {
  const [cursor, setCursor] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2, visible: false });
  const [action, setAction] = useState(null); // { kind: "click"|"type", label }
  const [trail, setTrail] = useState([]);
  const [typing, setTyping] = useState(null); // { text, progress }
  const timeoutRef = useRef(null);

  const moveTo = useCallback((x, y) => {
    setCursor({ x, y, visible: true });
    setTrail(prev => [...prev.slice(-8), { x, y, id: Date.now() }]);
  }, []);

  const animateClick = useCallback((x, y, label) => {
    moveTo(x, y);
    setAction({ kind: "click", label, x, y });
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setAction(null), 1200);
  }, [moveTo]);

  const animateType = useCallback((x, y, text) => {
    moveTo(x, y);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTyping({ text, progress: text.slice(0, i) });
      if (i >= text.length) {
        clearInterval(interval);
        setTimeout(() => setTyping(null), 1000);
      }
    }, 60);
  }, [moveTo]);

  const hideCursor = useCallback(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setCursor(c => ({ ...c, visible: false }));
      setTrail([]);
      setTyping(null);
      setAction(null);
    }, 3000);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const { type, selector, value, label, windowId } = e.detail || {};

      // Find DOM element by selector or text content
      let el = null;
      if (selector) {
        try {
          el = document.querySelector(selector);
        } catch {}
      }
      if (!el && label) {
        // Find button/element by text
        const allBtns = [...document.querySelectorAll("button, [role='button'], a, [role='tab']")];
        el = allBtns.find(b => b.textContent?.trim().toLowerCase().includes(label.toLowerCase()));
      }

      if (el) {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        if (type === "click") {
          animateClick(cx, cy, label || el.textContent?.trim().slice(0, 20));
          setTimeout(() => { el.click(); }, 400);
        } else if (type === "type") {
          animateType(cx, cy, value || "");
          setTimeout(() => {
            el.focus();
            const nativeInput = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value') ||
                                Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
            if (nativeInput) {
              nativeInput.set.call(el, value || "");
              el.dispatchEvent(new Event("input", { bubbles: true }));
              el.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }, (value?.length || 5) * 60 + 200);
        } else if (type === "scroll") {
          moveTo(cx, cy);
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (type === "focus") {
          moveTo(cx, cy);
          el.focus?.();
        }
      } else {
        // Move to approximate center of screen or given coords
        const x = e.detail?.x || window.innerWidth / 2;
        const y = e.detail?.y || window.innerHeight / 2;
        moveTo(x, y);
        if (type === "click") {
          setAction({ kind: "click", label: label || "element", x, y });
          clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => setAction(null), 1200);
        }
      }

      hideCursor();
    };

    window.addEventListener("harbor_ai_action", handler);
    return () => window.removeEventListener("harbor_ai_action", handler);
  }, [animateClick, animateType, moveTo, hideCursor]);

  if (!cursor.visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {/* Trail */}
      {trail.map((t, i) => (
        <motion.div
          key={t.id}
          className="absolute w-2 h-2 rounded-full"
          initial={{ opacity: 0.5, scale: 1 }}
          animate={{ opacity: 0, scale: 0.3 }}
          transition={{ duration: 0.5 }}
          style={{
            left: t.x - 4, top: t.y - 4,
            background: `rgba(6,182,212,${0.15 + i * 0.05})`,
            boxShadow: "0 0 6px rgba(6,182,212,0.4)"
          }}
        />
      ))}

      {/* Main cursor */}
      <motion.div
        animate={{ left: cursor.x - 8, top: cursor.y - 8 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="absolute"
        style={{ pointerEvents: "none" }}
      >
        {/* Outer glow ring */}
        <motion.div
          className="absolute -inset-2 rounded-full"
          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.4), transparent)", width: 28, height: 28 }}
        />
        {/* Cursor dot */}
        <div
          className="w-4 h-4 rounded-full relative"
          style={{
            background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
            boxShadow: "0 0 12px rgba(6,182,212,0.8), 0 0 24px rgba(139,92,246,0.4)",
            border: "2px solid rgba(255,255,255,0.8)"
          }}
        />
        {/* AI label */}
        <div
          className="absolute left-5 top-0 text-[9px] font-mono font-bold whitespace-nowrap px-1.5 py-0.5 rounded"
          style={{ color: "#06b6d4", background: "rgba(2,8,18,0.9)", border: "1px solid rgba(6,182,212,0.4)" }}
        >
          H.A.R.B.O.R AI
        </div>
      </motion.div>

      {/* Click ripple */}
      <AnimatePresence>
        {action?.kind === "click" && (
          <motion.div
            key={`click-${action.x}-${action.y}`}
            className="absolute rounded-full border-2"
            initial={{ width: 12, height: 12, opacity: 1, x: action.x - 6, y: action.y - 6 }}
            animate={{ width: 48, height: 48, opacity: 0, x: action.x - 24, y: action.y - 24 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ borderColor: "#06b6d4", boxShadow: "0 0 16px rgba(6,182,212,0.6)", pointerEvents: "none" }}
          />
        )}
      </AnimatePresence>

      {/* Action label */}
      <AnimatePresence>
        {action && (
          <motion.div
            key="action-label"
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.9 }}
            className="absolute px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold"
            style={{
              left: cursor.x + 16,
              top: cursor.y + 16,
              background: "rgba(2,8,18,0.95)",
              border: "1px solid rgba(6,182,212,0.5)",
              color: "#06b6d4",
              boxShadow: "0 0 20px rgba(6,182,212,0.2)"
            }}
          >
            {action.kind === "click" ? `🖱 Clicking: ${action.label}` : `⌨️ Typing...`}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Typing overlay */}
      <AnimatePresence>
        {typing && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute px-3 py-2 rounded-xl text-xs font-mono"
            style={{
              left: cursor.x + 16, top: cursor.y + 40,
              background: "rgba(2,8,18,0.95)",
              border: "1px solid rgba(139,92,246,0.5)",
              color: "#a78bfa",
              maxWidth: 240,
              boxShadow: "0 0 20px rgba(139,92,246,0.2)"
            }}
          >
            {typing.progress}<span className="animate-pulse">|</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}