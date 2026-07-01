import { useRef, useState } from "react";
import type { FlashCard as FlashCardType, HintLevel } from "../../types";
import "./FlashCard.css";

function getHintText(card: FlashCardType, level: HintLevel): string {
  if (level === 0) return "";
  if (level === 3) return card.pinyin;
  const syllables = card.pinyinPlain.split(" ");
  if (level === 1) return syllables[0]?.[0] ?? "";
  return syllables.map((s) => s[0]).join(" ");
}

interface Props {
  card: FlashCardType;
  isFlipped: boolean;
  hintLevel: HintLevel;
  onFlip: () => void;
  onSwipe: (dir: "left" | "right") => void;
}

const SWIPE_THRESHOLD = 80;

export function FlashCard({ card, isFlipped, hintLevel, onFlip, onSwipe }: Props) {
  const [dragX, setDragX] = useState(0);
  const dragXRef = useRef(0);
  const startXRef = useRef<number | null>(null);
  const didDragRef = useRef(false);
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    startXRef.current = e.clientX;
    didDragRef.current = false;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (startXRef.current === null) return;
    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 8) didDragRef.current = true;
    dragXRef.current = dx;
    setDragX(dx);
  }

  function onPointerUp() {
    if (startXRef.current === null) return;
    startXRef.current = null;
    const dx = dragXRef.current;

    if (!didDragRef.current) {
      dragXRef.current = 0;
      setDragX(0);
      onFlip();
      return;
    }

    if (Math.abs(dx) >= SWIPE_THRESHOLD) {
      const dir = dx < 0 ? "left" : "right";
      setExiting(dir);
      setTimeout(() => {
        setExiting(null);
        dragXRef.current = 0;
        setDragX(0);
        onSwipe(dir);
      }, 280);
    } else {
      dragXRef.current = 0;
      setDragX(0);
    }
  }

  const rotate = dragX / 18;
  const activeDir: "left" | "right" | null =
    exiting ?? (Math.abs(dragX) >= SWIPE_THRESHOLD ? (dragX < 0 ? "left" : "right") : null);
  const indicatorOpacity = Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1);

  const wrapperStyle: React.CSSProperties = exiting
    ? {
        transform: `translateX(${exiting === "left" ? "-130%" : "130%"}) rotate(${exiting === "left" ? -20 : 20}deg)`,
        transition: "transform 0.28s ease-in",
      }
    : {
        transform: `translateX(${dragX}px) rotate(${rotate}deg)`,
        transition: startXRef.current !== null ? "none" : "transform 0.3s ease",
      };

  return (
    <div
      className="fc-wrapper"
      style={wrapperStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {activeDir === "left" && (
        <div className="fc-indicator fc-got" style={{ opacity: indicatorOpacity }}>
          ✓ Got it
        </div>
      )}
      {activeDir === "right" && (
        <div className="fc-indicator fc-again" style={{ opacity: indicatorOpacity }}>
          ✗ Again
        </div>
      )}

      <div className={`fc${isFlipped ? " fc-flipped" : ""}`}>
        <div className="fc-face fc-front">
          <span className="fc-chars">{card.characters}</span>
          {hintLevel > 0 && (
            <span className="fc-hint">{getHintText(card, hintLevel)}</span>
          )}
          <span className="fc-tap-label">tap to reveal</span>
        </div>
        <div className="fc-face fc-back">
          <span className="fc-pinyin">{card.pinyin}</span>
          <span className="fc-english">{card.english}</span>
          <span className="fc-chars-back">{card.characters}</span>
        </div>
      </div>
    </div>
  );
}
