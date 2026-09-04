"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const AUTO_CLOSE_MS = 3_500;
const EDGE_GAP = 12;

export default function HelpNote({ content, label = "הסבר נוסף", faqHref, wide = false, autoClose = true }: {
  content?: ReactNode;
  label?: string;
  faqHref?: string;
  wide?: boolean;
  autoClose?: boolean;
}) {
  const id = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const autoCloseTimerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 320 });
  const empty = content == null || content === false || (typeof content === "string" && !content.trim());

  const clearAutoClose = useCallback(() => {
    if (autoCloseTimerRef.current != null) {
      window.clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  }, []);

  const close = useCallback((fade = false) => {
    clearAutoClose();
    if (fade) {
      setClosing(true);
      window.setTimeout(() => {
        setOpen(false);
        setClosing(false);
      }, 180);
      return;
    }
    setOpen(false);
    setClosing(false);
  }, [clearAutoClose]);

  const scheduleAutoClose = useCallback(() => {
    clearAutoClose();
    if (!autoClose) return;
    autoCloseTimerRef.current = window.setTimeout(
      () => close(true),
      AUTO_CLOSE_MS
    );
  }, [autoClose, clearAutoClose, close]);

  const placePopup = useCallback(() => {
    const trigger = buttonRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(wide ? 760 : 340, window.innerWidth - EDGE_GAP * 2);
    const popupHeight = popupRef.current?.offsetHeight || 180;
    const roomBelow = window.innerHeight - rect.bottom;
    const showBelow = roomBelow >= popupHeight + EDGE_GAP || rect.top < popupHeight + EDGE_GAP;
    const top = showBelow
      ? Math.min(rect.bottom + 8, window.innerHeight - popupHeight - EDGE_GAP)
      : Math.max(EDGE_GAP, rect.top - popupHeight - 8);
    const preferredLeft = document.documentElement.dir === "rtl" ? rect.right - width : rect.left;
    const left = Math.min(Math.max(EDGE_GAP, preferredLeft), window.innerWidth - width - EDGE_GAP);
    setPosition({ top: Math.max(EDGE_GAP, top), left, width });
  }, []);

  useEffect(() => {
    if (!open) return;
    placePopup();
    const frame = window.requestAnimationFrame(placePopup);
    scheduleAutoClose();
    const onOtherOpened = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== id) close();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!buttonRef.current?.contains(target) && !popupRef.current?.contains(target)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("help-note-open", onOtherOpened as EventListener);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", placePopup);
    window.addEventListener("scroll", placePopup, true);
    return () => {
      window.cancelAnimationFrame(frame);
      clearAutoClose();
      window.removeEventListener("help-note-open", onOtherOpened as EventListener);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", placePopup);
      window.removeEventListener("scroll", placePopup, true);
    };
  }, [clearAutoClose, close, id, open, placePopup, scheduleAutoClose]);

  if (empty) return null;
  const toggle = () => {
    if (open) return close();
    window.dispatchEvent(new CustomEvent("help-note-open", { detail: id }));
    setOpen(true);
  };

  return (
    <span className="help-note">
      <button ref={buttonRef} type="button" className="help-note-trigger" aria-label={label}
        aria-expanded={open} aria-controls={`${id}-popup`} onClick={toggle}>i</button>
      {open && typeof document !== "undefined" && createPortal(
        <div ref={popupRef} id={`${id}-popup`} role="note"
          className={`help-note-content${closing ? " is-closing" : ""}`} style={position}
          onPointerEnter={clearAutoClose}
          onPointerLeave={scheduleAutoClose}
          onPointerDown={clearAutoClose}
          onPointerUp={scheduleAutoClose}
          onScroll={scheduleAutoClose}>
          <div className="help-note-text">{content}</div>
          {faqHref && <a href={faqHref} target="_blank" rel="noopener noreferrer">להסבר נוסף ב־FAQ ↗</a>}
        </div>, document.body
      )}
    </span>
  );
}
