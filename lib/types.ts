// カード1枚分のデータ構造。
// SM-2(間隔計算)用のフィールドと、エビングハウス曲線(保持率の可視化)用の
// フィールドを両方持たせているのがポイント。
export type QuizMode = 'flashcard' | 'multiple_choice' | 'free_text' | 'minhaya';

export type Card = {
  id: string;
  deckId: string;
  front: string; // 表面(問題)
  back: string;  // 裏面(答え)
  allowedModes: QuizMode[];

  // 4択用のダミー選択肢(3つ)。手入力のJSONで用意する。
  distractorsMc?: string[];

  // みんはや方式用のダミー文字。キーは0始まりの文字位置(文字列)、値はダミー3文字。
  // 例: { "0": ["さ","か","た"], "1": ["く","す","つ"] }
  distractorsMinhaya?: Record<string, string[]>;

  // ---- SM-2側(間隔計算に使う) ----
  easeFactor: number;   // 初期値2.5、下限1.3
  intervalDays: number; // 次回復習までの日数
  repetitions: number;  // 連続正解回数

  // ---- エビングハウス側(保持率の可視化に使う) ----
  stability: number;       // S。R = e^(-経過日数/S)
  lastReviewedAt: string;  // ISO日時。最後に復習した時刻
  nextReviewDate: string;  // ISO日時。次に復習すべき時刻
};

export type ReviewLog = {
  cardId: string;
  deckId: string;
  reviewedAt: string;
  predictedR: number;       // 復習した瞬間に予測していた保持率
  quality: number;          // 0-5の自己申告/自動判定の正答度
  intervalSinceLast: number; // 前回復習からの経過日数
  mode: QuizMode;
};

export type Deck = {
  id: string;
  name: string;
};
