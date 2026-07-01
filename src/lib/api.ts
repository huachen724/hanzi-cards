import type { FlashCard } from "../types";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function processLyrics(lyrics: string): Promise<FlashCard[]> {
  const res = await fetch("/api/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lyrics }),
  });
  const data = (await res.json().catch(() => ({}))) as { cards?: FlashCard[]; error?: string };
  if (!res.ok) throw new ApiError(res.status, data.error ?? `Error ${res.status}`);
  return data.cards ?? [];
}
