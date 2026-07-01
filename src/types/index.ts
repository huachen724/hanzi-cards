export interface FlashCard {
  id: string;
  characters: string;
  pinyin: string;
  pinyinPlain: string;
  english: string;
}

export type HintLevel = 0 | 1 | 2 | 3;
export type CardOutcome = "got-it" | "missed";
