import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";

/**
 * AIAgentCursor v3 — Ultra-smooth AI cursor with spring physics,
 * particle trail, click ripple, typing overlay, and status banner.
 */
export default function AIAgentCursor() {
  const rawX = useMotionValue(-200);
  const rawY = useMotionValue(-200);
  const x = useSpring(rawX, { stiffness: 160, damping: 20, mass: 0.8 });
  const y = useSpring(rawY, { stiffness: 160, damping: 20, mass: 0.8 });

  const [visible, setVisible] = useState(false);
  const [ripple, setRipple] = useState(null);
  const [actionLabel, setActionLabel] = useState(null);
  const [typingText, setTypingText] = useState(null);
  const [status, setStatus] = useState("idle");
  const [taskBanner, setTaskBanner] = useState(null);
  const [trail, setTrail] = useState([]);

  const hideTimer = useRef(null);
  const typingTimer = useRef(null);
  const trailTimer = useRef(null);

  // Track cursor position for trail
  const posRef = useRef({ x: 0, y: 0 });

  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      setActionLabel(null);
      setTypingText(null);
      setRipple(null);
      setStatus("idle");
      setTaskBanner(null);
      setTrail([]);
    }, 5000);
  }, []);

  const moveTo = useCallback((px, py) => {
    rawX.set(px);
    rawY.set(py);
    posRef.current = { x: px, y: py };
    setVisible(true);
    clearTimeout(hideTimer.current);
    // Add trail dot
    setTrail(prev => [...prev.slice(-12), { x: px, y: py, id: Date.now() + Math.random() }]);
  }, [rawX, rawY]);

  useEffect(() => {
    const onAction = (e) => {
      const { type, label, selector, value, x: ex, y: ey } = e.detail || {};

      let el = null;
      if (selector) { try { el = document.querySelector(selector); } catch {} }
      if (!el && label) {
        const all = [...document.querySelectorAll("button, [role='button'], [role='tab'], input, textarea, select, a, label")];
        el = all.find(b => b.textContent?.trim().toLowerCase() === label?.toLowerCase())
          || all.find(b => b.textContent?.trim().toLowerCase().includes(label?.toLowerCase()))
          || all.find(b => b.placeholder?.toLowerCase().includes(label?.toLowerCase()));
      }

      let cx = ex ?? window.innerWidth / 2;
      let cy = ey ?? window.innerHeight / 2;

      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0) {
          cx = rect.left + rect.width / 2;
          cy = rect.top + rect.height / 2;
        }
      }

      moveTo(cx, cy);

      if (type === "click") {
        setActionLabel(`Klikker: ${label || "element"}`);
        setRipple({ x: cx, y: cy, id: Date.now() });
        setTimeout(() => {
          if (el) el.click();
        }, 320);
        setTimeout(() => setRipple(null), 700);
        setTimeout(() => setActionLabel(null), 1500);

      } else if (type === "type") {
        setActionLabel(`Skriver...`);
        clearInterval(typingTimer.current);
        let i = 0;
        const text = value || "";
        typingTimer.current = setInterval(() => {
          i++;
          setTypingText(text.slice(0, i));
          if (i >= text.length) {
            clearInterval(typingTimer.current);
            setTimeout(() => { setTypingText(null); setActionLabel(null); }, 1200);
          }
        }, 50);
        if (el) {
          setTimeout(() => {
            el.focus();
            const proto = el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
            const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
            if (setter) {
              setter.call(el, value || "");
              el.dispatchEvent(new Event("input", { bubbles: true }));
              el.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }, text.length * 50 + 300);
        }

      } else if (type === "hover") {
        setActionLabel(`Læser: ${label || ""}`);
        if (el) el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
        setTimeout(() => setActionLabel(null), 1800);

      } else if (type === "scroll") {
        setActionLabel(`Scroller ${value || label || "ned"}...`);
        setTimeout(() => setActionLabel(null), 1200);
      }

      scheduleHide();
    };

    const onStatus = (e) => {
      const { status: s, task } = e.detail || {};
      setStatus(s || "idle");
      if (s === "working" || s === "thinking") {
        setTaskBanner(task || null);
        setVisible(true);
        clearTimeout(hideTimer.current);
      } else if (s === "idle") {
        scheduleHide();
        setTimeout(() => setTaskBanner(null), 2000);
      }
    };

    window.addEventListener("harbor_ai_action", onAction);
    window.addEventListener("harbor_ai_status", onStatus);
    return () => {
      window.removeEventListener("harbor_ai_action", onAction);
      window.removeEventListener("harbor_ai_status", onStatus);
    };
  }, [moveTo, scheduleHide]);

  if (!visible) return null;

  const isThinking = status === "thinking";
  const cursorColor = isThinking ? "#f59e0b" : "#06b6d4";
  const cursorColor2 = isThinking ? "#ef4444" : "#8b5cf6";

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]" aria-hidden>

      {/* Trail particles */}
      {trail.map((t, i) => (
        <motion.div
          key={t.id}
          className="absolute rounded-full pointer-events-none"
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 0.2 }}
          transition={{ duration: 0.8 }}
          style={{
            left: t.x - 3,
            top: t.y - 3,
            width: 6, height: 6,
            background: i % 2 === 0 ? cursorColor : cursorColor2,
            boxShadow: `0 0 8px ${cursorColor}`,
          }}
        />
      ))}

      {/* Main cursor */}
      <motion.div className="absolute pointer-events-none" style={{ left: x, top: y, x: -8, y: -8 }}>
        {/* Outer pulse ring */}
        <motion.div
          className="absolute rounded-full"
          animate={{ scale: isThinking ? [1, 2, 1] : [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: isThinking ? 0.6 : 1.4, repeat: Infinity }}
          style={{ width: 36, height: 36, top: -10, left: -10,
            background: `radial-gradient(circle, ${cursorColor}55, transparent)` }}
        />
        {/* Second ring */}
        <motion.div
          className="absolute rounded-full border"
          animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          style={{ width: 24, height: 24, top: -4, left: -4, borderColor: cursorColor2 }}
        />
        {/* Core dot */}
        <div style={{
          width: 16, height: 16, borderRadius: "50%",
          background: `linear-gradient(135deg, ${cursorColor}, ${cursorColor2})`,
          boxShadow: `0 0 16px ${cursorColor}, 0 0 32px ${cursorColor2}40`,
          border: "2px solid rgba(255,255,255,0.95)"
        }} />
        {/* Label badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute left-5 top-0 text-[8px] font-black font-mono uppercase tracking-widest px-2 py-0.5 rounded-md whitespace-nowrap"
          style={{
            color: cursorColor,
            background: "rgba(2,6,16,0.95)",
            border: `1px solid ${cursorColor}55`,
            boxShadow: `0 0 10px ${cursorColor}20`
          }}>
          {isThinking ? "⚡ AI TÆNKER" : "🤖 H.A.R.B.O.R"}
        </motion.div>
      </motion.div>

      {/* Click ripple */}
      <AnimatePresence>
        {ripple && (
          <motion.div key={ripple.id} className="absolute rounded-full pointer-events-none"
            initial={{ width: 8, height: 8, opacity: 1, x: ripple.x - 4, y: ripple.y - 4 }}
            animate={{ width: 60, height: 60, opacity: 0, x: ripple.x - 30, y: ripple.y - 30 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ border: `2px solid ${cursorColor}`, boxShadow: `0 0 24px ${cursorColor}` }}
          />
        )}
      </AnimatePresence>

      {/* Second click ripple (delay) */}
      <AnimatePresence>
        {ripple && (
          <motion.div key={`r2-${ripple.id}`} className="absolute rounded-full pointer-events-none"
            initial={{ width: 8, height: 8, opacity: 0.6, x: ripple.x - 4, y: ripple.y - 4 }}
            animate={{ width: 40, height: 40, opacity: 0, x: ripple.x - 20, y: ripple.y - 20 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{ border: `1px solid ${cursorColor2}`, boxShadow: `0 0 12px ${cursorColor2}` }}
          />
        )}
      </AnimatePresence>

      {/* Action label */}
      <AnimatePresence>
        {actionLabel && (
          <motion.div key="al" initial={{ opacity: 0, scale: 0.85, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85 }}
            className="absolute pointer-events-none px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold"
            style={{
              left: x, top: y, transform: "translate(14px, 14px)",
              background: "rgba(2,6,16,0.96)",
              border: `1px solid ${cursorColor}55`,
              color: cursorColor,
              boxShadow: `0 0 20px ${cursorColor}20`,
              zIndex: 9998
            }}>
            🖱 {actionLabel}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Typing overlay */}
      <AnimatePresence>
        {typingText !== null && (
          <motion.div key="type" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute pointer-events-none px-3 py-2 rounded-xl text-xs font-mono max-w-[260px]"
            style={{
              left: x, top: y, transform: "translate(14px, 40px)",
              background: "rgba(2,6,16,0.96)",
              border: "1px solid rgba(139,92,246,0.5)",
              color: "#a78bfa",
              boxShadow: "0 0 20px rgba(139,92,246,0.15)",
              zIndex: 9998
            }}>
            ⌨️ {typingText}<motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>|</motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task banner - fixed top center */}
      <AnimatePresence>
        {taskBanner && (
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-2.5 rounded-2xl text-xs font-mono font-bold"
            style={{
              background: "rgba(2,6,16,0.97)",
              border: `1px solid ${cursorColor}55`,
              color: cursorColor,
              boxShadow: `0 0 40px ${cursorColor}20, 0 8px 32px rgba(0,0,0,0.4)`,
              zIndex: 9997
            }}>
            <motion.div className="w-2 h-2 rounded-full"
              animate={{ scale: [1, 1.6, 1], opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.7, repeat: Infinity }}
              style={{ background: cursorColor, boxShadow: `0 0 8px ${cursorColor}` }} />
            🤖 AI Agent: {taskBanner}
            <motion.div className="w-2 h-2 rounded-full"
              animate={{ scale: [1, 1.6, 1], opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.7, repeat: Infinity, delay: 0.35 }}
              style={{ background: cursorColor2, boxShadow: `0 0 8px ${cursorColor2}` }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}