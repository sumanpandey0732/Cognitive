import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

function makeEquation(level: number) {
  const type = rnd(0, Math.min(level, 3));
  let equation = '', answer = 0, hint = '';

  if (type === 0) {
    const a = rnd(2, 15), b = rnd(2, 15); const res = a + b;
    const removeLeft = Math.random() > 0.5;
    if (removeLeft) { equation = `? + ${b} = ${res}`; answer = a; hint = `? + ${b} = ${res}`; }
    else { equation = `${a} + ? = ${res}`; answer = b; }
  } else if (type === 1) {
    const b = rnd(2, 15), a = b + rnd(2, 15); const res = a - b;
    const removeWhich = rnd(0, 2);
    if (removeWhich === 0) { equation = `? − ${b} = ${res}`; answer = a; }
    else if (removeWhich === 1) { equation = `${a} − ? = ${res}`; answer = b; }
    else { equation = `${a} − ${b} = ?`; answer = res; }
  } else if (type === 2) {
    const a = rnd(2, 9), b = rnd(2, 9); const res = a * b;
    const removeWhich = rnd(0, 2);
    if (removeWhich === 0) { equation = `? × ${b} = ${res}`; answer = a; }
    else if (removeWhich === 1) { equation = `${a} × ? = ${res}`; answer = b; }
    else { equation = `${a} × ${b} = ?`; answer = res; }
  } else {
    const b = rnd(2, 9), a = b * rnd(2, 9); const res = a / b;
    const removeWhich = rnd(0, 1);
    if (removeWhich === 0) { equation = `? ÷ ${b} = ${res}`; answer = a; }
    else { equation = `${a} ÷ ? = ${res}`; answer = b; }
  }

  const wrongs = new Set<number>();
  while (wrongs.size < 3) {
    const d = rnd(1, Math.max(3, Math.ceil(answer * 0.25)));
    const w = answer + (Math.random() > 0.5 ? d : -d);
    if (w > 0 && w !== answer) wrongs.add(w);
  }
  return { equation, answer, opts: [...[...wrongs].slice(0, 3), answer].sort(() => Math.random() - 0.5) };
}

export default function EquationBalance({ onFinish }: Props) {
  const TOTAL = 15;
  const G = useRef({ score: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, lives: 5, level: 0, done: false });
  const [qNum, setQNum] = useState(0);
  const [puzzle, setPuzzle] = useState(() => makeEquation(0));
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);

  function finish() {
    G.current.done = true;
    const total = G.current.correct + G.current.wrong;
    onFinish({
      gameId: 'equation-balance', gameName: 'Equation Balance', domain: 'Logic',
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
      G.current.score += 12 * Math.min(G.current.combo, 5); G.current.correct += 1;
      if (G.current.correct % 4 === 0) G.current.level += 1;
      setFlash('ok');
    } else {
      G.current.combo = 0; G.current.wrong += 1; G.current.lives -= 1; setFlash('bad');
    }
    re();
    const next = qNum + 1;
    if (next >= TOTAL || G.current.lives <= 0) { setTimeout(finish, 500); }
    else { setTimeout(() => { setPuzzle(makeEquation(G.current.level)); setQNum(next); setFlash(null); }, 500); }
  }

  const g = G.current;
  if (g.done) {
    const total = g.correct + g.wrong;
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">⚖️</div>
        <h2 className="text-2xl font-black text-white">Balance Master!</h2>
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
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={qNum} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className={`w-full glass-panel p-8 rounded-2xl text-center border-2 transition-all ${
            flash === 'ok' ? 'border-green-400 bg-green-500/10' : flash === 'bad' ? 'border-red-400 bg-red-500/10' : 'border-white/10'
          }`}>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Find the missing value</p>
          <p className="text-4xl font-black text-white leading-tight">{puzzle.equation}</p>
          {flash === 'ok' && <p className="text-green-400 font-bold mt-2 text-sm">✓ Correct!</p>}
          {flash === 'bad' && <p className="text-red-400 font-bold mt-2 text-sm">✗ Answer: {puzzle.answer}</p>}
          {g.combo > 1 && !flash && <p className="text-orange-400 text-xs mt-2">🔥 ×{g.combo}</p>}
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
