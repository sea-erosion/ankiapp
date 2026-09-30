'use client';

// 実験段階なので、ルーティング(URLで画面を分ける仕組み)は使わず、
// 1つのページの中でReactのuseStateを使って「今どの画面を表示するか」を
// 切り替えるだけのシンプルな作りにしています。
import { useMemo, useState } from 'react';
import { Card, QuizMode } from '@/lib/types';
import { decks, buildInitialCards } from '@/lib/cardPool';
import { applyReview, currentRetention, isDue } from '@/lib/srs';

type View = 'home' | 'cards' | 'review';

// 保持率に応じてバーの色を変える(70%以上=緑、40%以上=黄、それ未満=赤)
function retentionColor(r: number) {
  if (r > 0.7) return '#3B7A4E';
  if (r > 0.4) return '#B8873A';
  return '#B5453A';
}

export default function Home() {
  // カードの一覧をReactの状態(state)として持つ。
  // useState(buildInitialCards) と書くと、最初の1回だけ初期値を計算してくれる。
  const [cards, setCards] = useState<Card[]>(() => buildInitialCards());
  const [view, setView] = useState<View>('home');
  const [selectedDeckId, setSelectedDeckId] = useState(decks[0]?.id ?? '');

  // 復習セッション用の状態
  const [quizQueue, setQuizQueue] = useState<Card[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [modeForTurn, setModeForTurn] = useState<QuizMode>('flashcard');

  const deckCards = (deckId: string) => cards.filter((c) => c.deckId === deckId);
  const dueCards = useMemo(() => cards.filter(isDue), [cards]);

  // 1枚のカードを更新する共通処理。
  // 配列全体を作り直す(idが一致するものだけ差し替える)のがReactでの定石。
  function updateCard(updated: Card) {
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  function startReview(list: Card[]) {
    if (list.length === 0) {
      alert('復習対象のカードがありません');
      return;
    }
    const shuffled = [...list].sort(() => Math.random() - 0.5);
    setQuizQueue(shuffled);
    setQuizIndex(0);
    setModeForTurn(pickMode(shuffled[0]));
    setView('review');
  }

  function pickMode(card: Card): QuizMode {
    const modes = card.allowedModes.length ? card.allowedModes : ['flashcard'];
    return modes[Math.floor(Math.random() * modes.length)];
  }

  // 1問答えたあとに呼ぶ。カードの状態を更新して、次の問題に進む。
  function handleAnswer(card: Card, quality: number) {
    const updated = applyReview(card, quality);
    updateCard(updated);
    const nextIndex = quizIndex + 1;
    setQuizIndex(nextIndex);
    if (nextIndex < quizQueue.length) {
      setModeForTurn(pickMode(quizQueue[nextIndex]));
    }
  }

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 80px', fontFamily: 'sans-serif' }}>
      <nav style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['home', 'cards', 'review'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid #ccc',
              background: view === v ? '#3B6D5A' : '#fff',
              color: view === v ? '#fff' : '#333',
            }}
          >
            {v === 'home' ? 'ホーム' : v === 'cards' ? 'カード' : '復習'}
          </button>
        ))}
      </nav>

      {view === 'home' && (
        <HomeView dueCount={dueCards.length} onStart={() => startReview(dueCards)} />
      )}

      {view === 'cards' && (
        <CardsView
          selectedDeckId={selectedDeckId}
          onSelectDeck={setSelectedDeckId}
          cards={deckCards(selectedDeckId)}
          onReview={(list) => startReview(list.filter(isDue).length ? list.filter(isDue) : list)}
        />
      )}

      {view === 'review' && (
        <ReviewView
          card={quizQueue[quizIndex]}
          mode={modeForTurn}
          index={quizIndex}
          total={quizQueue.length}
          allCards={cards}
          onAnswer={handleAnswer}
          onFinish={() => setView('home')}
        />
      )}
    </main>
  );
}

// ---------- ホーム画面 ----------
function HomeView({ dueCount, onStart }: { dueCount: number; onStart: () => void }) {
  return (
    <div>
      <p style={{ color: '#888', margin: 0 }}>今日の復習</p>
      <p style={{ fontSize: 32, fontWeight: 700, margin: '4px 0 20px' }}>{dueCount}枚</p>
      <button
        onClick={onStart}
        style={{ width: '100%', padding: 14, background: '#3B6D5A', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15 }}
      >
        復習を始める
      </button>
    </div>
  );
}

// ---------- カード一覧画面 ----------
function CardsView({
  selectedDeckId,
  onSelectDeck,
  cards,
  onReview,
}: {
  selectedDeckId: string;
  onSelectDeck: (id: string) => void;
  cards: Card[];
  onReview: (cards: Card[]) => void;
}) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {decks.map((d) => (
          <span
            key={d.id}
            onClick={() => onSelectDeck(d.id)}
            style={{
              padding: '4px 10px',
              borderRadius: 8,
              fontSize: 13,
              cursor: 'pointer',
              background: d.id === selectedDeckId ? '#3B6D5A' : '#eee',
              color: d.id === selectedDeckId ? '#fff' : '#333',
            }}
          >
            {d.name}
          </span>
        ))}
      </div>

      {cards.map((c) => {
        const r = currentRetention(c);
        return (
          <div key={c.id} style={{ border: '1px solid #e0e0e0', borderRadius: 10, padding: 12, marginBottom: 8 }}>
            <div>{c.front} / {c.back}</div>
            <div style={{ height: 6, background: '#eee', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
              <div style={{ width: `${Math.round(r * 100)}%`, height: '100%', background: retentionColor(r) }} />
            </div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>保持率 {Math.round(r * 100)}%</div>
          </div>
        );
      })}

      {cards.length > 0 && (
        <button
          onClick={() => onReview(cards)}
          style={{ width: '100%', padding: 12, marginTop: 8, borderRadius: 10, border: '1px solid #ccc' }}
        >
          このデッキを復習
        </button>
      )}
    </div>
  );
}

// ---------- 復習セッション画面 ----------
function ReviewView({
  card,
  mode,
  index,
  total,
  allCards,
  onAnswer,
  onFinish,
}: {
  card: Card | undefined;
  mode: QuizMode;
  index: number;
  total: number;
  allCards: Card[];
  onAnswer: (card: Card, quality: number) => void;
  onFinish: () => void;
}) {
  if (!card) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <p>復習完了です。お疲れさまでした。</p>
        <button onClick={onFinish} style={{ padding: '10px 20px', borderRadius: 10, background: '#3B6D5A', color: '#fff', border: 'none' }}>
          ホームへ
        </button>
      </div>
    );
  }

  const r = currentRetention(card);

  return (
    <div>
      <p style={{ color: '#888', fontSize: 13 }}>保持率 {Math.round(r * 100)}% ・ {index + 1}/{total}枚</p>
      {mode === 'flashcard' && <Flashcard key={card.id} card={card} onAnswer={onAnswer} />}
      {mode === 'multiple_choice' && <MultipleChoice key={card.id} card={card} allCards={allCards} onAnswer={onAnswer} />}
      {mode === 'free_text' && <FreeText key={card.id} card={card} onAnswer={onAnswer} />}
      {mode === 'minhaya' && <Minhaya key={card.id} card={card} onAnswer={onAnswer} />}
    </div>
  );
}

function Flashcard({ card, onAnswer }: { card: Card; onAnswer: (card: Card, quality: number) => void }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 12, padding: 16, textAlign: 'center' }}>
      <p style={{ fontSize: 17, fontWeight: 600 }}>{card.front}</p>
      {flipped ? (
        <>
          <p style={{ color: '#888', borderTop: '1px solid #eee', paddingTop: 10 }}>{card.back}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
            <button onClick={() => onAnswer(card, 1)}>忘れた</button>
            <button onClick={() => onAnswer(card, 3)}>難しい</button>
            <button onClick={() => onAnswer(card, 4)}>普通</button>
            <button onClick={() => onAnswer(card, 5)}>簡単</button>
          </div>
        </>
      ) : (
        <button onClick={() => setFlipped(true)} style={{ width: '100%', marginTop: 10 }}>答えを見る</button>
      )}
    </div>
  );
}

function MultipleChoice({ card, allCards, onAnswer }: { card: Card; allCards: Card[]; onAnswer: (card: Card, quality: number) => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const options = useMemo(() => {
    let dummies = card.distractorsMc ?? [];
    if (dummies.length < 3) {
      const pool = allCards.filter((c) => c.deckId === card.deckId && c.id !== card.id).map((c) => c.back);
      dummies = [...dummies, ...pool].slice(0, 3);
    }
    return [...dummies.slice(0, 3), card.back].sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id]);

  function choose(opt: string) {
    if (picked) return;
    setPicked(opt);
    const correct = opt === card.back;
    setTimeout(() => onAnswer(card, correct ? 4 : 1), correct ? 300 : 1200);
  }

  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 12, padding: 16, textAlign: 'center' }}>
      <p style={{ fontSize: 17, fontWeight: 600 }}>{card.front}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
        {options.map((o) => (
          <button key={o} onClick={() => choose(o)} disabled={!!picked}>{o}</button>
        ))}
      </div>
      {picked && picked !== card.back && (
        <p style={{ color: '#B5453A', fontSize: 13, marginTop: 8 }}>正解は「{card.back}」でした</p>
      )}
    </div>
  );
}

function FreeText({ card, onAnswer }: { card: Card; onAnswer: (card: Card, quality: number) => void }) {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);

  function submit() {
    if (!value.trim()) return;
    const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '');
    const correct = norm(value) === norm(card.back);
    setResult(correct ? 'correct' : 'wrong');
    setTimeout(() => onAnswer(card, correct ? 4 : 1), 900);
  }

  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 12, padding: 16 }}>
      <p style={{ fontSize: 17, fontWeight: 600 }}>{card.front}</p>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!!result}
        placeholder="答えを入力"
        style={{ width: '100%', padding: 8, marginTop: 8 }}
      />
      {!result && <button onClick={submit} style={{ width: '100%', marginTop: 8 }}>確認</button>}
      {result && <p style={{ marginTop: 8 }}>{result === 'correct' ? '正解です' : `正解: ${card.back}`}</p>}
    </div>
  );
}

function Minhaya({ card, onAnswer }: { card: Card; onAnswer: (card: Card, quality: number) => void }) {
  const chars = useMemo(() => Array.from(card.back), [card.id]);
  const [pos, setPos] = useState(0);
  const [locked, setLocked] = useState(false);

  const options = useMemo(() => {
    const dummies = card.distractorsMinhaya?.[String(pos)] ?? ['?', '?', '?'];
    return [...dummies.slice(0, 3), chars[pos]].sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, card.id]);

  function choose(ch: string) {
    if (locked) return;
    if (ch === chars[pos]) {
      const nextPos = pos + 1;
      if (nextPos >= chars.length) {
        setLocked(true);
        const quality = Math.max(3, 5 - Math.floor((4 * nextPos) / chars.length));
        setTimeout(() => onAnswer(card, quality), 300);
      } else {
        setPos(nextPos);
      }
    } else {
      setLocked(true);
      setTimeout(() => onAnswer(card, 1), 600);
    }
  }

  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 12, padding: 16, textAlign: 'center' }}>
      <p style={{ color: '#888', fontSize: 13 }}>{card.front}</p>
      <p style={{ fontSize: 24, fontWeight: 700, letterSpacing: 4, margin: '14px 0' }}>
        {chars.slice(0, pos).join('')}
        <span style={{ color: '#aaa' }}>{'＿'.repeat(chars.length - pos)}</span>
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {options.map((ch, i) => (
          <button key={i} onClick={() => choose(ch)} disabled={locked}>{ch}</button>
        ))}
      </div>
    </div>
  );
}
