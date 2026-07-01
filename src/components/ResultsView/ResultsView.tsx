import type { FlashCard, CardOutcome } from "../../types";
import "./ResultsView.css";

interface Props {
  cards: FlashCard[];
  outcomes: CardOutcome[];
  onRedoMissed: (missed: FlashCard[]) => void;
  onRestart: () => void;
}

export function ResultsView({ cards, outcomes, onRedoMissed, onRestart }: Props) {
  const gotIt = outcomes.filter((o) => o === "got-it").length;
  const missed = outcomes.filter((o) => o === "missed").length;
  const total = cards.length;
  const pct = total > 0 ? Math.round((gotIt / total) * 100) : 0;
  const missedCards = cards.filter((_, i) => outcomes[i] === "missed");

  const emoji = pct === 100 ? "🎉" : pct >= 75 ? "👍" : pct >= 50 ? "💪" : "📚";
  const heading =
    pct === 100 ? "Perfect score!" : pct >= 75 ? "Great work!" : pct >= 50 ? "Keep going!" : "Keep practicing!";

  return (
    <div className="results-view">
      <div className="results-emoji">{emoji}</div>
      <h1 className="results-heading">{heading}</h1>

      <div className="results-score">
        <span className="results-pct">{pct}%</span>
        <span className="results-detail">
          {gotIt} of {total} cards
        </span>
      </div>

      <div className="results-breakdown">
        <div className="results-stat">
          <span className="results-stat-val got-val">{gotIt}</span>
          <span className="results-stat-label">Got it</span>
        </div>
        <div className="results-divider" />
        <div className="results-stat">
          <span className="results-stat-val missed-val">{missed}</span>
          <span className="results-stat-label">Review again</span>
        </div>
      </div>

      <div className="results-actions">
        {missedCards.length > 0 && (
          <button className="results-btn primary" onClick={() => onRedoMissed(missedCards)}>
            Redo {missedCards.length} missed {missedCards.length === 1 ? "card" : "cards"}
          </button>
        )}
        <button className="results-btn secondary" onClick={onRestart}>
          New lyrics
        </button>
      </div>
    </div>
  );
}
