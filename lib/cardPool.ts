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
    front: 'set in',
    back: '始まる',
    allowedModes: ['flashcard', 'multiple_choice', 'minhaya'],
    distractorsMc: ['設定する', '着る', 'みかん'],
    distractorsMinhaya: {
      '0': ['メ', 'マ', 'モ'],
      '1': ['ド', 'ト', 'ゾ'],
      '2': ['コ', 'ゴ', 'コ'],
    },
  },
  {
    id: 'c2',
    deckId: 'eng-words',
    front: 'take after',
    back: '似ている',
    allowedModes: ['flashcard', 'free_text', 'multiple_choice'],
    distractorsMc: ['世話をする', '帰る', 'みかん'],
  },
  {
    id: 'c3',
    deckId: 'eng-words',
    front: 'on board',
    back: '乗って',
    allowedModes: ['flashcard', 'free_text', 'multiple_choice'],
    distractorsMc: ['殴る', 'ひっくり返す', 'みかん'],
  },
  {
    id: 'c4',
    deckId: 'eng-words',
    front: 'every once in a while',
    back: 'ときどき',
    allowedModes: ['flashcard', 'free_text', 'multiple_choice'],
    distractorsMc: ['頻繁に', '一回', 'みかん'],
  },
  {
    id: 'c5',
    deckId: 'eng-words',
    front: 'above all else',
    back: '特に',
    allowedModes: ['flashcard', 'free_text', 'multiple_choice'],
    distractorsMc: ['頑張って', 'の上に', 'みかん'],
  },
 {
    id: 'c6',
    deckId: 'eng-words',
    front: 'all the same',
    back: 'それでもやはり',
    allowedModes: ['flashcard', 'free_text', 'multiple_choice'],
    distractorsMc: ['同じように', '並外れて', 'みかん'],
  },
  {
    id: 'c7',
    deckId: 'eng-words',
    front: 'as well',
    back: 'もまた',
    allowedModes: ['flashcard', 'free_text', 'multiple_choice'],
    distractorsMc: ['上手に', '十分に', 'みかん'],
  },
  {
    id: 'c8',
    deckId: 'eng-words',
    front: 'before long',
    back: 'まもなく',
    allowedModes: ['flashcard', 'free_text', 'multiple_choice'],
    distractorsMc: ['ちょうど', 'とても', 'みかん'],
  },
  {
    id: 'c9',
    deckId: 'eng-words',
    front: 'for good',
    back: '永久に',
    allowedModes: ['flashcard', 'free_text', 'multiple_choice'],
    distractorsMc: ['上手く', '健康で', 'みかん'],
  },
  {
    id: 'c10',
    deckId: 'eng-words',
    front: 'in advance',
    back: '前もって',
    allowedModes: ['flashcard', 'free_text', 'multiple_choice'],
    distractorsMc: ['進化して', '得する', 'みかん'],
  },
  {
    id: 'c11',
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
