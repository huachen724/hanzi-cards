import { useCallback, useEffect, useState } from "react";
import type { FlashCard, HintLevel, CardOutcome } from "../../types";
import { FlashCard as FlashCardComp } from "../FlashCard/FlashCard";
import "./DeckView.css";

interface Props {
  cards: FlashCard[];
  onDone: (outcomes: CardOutcome[]) => void;
}

export function DeckView({ cards, onDone }: Props) {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [hintLevel, setHintLevel] = useState<HintLevel>(0);
  const [outcomes, setOutcomes] = useState<CardOutcome[]>([]);

  const card = cards[index];

  const advance = useCallback(
    (outcome: CardOutcome) => {
      const next = [...outcomes, outcome];
      if (index + 1 >= cards.length) {
        onDone(next);
      } else {
        setOutcomes(next);
        setIndex((i) => i + 1);
        setIsFlipped(false);
        setHintLevel(0);
      }
    },
    [outcomes, index, cards.length, onDone],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.key === "ArrowLeft") {
        advance("got-it");
      } else if (e.key === "ArrowRight") {
        advance("missed");
      } else if (e.key === "h" || e.key === "H") {
        setHintLevel((l) => Math.min(l + 1, 3) as HintLevel);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance]);

  if (!card) return null;

  const progress = (index / cards.length) * 100;

  const hintLabel =
    hintLevel === 0 ? "Hint" : hintLevel === 1 ? "More hint" : hintLevel === 2 ? "Full pinyin" : "Pinyin shown";

  return (
    <div className="deck-view">
      <div className="deck-top">
        <div className="deck-progress-bar">
          <div className="deck-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="deck-counter">
          {index + 1} / {cards.length}
        </span>
      </div>

      <div className="deck-card-area">
        <FlashCardComp
          card={card}
          isFlipped={isFlipped}
          hintLevel={hintLevel}
          onFlip={() => setIsFlipped((f) => !f)}
          onSwipe={(dir) => advance(dir === "left" ? "got-it" : "missed")}
        />
      </div>

      <div className="deck-controls">
        <button
          className="deck-hint-btn"
          onClick={() => setHintLevel((l) => Math.min(l + 1, 3) as HintLevel)}
          disabled={hintLevel >= 3}
        >
          {hintLabel}
        </button>

        <div className="deck-swipe-btns">
          <button className="deck-btn deck-got" onClick={() => advance("got-it")}>
            ← Got it
          </button>
          <button className="deck-btn deck-again" onClick={() => advance("missed")}>
            Again →
          </button>
        </div>

        <p className="deck-kb-hint">space = flip · ← got it · → again · H = hint</p>
      </div>
    </div>
  );
}
