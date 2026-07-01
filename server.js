import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { pinyin } from "pinyin-pro";
import OpenCC from "opencc-js";
import jiebaPkg from "@node-rs/jieba";
const { Jieba } = jiebaPkg;

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Converts Traditional Chinese → Simplified Chinese
const toSimplified = OpenCC.Converter({ from: "tw", to: "cn" });

// Compound words that jieba's default dictionary tends to split incorrectly.
// Format: "word freq tag" — high freq forces jieba to treat as one token.
const COMPOUND_DICT = [
  "为什么 2000 r",
  "对不起 2000 v",
  "没关系 2000 v",
  "这样子 2000 r",
  "不知道 2000 v",
  "告诉我 2000 v",
  "在一起 2000 v",
  "不一样 2000 a",
  "那么多 2000 r",
  "什么都 2000 r",
  "不可以 2000 v",
  "没想到 2000 v",
  "不舍得 2000 v",
  "舍不得 2000 v",
  "回忆里 2000 n",
  "记得你 2000 v",
  "放不下 2000 v",
  "忘不了 2000 v",
  "回不去 2000 v",
  "怎么了 2000 r",
  "怎么样 2000 r",
  "怎么办 2000 r",
  "没有你 2000 r",
  "爱上你 2000 v",
  "想起你 2000 v",
  "离开你 2000 v",
  "不后悔 2000 v",
].join("\n");

const jieba = new Jieba();
jieba.loadDict(Buffer.from(COMPOUND_DICT, "utf-8"));

// Matches strings made entirely of CJK unified ideographs
const CHINESE_RE = /^[一-鿿㐀-䶿豈-﫿]+$/;

function createLimiter(max) {
  let active = 0;
  const queue = [];
  return (fn) =>
    new Promise((resolve, reject) => {
      function attempt() {
        if (active < max) {
          active++;
          Promise.resolve(fn())
            .then(resolve, reject)
            .finally(() => {
              active--;
              if (queue.length > 0) queue.shift()();
            });
        } else {
          queue.push(attempt);
        }
      }
      attempt();
    });
}

const limit = createLimiter(4);

async function translate(text) {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=zh-CN|en`,
    );
    const data = await res.json();
    const result = data.responseData?.translatedText ?? "";
    // MyMemory echoes the input back when it can't translate
    return result && result !== text ? result : "";
  } catch {
    return "";
  }
}

app.post("/api/process", async (req, res) => {
  const { lyrics } = req.body ?? {};
  if (!lyrics?.trim()) return res.status(400).json({ error: "No lyrics provided." });

  try {
    // 1. Traditional → Simplified so jieba's dictionary matches
    const simplified = toSimplified(lyrics);

    // 2. Segment — HMM mode handles unknown/slang words in song lyrics better
    const raw = jieba.cut(simplified, true);

    // 3. Keep only Chinese-only segments of 1–4 chars, deduplicated, in order
    const seen = new Set();
    const segments = raw.filter((s) => {
      if (!CHINESE_RE.test(s) || s.length > 4) return false;
      if (seen.has(s)) return false;
      seen.add(s);
      return true;
    });

    if (segments.length === 0) {
      return res.status(422).json({ error: "No Chinese characters found in the provided text." });
    }

    // 4. Pinyin + translation in parallel (max 4 concurrent to stay within MyMemory limits)
    const cards = await Promise.all(
      segments.map((chars, i) =>
        limit(async () => ({
          id: `card-${i}`,
          characters: chars,
          pinyin: pinyin(chars, { toneType: "symbol", separator: " " }),
          pinyinPlain: pinyin(chars, { toneType: "none", separator: " " }),
          english: await translate(chars),
        })),
      ),
    );

    res.json({ cards });
  } catch (err) {
    console.error("process error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Something went wrong." });
  }
});

// In production, serve the Vite build and let React handle all non-API routes
if (process.env.NODE_ENV === "production") {
  const { default: path } = await import("path");
  const { fileURLToPath } = await import("url");
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const dist = path.join(__dirname, "dist");
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => console.log(`hanzi-cards server on :${PORT}`));
