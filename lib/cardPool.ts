// 実験段階用のハードコードカードデータ。
// quizPools.ts と同じ考え方で、まずはこの固定データで
// 「デッキ選択→復習→保持率の変化」の一連の流れを作る。
// 本来はカード追加フォームやDBから読み込む想定。
import { Card, Deck } from './types';
import { newCardDefaults } from './srs';

export type CardSeed = {
  id: string;
  deckId: string;
  front: string;
  back: string;
  allowedModes: Card['allowedModes'];
  distractorsMc?: string[];
  distractorsMinhaya?: Record<string, string[]>;
};

export const decks: Deck[] = [
  { id: 'eng-words', name: '英単語' },
  { id: 'jp-history', name: '日本史' },
];

export const cardSeeds: CardSeed[] = [
  {
    id: 'c1',
    deckId: 'eng-words',
    front: 'mitochondria',
    back: 'ミトコンドリア',
    allowedModes: ['flashcard', 'multiple_choice', 'minhaya'],
    distractorsMc: ['リボソーム', '葉緑体', '核小体'],
    distractorsMinhaya: {
      '0': ['メ', 'マ', 'モ'],
      '1': ['ド', 'ト', 'ゾ'],
      '2': ['コ', 'ゴ', 'コ'],
    },
  },
  {
    id: 'c2',
    deckId: 'eng-words',
    front: 'ubiquitous',
    back: 'いたるところにある',
    allowedModes: ['flashcard', 'free_text'],
  },
  {
    id: 'c3',
    deckId: 'jp-history',
    front: '聖徳太子が制定した、役人の位を12段階に分けた制度は?',
    back: '冠位十二階',
    allowedModes: ['flashcard', 'multiple_choice'],
    distractorsMc: ['十七条憲法', '大化の改新', '班田収授法'],
  },
];

// CardSeed(静的データ)から、SM-2の初期値を付けた完全なCard配列を作る。
// 実験段階ではDB保存しないので、ページを開くたびにここから初期化される。
export function buildInitialCards(): Card[] {
  return cardSeeds.map((seed) => ({
    ...seed,
    ...newCardDefaults(),
  }));
}
