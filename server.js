import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import express from "express";
import cors from "cors";
import { pinyin } from "pinyin-pro";

dotenv.config();

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Error: ANTHROPIC_API_KEY is not set in .env");
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const SEGMENT_PROMPT = `You are a Chinese language expert helping build a flashcard app for learning Chinese song lyrics.

Given Chinese song lyrics (which may be Traditional or Simplified Chinese):
1. Convert any Traditional Chinese characters to Simplified Chinese
2. Segment the text into unique vocabulary units of 1–4 characters suitable for flashcards
3. Provide a concise English translation for each unit

Segmentation rules:
- Keep compound words and fixed expressions intact: 为什么, 对不起, 没关系, 这样子, 因为, 所以, 虽然, 但是, 只是, 还是, 不知道, 没有, 一起, 告诉, 知道, 觉得, 喜欢, 开始
- Grammatical particles may stand alone as 1-character units: 的, 了, 吗, 呢, 吧, 啊, 也, 都, 很, 太, 最, 在, 是, 有, 我, 你, 他, 她
- Split strings that are not fixed vocabulary — e.g., 你是我的 → 你 | 是 | 我的
- Omit all punctuation, numbers, spaces, line breaks, and non-Chinese characters
- Deduplicate: if the same characters appear multiple times, only include them once
- Order by first appearance in the lyrics

Return ONLY a valid JSON array, no markdown fences, no extra text:
[{"characters": "simplified_chars", "english": "concise_english_meaning"}]`;

app.post("/api/process", async (req, res) => {
  const { lyrics } = req.body ?? {};
  if (!lyrics?.trim()) {
    return res.status(400).json({ error: "No lyrics provided." });
  }

  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        { role: "user", content: `${SEGMENT_PROMPT}\n\nLyrics:\n${lyrics.trim()}` },
      ],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    const jsonText = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    const segments = JSON.parse(jsonText);

    if (!Array.isArray(segments) || segments.length === 0) {
      return res.status(422).json({ error: "No Chinese characters found in the provided text." });
    }

    const cards = segments.map((seg, i) => ({
      id: `card-${i}`,
      characters: String(seg.characters),
      pinyin: pinyin(String(seg.characters), { toneType: "symbol", separator: " " }),
      pinyinPlain: pinyin(String(seg.characters), { toneType: "none", separator: " " }),
      english: String(seg.english),
    }));

    res.json({ cards });
  } catch (err) {
    console.error("process error:", err);
    if (err instanceof SyntaxError) {
      return res.status(500).json({ error: "Failed to parse AI response. Please try again." });
    }
    res.status(500).json({ error: err instanceof Error ? err.message : "Something went wrong." });
  }
});

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => console.log(`hanzi-cards server on :${PORT}`));
