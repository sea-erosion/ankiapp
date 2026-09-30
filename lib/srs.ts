// SM-2(間隔計算) + エビングハウス(保持率可視化)のハイブリッドロジック。
// PWA版で作ったJavaScriptのロジックをそのままTypeScriptに移植したもの。
import { Card } from './types';

// 「この保持率まで下がったら復習してほしい」という目標値。
// SM-2が決めた間隔(interval_days)から逆算してS(stability)を求めるときに使う。
const TARGET_R = 0.88;

// 新規カードの初期値。
export function newCardDefaults(): Pick<
  Card,
  'easeFactor' | 'intervalDays' | 'repetitions' | 'stability' | 'lastReviewedAt' | 'nextReviewDate'
> {
  const now = new Date().toISOString();
  return {
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    stability: 1,
    lastReviewedAt: now,
    nextReviewDate: now, // 作成直後は「今すぐ復習対象」にする
  };
}

// 復習した後にカードの状態を更新する。
// quality: 0-5の自己申告/自動判定の正答度(3未満は「忘れていた」扱い)
export function applyReview(card: Card, quality: number): Card {
  const updated = { ...card };

  if (quality < 3) {
    // 忘れていた場合はリセットして、また1日後から仕切り直す
    updated.repetitions = 0;
    updated.intervalDays = 1;
  } else {
    updated.repetitions = (updated.repetitions || 0) + 1;
    if (updated.repetitions === 1) {
      updated.intervalDays = 1;
    } else if (updated.repetitions === 2) {
      updated.intervalDays = 6;
    } else {
      updated.intervalDays = Math.max(1, Math.round(updated.intervalDays * updated.easeFactor));
    }
    // ease Factorの調整式(SM-2のオリジナル式)。下限は1.3。
    updated.easeFactor = Math.max(
      1.3,
      updated.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );
  }

  // SM-2が決めた間隔から、エビングハウス曲線用のS(stability)を逆算する。
  // 「interval_days日後にちょうど保持率がTARGET_Rになる」ようなSを求める式。
  updated.stability = Math.max(0.5, -updated.intervalDays / Math.log(TARGET_R));

  const now = new Date();
  updated.lastReviewedAt = now.toISOString();
  const next = new Date(now.getTime() + updated.intervalDays * 86400000);
  updated.nextReviewDate = next.toISOString();

  return updated;
}

// 現時点の保持率(R)を計算する。R = e^(-経過日数 / S)
export function currentRetention(card: Card): number {
  const elapsedDays = (Date.now() - new Date(card.lastReviewedAt).getTime()) / 86400000;
  const S = card.stability || 1;
  const r = Math.exp(-elapsedDays / S);
  return Math.max(0, Math.min(1, r));
}

// 復習すべきタイミングが来ているか
export function isDue(card: Card): boolean {
  return new Date(card.nextReviewDate).getTime() <= Date.now();
}
