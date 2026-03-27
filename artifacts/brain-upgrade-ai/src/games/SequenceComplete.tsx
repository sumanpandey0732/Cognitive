import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

function makeSequence(level: number) {
  const types = ['arithmetic', 'geometric', 'fibonacci', 'square', 'alternating'];
  const type = types[rnd(0, Math.min(level, types.length - 1))];
  let seq: number[] = [];
  let answer = 0;

  if (type === 'arithmetic') {
    const start = rnd(1, 20); const step = rnd(2, 5 + level);
    seq = [start, start + step, start + 2 * step, start + 3 * step, start + 4 * step];
    answer = seq.pop()!;
  } else if (type === 'geometric') {
    const start = rnd(1, 5); const ratio = rnd(2, 3 + level);
    seq = [start, start * ratio, start * ratio ** 2, start * ratio ** 3, start * ratio ** 4];
    answer = seq.pop()!;
  } else if (type === 'fibonacci') {
    const a = rnd(1, 10), b = rnd(1, 10);
    seq = [a, b, a + b, a + 2 * b, a + 3 * b + a];
    seq = [a, b, a + b, a + 2 * b];
    answer = a + b + a + 2 * b;
  } else if (type === 'square') {
    const start = rnd(1, 5 + level);
    seq = [start ** 2, (start + 1) ** 2, (start + 2) ** 2, (start + 3) ** 2];
    answer = (start + 4) ** 2;
  } else {
    const a = rnd(2, 10), b = rnd(2, 10);
    seq = [a, b, a * 2, b * 2, a * 3, b * 3];
    seq = seq.slice(0, 4);
    answer = a * 3;
  }

  const wrongs = new Set<number>();
  while (wrongs.size < 3) {
    const d = rnd(1, Math.max(3, Math.ceil(answer * 0.2)));
    wrongs.add(answer + (Math.random() > 0.5 ? d : -d));
  }
  const opts = [...[...wrongs].slice(0, 3), answer].sort(() => Math.random() - 0.5);
  return { seq, answer, opts, type };
}

export default function SequenceComplete({ onFinish }: Props) {
  const TOTAL = 12;
  const G = useRef({ score: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, lives: 5, level: 0, done: false });
  const [qNum, setQNum] = useState(0);
  const [puzzle, setPuzzle] = useState(() => makeSequence(0));
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);

  function finish() {
    G.current.done = true;
    const total = G.current.correct + G.current.wrong;
    onFinish({
      gameId: 'sequence-complete', gameName: 'Sequence Complete', domain: 'Logic',
      score: G.current.score,
      accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0,
      avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong,
      maxCombo: G.current.maxCombo, difficulty: 2,
      xpEarned: Math.floor(G.current.score / 5)
    });
    re();
  }

  function answer(choice: number) {
    if (flash) return;
    const ok = choice === puzzle.answer;
    if (ok) {
      G.current.combo += 1; G.current.maxCombo = Math.max(G.current.maxCombo, G.current.combo);
      G.current.score += 15 * Math.min(G.current.combo, 4); G.current.correct += 1;
      if (G.current.correct % 3 === 0) G.current.level += 1;
      setFlash('ok');
    } else {
      G.current.combo = 0; G.current.wrong += 1; G.current.lives -= 1; setFlash('bad');
    }
    re();
    const next = qNum + 1;
    if (next >= TOTAL || G.current.lives <= 0) { setTimeout(finish, 500); }
    else {
      setTimeout(() => {
        setPuzzle(makeSequence(G.current.level));
        setQNum(next); setFlash(null);
      }, 600);
    }
  }

  const g = G.current;
  if (g.done) {
    const total = g.correct + g.wrong;
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">🔢</div>
        <h2 className="text-2xl font-black text-white">Sequence Mastered!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', g.score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round(g.correct / total * 100) : 0}%`, 'text-green-400'], ['Combo', `×${g.maxCombo}`, 'text-yellow-400']].map(([l, v, c]) => (
            <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-sm mx-auto">
      <div className="flex justify-between w-full text-sm">
        <div className="flex gap-1">{[0,1,2,3,4].map(i => <span key={i} className={i < g.lives ? 'text-red-400' : 'text-gray-700'}>♥</span>)}</div>
        <span className="text-yellow-400 font-bold">{qNum + 1}/{TOTAL} • {g.score}pts</span>
        <span className="text-purple-400 text-xs capitalize font-bold">{puzzle.type}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={qNum} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className={`w-full glass-panel p-6 rounded-2xl border-2 transition-all ${
            flash === 'ok' ? 'border-green-400 bg-green-500/10' : flash === 'bad' ? 'border-red-400 bg-red-500/10' : 'border-white/10'
          }`}>
          <p className="text-xs text-gray-400 text-center uppercase tracking-widest mb-4">What comes next?</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {puzzle.seq.map((n, i) => (
              <div key={i} className="glass-panel px-4 py-2 rounded-xl border border-white/10">
                <span className="text-xl font-black text-white">{n}</span>
              </div>
            ))}
            <div className={`px-4 py-2 rounded-xl border-2 border-dashed ${flash === 'ok' ? 'border-green-400' : flash === 'bad' ? 'border-red-400' : 'border-cyan-400/50'}`}>
              <span className={`text-xl font-black ${flash === 'ok' ? 'text-green-400' : flash === 'bad' ? 'text-red-400' : 'text-cyan-400'}`}>
                {flash ? puzzle.answer : '?'}
              </span>
            </div>
          </div>
          {flash === 'bad' && <p className="text-red-400 text-xs text-center mt-2">Answer: {puzzle.answer}</p>}
          {g.combo > 1 && !flash && <p className="text-orange-400 text-xs text-center mt-2">🔥 ×{g.combo}</p>}
        </motion.div>
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-3 w-full">
        {puzzle.opts.map(opt => (
          <motion.button key={opt} onClick={() => answer(opt)} whileTap={{ scale: 0.88 }} disabled={!!flash}
            className="py-5 rounded-xl font-black text-2xl bg-white/8 border border-white/15 text-white hover:bg-cyan-500/20 hover:border-cyan-400 transition-all disabled:opacity-40">
            {opt}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
