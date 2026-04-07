import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";

/**
 * AIAgentCursor — A smooth glowing AI cursor that travels to elements
 * and performs human-like interactions: click, type, scroll, hover.
 *
 * Events dispatched on `window`:
 *   harbor_ai_action: { type, label, selector, value, x?, y? }
 *   harbor_ai_status: { status: "working"|"idle"|"thinking", task? }
 */

export function findElementByLabel(label) {
  if (!label) return null;
  const lower = label.toLowerCase().trim();
  // Try button/tab/link text match
  const candidates = [...document.querySelectorAll(
    "button, [role='button'], [role='tab'], a, input, textarea, select, label, [data-ai-target]"
  )];
  // Exact match first
  let el = candidates.find(e => e.textContent?.trim().toLowerCase() === lower);
  if (el) return el;
  // Partial match
  el = candidates.find(e => e.textContent?.trim().toLowerCase().includes(lower));
  if (el) return el;
  // Placeholder match for inputs
  el = candidates.find(e => e.placeholder?.toLowerCase().includes(lower));
  return el || null;
}

export default function AIAgentCursor() {
  const cursorX = useMotionValue(window.innerWidth / 2);
  const cursorY = useMotionValue(window.innerHeight / 2);
  const springX = useSpring(cursorX, { stiffness: 180, damping: 22 });
  const springY = useSpring(cursorY, { stiffness: 180, damping: 22 });

  const [visible, setVisible] = useState(false);
  const [clickRipple, setClickRipple] = useState(null);
  const [actionLabel, setActionLabel] = useState(null);
  const [typing, setTyping] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | thinking | working
  const [currentTask, setCurrentTask] = useState(null);
  const hideTimerRef = useRef(null);
  const typingIntervalRef = useRef(null);

  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      setActionLabel(null);
      setTyping(null);
      setClickRipple(null);
      setStatus("idle");
      setCurrentTask(null);
    }, 4000);
  }, []);

  const moveTo = useCallback((x, y) => {
    setVisible(true);
    clearTimeout(hideTimerRef.current);
    cursorX.set(x);
    cursorY.set(y);
  }, [cursorX, cursorY]);

  const doClick = useCallback((x, y, label) => {
    moveTo(x, y);
    setActionLabel(`Clicking: ${label}`);
    setClickRipple({ x, y, id: Date.now() });
    setTimeout(() => setClickRipple(null), 700);
    scheduleHide();
  }, [moveTo, scheduleHide]);

  const doType = useCallback((x, y, text) => {
    moveTo(x, y);
    setActionLabel(`Typing...`);
    clearInterval(typingIntervalRef.current);
    let i = 0;
    typingIntervalRef.current = setInterval(() => {
      i++;
      setTyping(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(typingIntervalRef.current);
        scheduleHide();
      }
    }, 55);
  }, [moveTo, scheduleHide]);

  useEffect(() => {
    const onAction = (e) => {
      const { type, label, selector, value, x: ex, y: ey } = e.detail || {};

      // Find target element
      let el = null;
      if (selector) {
        try { el = document.querySelector(selector); } catch {}
      }
      if (!el && label) el = findElementByLabel(label);

      let cx = ex || window.innerWidth / 2;
      let cy = ey || window.innerHeight / 2;

      if (el) {
        const rect = el.getBoundingClientRect();
        // Only use elements that are visible in viewport
        if (rect.width > 0 && rect.height > 0) {
          cx = rect.left + rect.width / 2;
          cy = rect.top + rect.height / 2;
        }
      }

      if (type === "click") {
        doClick(cx, cy, label || "element");
        if (el) setTimeout(() => el.click(), 350);
      } else if (type === "type") {
        doType(cx, cy, value || "");
        if (el) {
          setTimeout(() => {
            el.focus();
            // React-compatible value setter
            const proto = el.tagName === "TEXTAREA"
              ? window.HTMLTextAreaElement.prototype
              : window.HTMLInputElement.prototype;
            const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
            if (setter) {
              setter.call(el, value || "");
              el.dispatchEvent(new Event("input", { bubbles: true }));
              el.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }, (value?.length || 5) * 55 + 300);
        }
      } else if (type === "scroll") {
        moveTo(cx, cy);
        setActionLabel(`Scrolling ${value || "down"}...`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        scheduleHide();
      } else if (type === "hover") {
        moveTo(cx, cy);
        setActionLabel(`Examining: ${label || ""}`);
        if (el) el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
        scheduleHide();
      }
    };

    const onStatus = (e) => {
      const { status: s, task } = e.detail || {};
      setStatus(s || "idle");
      setCurrentTask(task || null);
      if (s === "working" || s === "thinking") setVisible(true);
    };

    window.addEventListener("harbor_ai_action", onAction);
    window.addEventListener("harbor_ai_status", onStatus);
    return () => {
      window.removeEventListener("harbor_ai_action", onAction);
      window.removeEventListener("harbor_ai_status", onStatus);
      clearTimeout(hideTimerRef.current);
      clearInterval(typingIntervalRef.current);
    };
  }, [doClick, doType, moveTo, scheduleHide]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]" aria-hidden>
      {/* Cursor body */}
      <motion.div
        className="absolute"
        style={{ left: springX, top: springY, x: -8, y: -8, pointerEvents: "none" }}
      >
        {/* Glow */}
        <motion.div
          className="absolute rounded-full"
          animate={{ scale: status === "thinking" ? [1, 1.8, 1] : [1, 1.3, 1], opacity: [0.4, 0.1, 0.4] }}
          transition={{ duration: status === "thinking" ? 0.7 : 1.5, repeat: Infinity }}
          style={{ width: 32, height: 32, top: -8, left: -8, background: "radial-gradient(circle, rgba(6,182,212,0.5), transparent)" }}
        />
        {/* Dot */}
        <div style={{
          width: 16, height: 16, borderRadius: "50%",
          background: status === "thinking"
            ? "linear-gradient(135deg, #f59e0b, #ef4444)"
            : "linear-gradient(135deg, #06b6d4, #8b5cf6)",
          boxShadow: status === "thinking"
            ? "0 0 14px rgba(245,158,11,0.9), 0 0 28px rgba(239,68,68,0.4)"
            : "0 0 14px rgba(6,182,212,0.9), 0 0 28px rgba(139,92,246,0.5)",
          border: "2px solid rgba(255,255,255,0.9)"
        }} />
        {/* Badge */}
        <div className="absolute whitespace-nowrap text-[8px] font-mono font-black px-1.5 py-0.5 rounded"
          style={{
            left: 18, top: 0,
            color: status === "thinking" ? "#f59e0b" : "#06b6d4",
            background: "rgba(2,8,18,0.92)",
            border: `1px solid ${status === "thinking" ? "rgba(245,158,11,0.5)" : "rgba(6,182,212,0.4)"}`
          }}>
          {status === "thinking" ? "⚡ THINKING" : "🤖 H.A.R.B.O.R"}
        </div>
      </motion.div>

      {/* Click ripple */}
      <AnimatePresence>
        {clickRipple && (
          <motion.div
            key={clickRipple.id}
            className="absolute rounded-full"
            initial={{ width: 10, height: 10, opacity: 0.9 }}
            animate={{ width: 52, height: 52, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            style={{
              left: clickRipple.x - 5, top: clickRipple.y - 5,
              border: "2px solid #06b6d4",
              boxShadow: "0 0 20px rgba(6,182,212,0.7)"
            }}
          />
        )}
      </AnimatePresence>

      {/* Action label */}
      <AnimatePresence>
        {actionLabel && (
          <motion.div
            key="lbl"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className="absolute px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold"
            style={{
              left: springX, top: springY,
              transform: "translate(14px, 14px)",
              background: "rgba(2,8,18,0.95)",
              border: "1px solid rgba(6,182,212,0.5)",
              color: "#06b6d4",
              boxShadow: "0 0 16px rgba(6,182,212,0.2)"
            }}
          >
            🖱 {actionLabel}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Typing text */}
      <AnimatePresence>
        {typing && (
          <motion.div
            key="type"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute px-3 py-2 rounded-xl text-xs font-mono max-w-xs"
            style={{
              left: springX, top: springY,
              transform: "translate(14px, 40px)",
              background: "rgba(2,8,18,0.95)",
              border: "1px solid rgba(139,92,246,0.5)",
              color: "#a78bfa",
              boxShadow: "0 0 16px rgba(139,92,246,0.2)"
            }}
          >
            ⌨️ {typing}<span className="animate-pulse">|</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current task banner (top center) */}
      <AnimatePresence>
        {currentTask && (status === "working" || status === "thinking") && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2.5"
            style={{
              background: "rgba(2,8,18,0.97)",
              border: "1px solid rgba(6,182,212,0.5)",
              color: "#06b6d4",
              boxShadow: "0 0 30px rgba(6,182,212,0.2)",
              zIndex: 9998
            }}
          >
            <motion.div
              className="w-2 h-2 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{ background: "#06b6d4", boxShadow: "0 0 8px #06b6d4" }}
            />
            🤖 AI Agent: {currentTask}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}