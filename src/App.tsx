import { useState } from "react";
import type { FlashCard, CardOutcome } from "./types";
import { UploadView } from "./components/UploadView/UploadView";
import { DeckView } from "./components/DeckView/DeckView";
import { ResultsView } from "./components/ResultsView/ResultsView";
import "./App.css";

type AppView =
  | { mode: "upload" }
  | { mode: "deck"; cards: FlashCard[] }
  | { mode: "results"; allCards: FlashCard[]; outcomes: CardOutcome[] };

export default function App() {
  const [view, setView] = useState<AppView>({ mode: "upload" });

  return (
    <div className="app">
      {view.mode === "upload" && (
        <UploadView onCards={(cards) => setView({ mode: "deck", cards })} />
      )}
      {view.mode === "deck" && (
        <DeckView
          cards={view.cards}
          onDone={(outcomes) => setView({ mode: "results", allCards: view.cards, outcomes })}
        />
      )}
      {view.mode === "results" && (
        <ResultsView
          cards={view.allCards}
          outcomes={view.outcomes}
          onRedoMissed={(missed) => setView({ mode: "deck", cards: missed })}
          onRestart={() => setView({ mode: "upload" })}
        />
      )}
    </div>
  );
}
