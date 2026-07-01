import { useState } from "react";
import type { FlashCard, CardOutcome } from "./types";
import { UploadView } from "./components/UploadView/UploadView";
import { DeckView } from "./components/DeckView/DeckView";
import { ResultsView } from "./components/ResultsView/ResultsView";
import "./App.css";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type AppView =
  | { mode: "upload" }
  | { mode: "deck"; cards: FlashCard[]; originalCards: FlashCard[] }
  | { mode: "results"; allCards: FlashCard[]; originalCards: FlashCard[]; outcomes: CardOutcome[] };

export default function App() {
  const [view, setView] = useState<AppView>({ mode: "upload" });

  function startDeck(cards: FlashCard[]) {
    setView({ mode: "deck", cards: shuffle(cards), originalCards: cards });
  }

  return (
    <div className="app">
      {view.mode === "upload" && (
        <UploadView onCards={startDeck} />
      )}
      {view.mode === "deck" && (
        <DeckView
          cards={view.cards}
          onDone={(outcomes) =>
            setView({ mode: "results", allCards: view.cards, originalCards: view.originalCards, outcomes })
          }
          onShuffle={() => setView({ ...view, cards: shuffle(view.originalCards), mode: "deck" })}
          onHome={() => setView({ mode: "upload" })}
        />
      )}
      {view.mode === "results" && (
        <ResultsView
          cards={view.allCards}
          outcomes={view.outcomes}
          onRedoMissed={(missed) =>
            setView({ mode: "deck", cards: shuffle(missed), originalCards: missed })
          }
          onRestart={() => setView({ mode: "upload" })}
        />
      )}
    </div>
  );
}
