import { useRef, useState } from "react";
import { processLyrics, ApiError } from "../../lib/api";
import type { FlashCard } from "../../types";
import "./UploadView.css";

const SAMPLE = `故事的小黃花
從出生那年就飄著
童年的鞦韆
隨記憶再盪漾
陽光下蜻蜓飛過來
一片片的綠油油是你躲避的草叢
陽光下蜻蜓飛過來
一片片的綠油油是你躲避的草叢`;

interface Props {
  onCards: (cards: FlashCard[]) => void;
}

export function UploadView({ onCards }: Props) {
  const [lyrics, setLyrics] = useState("");
  const [state, setState] = useState<
    { status: "idle" } | { status: "loading" } | { status: "error"; message: string }
  >({ status: "idle" });
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lyrics.trim()) return;
    setState({ status: "loading" });
    try {
      const cards = await processLyrics(lyrics);
      if (cards.length === 0) {
        setState({ status: "error", message: "No Chinese characters found. Please paste some Chinese lyrics." });
        return;
      }
      onCards(cards);
    } catch (err) {
      setState({
        status: "error",
        message:
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Something went wrong.",
      });
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLyrics(String(ev.target?.result ?? ""));
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  }

  return (
    <div className="upload-view">
      <div className="upload-hero">
        <h1 className="upload-title">汉字卡</h1>
        <p className="upload-subtitle">Paste Chinese song lyrics. Get flashcards.</p>
      </div>

      <form className="upload-form" onSubmit={handleSubmit}>
        <div className="upload-field">
          <textarea
            className="upload-textarea"
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder="Paste Chinese lyrics here — Traditional or Simplified..."
            rows={9}
          />
          <div className="upload-row">
            <button type="button" className="link-btn" onClick={() => setLyrics(SAMPLE)}>
              Try sample (晴天)
            </button>
            <button type="button" className="link-btn" onClick={() => fileRef.current?.click()}>
              Upload .txt
            </button>
            {lyrics && (
              <button type="button" className="link-btn danger" onClick={() => setLyrics("")}>
                Clear
              </button>
            )}
            <input ref={fileRef} type="file" accept=".txt" className="upload-file-input" onChange={handleFile} />
          </div>
        </div>

        {state.status === "error" && <p className="upload-error">{state.message}</p>}

        <button type="submit" className="upload-btn" disabled={!lyrics.trim() || state.status === "loading"}>
          {state.status === "loading" ? (
            <>
              <span className="upload-spinner" /> Generating flashcards…
            </>
          ) : (
            "Generate flashcards →"
          )}
        </button>
      </form>

      <div className="upload-how">
        <h2>How it works</h2>
        <ol>
          <li>Paste Traditional or Simplified Chinese lyrics (or upload a .txt file)</li>
          <li>AI segments the text into meaningful vocabulary units of 1–4 characters</li>
          <li>Each unit gets a flashcard with pinyin and English translation</li>
          <li>Tap to flip · swipe left = got it · swipe right = review again</li>
        </ol>
      </div>
    </div>
  );
}
