'use client';

// 実験段階なので、ルーティングは使わず1ページ内でuseStateにより画面を切り替える。
import { useMemo, useState } from 'react';
import { Card, QuizMode } from '@/lib/types';
import { decks, buildInitialCards } from '@/lib/cardPool';
import { applyReview, currentRetention, isDue } from '@/lib/srs';

type View = 'home' | 'cards' | 'review';

// 保持率に応じてバーの色を変える(70%以上=モス、40%以上=ゴールド、それ未満=クレイ)
function retentionColor(r: number) {
  if (r > 0.7) return 'var(--moss)';
  if (r > 0.4) return 'var(--gold)';
  return 'var(--clay)';
}

const TABS: { key: View; label: string }[] = [
  { key: 'home', label: 'ホーム' },
  { key: 'cards', label: 'カード' },
  { key: 'review', label: '復習' },
];

export default function Home() {
  const [cards, setCards] = useState<Card[]>(() => buildInitialCards());
  const [view, setView] = useState<View>('home');
  const [selectedDeckId, setSelectedDeckId] = useState(decks[0]?.id ?? '');

  const [quizQueue, setQuizQueue] = useState<Card[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [modeForTurn, setModeForTurn] = useState<QuizMode>('flashcard');

  const deckCards = (deckId: string) => cards.filter((c) => c.deckId === deckId);
  const dueCards = useMemo(() => cards.filter(isDue), [cards]);

  function updateCard(updated: Card) {
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  function pickMode(card: Card): QuizMode {
    const modes = card.allowedModes.length ? card.allowedModes : (['flashcard'] as QuizMode[]);
    return modes[Math.floor(Math.random() * modes.length)];
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
    <main className="mx-auto min-h-full w-full max-w-md px-5 pb-24 pt-8 font-sans text-ink">
      <h1 className="font-serif text-lg font-semibold tracking-tight">忘却曲線暗記</h1>

      <nav className="mt-5 flex gap-5 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className={`-mb-px border-b-2 pb-2 text-sm transition ${
              view === t.key
                ? 'border-moss text-ink font-medium'
                : 'border-transparent text-ink-sub hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {view === 'home' && <HomeView dueCount={dueCards.length} onStart={() => startReview(dueCards)} />}

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
      </div>
    </main>
  );
}

// ---------- ホーム画面 ----------
function HomeView({ dueCount, onStart }: { dueCount: number; onStart: () => void }) {
  return (
    <div className="rounded-2xl border border-line bg-paper-card p-6">
      <p className="text-sm text-ink-sub">今日の復習</p>
      <p className="mt-1 font-serif text-5xl font-semibold">{dueCount}</p>
      <p className="mb-5 text-sm text-ink-sub">枚</p>
      <button
        onClick={onStart}
        className="w-full rounded-xl bg-moss py-3 text-sm font-medium text-moss-ink transition hover:opacity-90"
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
      <div className="mb-5 flex gap-4 text-sm">
        {decks.map((d) => (
          <button
            key={d.id}
            onClick={() => onSelectDeck(d.id)}
            className={
              d.id === selectedDeckId
                ? 'font-medium text-ink underline decoration-moss decoration-2 underline-offset-4'
                : 'text-ink-sub hover:text-ink'
            }
          >
            {d.name}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {cards.map((c) => {
          const r = currentRetention(c);
          return (
            <div key={c.id} className="rounded-xl border border-line bg-paper-card p-4">
              <div className="text-sm">
                {c.front} <span className="text-ink-sub">/ {c.back}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.round(r * 100)}%`, background: retentionColor(r) }}
                />
              </div>
              <div className="mt-1.5 text-xs text-ink-sub">保持率 {Math.round(r * 100)}%</div>
            </div>
          );
        })}
        {cards.length === 0 && <p className="text-sm text-ink-sub">カードがありません。</p>}
      </div>

      {cards.length > 0 && (
        <button
          onClick={() => onReview(cards)}
          className="mt-4 w-full rounded-xl border border-line py-2.5 text-sm text-ink transition hover:border-moss hover:text-moss"
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
      <div className="rounded-2xl border border-line bg-paper-card p-8 text-center">
        <p className="text-sm text-ink-sub">復習完了です。お疲れさまでした。</p>
        <button
          onClick={onFinish}
          className="mt-4 rounded-xl bg-moss px-6 py-2.5 text-sm font-medium text-moss-ink hover:opacity-90"
        >
          ホームへ
        </button>
      </div>
    );
  }

  const r = currentRetention(card);

  return (
    <div>
      <p className="mb-3 text-xs text-ink-sub">
        保持率 {Math.round(r * 100)}% ・ {index + 1}/{total}枚
      </p>
      {mode === 'flashcard' && <Flashcard key={card.id} card={card} onAnswer={onAnswer} />}
      {mode === 'multiple_choice' && <MultipleChoice key={card.id} card={card} allCards={allCards} onAnswer={onAnswer} />}
      {mode === 'free_text' && <FreeText key={card.id} card={card} onAnswer={onAnswer} />}
      {mode === 'minhaya' && <Minhaya key={card.id} card={card} onAnswer={onAnswer} />}
    </div>
  );
}

const choiceBtn =
  'rounded-lg border border-line py-3 text-sm transition hover:border-moss hover:bg-moss/5 disabled:opacity-40 disabled:hover:border-line disabled:hover:bg-transparent';

function Flashcard({ card, onAnswer }: { card: Card; onAnswer: (card: Card, quality: number) => void }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="rounded-2xl border border-line bg-paper-card p-6 text-center">
      <p className="font-serif text-xl font-semibold">{card.front}</p>
      {flipped ? (
        <>
          <p className="mt-4 border-t border-line pt-4 text-ink-sub">{card.back}</p>
          <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
            <button onClick={() => onAnswer(card, 1)} className={`${choiceBtn} border-clay/40 text-clay`}>忘れた</button>
            <button onClick={() => onAnswer(card, 3)} className={`${choiceBtn} border-gold/40 text-gold`}>難しい</button>
            <button onClick={() => onAnswer(card, 4)} className={choiceBtn}>普通</button>
            <button onClick={() => onAnswer(card, 5)} className={`${choiceBtn} border-moss/40 text-moss`}>簡単</button>
          </div>
        </>
      ) : (
        <button onClick={() => setFlipped(true)} className="mt-5 w-full rounded-xl border border-line py-2.5 text-sm hover:border-moss hover:text-moss">
          答えを見る
        </button>
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
    <div className="rounded-2xl border border-line bg-paper-card p-6 text-center">
      <p className="font-serif text-xl font-semibold">{card.front}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => choose(o)}
            disabled={!!picked}
            className={`${choiceBtn} ${picked === o && o !== card.back ? 'border-clay text-clay' : ''} ${picked && o === card.back ? 'border-moss text-moss' : ''}`}
          >
            {o}
          </button>
        ))}
      </div>
      {picked && picked !== card.back && (
        <p className="mt-3 text-xs text-clay">正解は「{card.back}」でした</p>
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
    <div className="rounded-2xl border border-line bg-paper-card p-6">
      <p className="text-center font-serif text-xl font-semibold">{card.front}</p>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!!result}
        placeholder="答えを入力"
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        className="mt-4 w-full rounded-lg border border-line bg-transparent px-3 py-2.5 text-sm outline-none focus:border-moss"
      />
      {!result && (
        <button onClick={submit} className="mt-3 w-full rounded-xl bg-moss py-2.5 text-sm font-medium text-moss-ink hover:opacity-90">
          確認
        </button>
      )}
      {result && (
        <p className={`mt-3 text-center text-sm ${result === 'correct' ? 'text-moss' : 'text-clay'}`}>
          {result === 'correct' ? '正解です' : `正解: ${card.back}`}
        </p>
      )}
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
    <div className="rounded-2xl border border-line bg-paper-card p-6 text-center">
      <p className="text-sm text-ink-sub">{card.front}</p>
      <p className="my-5 font-serif text-3xl font-semibold tracking-[0.2em]">
        {chars.slice(0, pos).join('')}
        <span className="text-ink-sub/50">{'＿'.repeat(chars.length - pos)}</span>
      </p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((ch, i) => (
          <button key={i} onClick={() => choose(ch)} disabled={locked} className={choiceBtn}>
            {ch}
          </button>
        ))}
      </div>
    </div>
  );
}
