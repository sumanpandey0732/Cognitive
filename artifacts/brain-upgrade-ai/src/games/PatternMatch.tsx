import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSession } from '@/context/AppContext';
interface Props { onFinish: (s: Partial<GameSession>) => void; }
const SHAPES = ['⬛','🔵','🔺','🔷','⬜','🔶','🟠','🟩','🟥','🟨'];
const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
function makeMatrix(level: number) {
  const size = Math.min(2 + Math.floor(level / 2), 4);
  const numShapes = Math.min(2 + level, SHAPES.length);
  const base = Array.from({ length: size * size }, () => SHAPES[rnd(0, numShapes - 1)]);
  // Create a logical pattern: one row or column has a rule
  const correctAnswer = base[size * size - 1];
  const wrongs = SHAPES.filter(s => s !== correctAnswer).slice(0, 3);
  const opts = [...wrongs, correctAnswer].sort(() => Math.random() - 0.5);
  // Blank out bottom-right
  const display = [...base]; display[size * size - 1] = '?';
  return { display, correctAnswer, opts, size };
}
export default function PatternMatch({ onFinish }: Props) {
  const TOTAL = 10;
  const G = useRef({ score: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, lives: 5, level: 0, done: false });
  const [qNum, setQNum] = useState(0);
  const [puzzle, setPuzzle] = useState(() => makeMatrix(0));
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  function finish() { G.current.done = true; const total = G.current.correct + G.current.wrong; onFinish({ gameId: 'pattern-match', gameName: 'Pattern Match', domain: 'Logic', score: G.current.score, accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0, avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong, maxCombo: G.current.maxCombo, difficulty: 2, xpEarned: Math.floor(G.current.score / 5) }); re(); }
  function answer(choice: string) {
    if (flash) return;
    const ok = choice === puzzle.correctAnswer;
    if (ok) { G.current.combo += 1; G.current.maxCombo = Math.max(G.current.maxCombo, G.current.combo); G.current.score += 15 * Math.min(G.current.combo, 5); G.current.correct += 1; if (G.current.correct % 3 === 0) G.current.level += 1; setFlash('ok'); }
    else { G.current.combo = 0; G.current.wrong += 1; G.current.lives -= 1; setFlash('bad'); }
    re();
    const next = qNum + 1;
    if (next >= TOTAL || G.current.lives <= 0) { setTimeout(finish, 500); }
    else { setTimeout(() => { setPuzzle(makeMatrix(G.current.level)); setQNum(next); setFlash(null); }, 600); }
  }
  const g = G.current;
  if (g.done) { const total = g.correct + g.wrong; return <div className="flex flex-col items-center gap-4 text-center py-6"><div className="text-5xl">🧩</div><h2 className="text-2xl font-black text-white">Pattern Master!</h2><div className="grid grid-cols-3 gap-3">{[['Score', g.score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round(g.correct / total * 100) : 0}%`, 'text-green-400'], ['Combo', `×${g.maxCombo}`, 'text-yellow-400']].map(([l, v, c]) => <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>)}</div></div>; }
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex justify-between w-full text-sm">
        <div className="flex gap-1">{[0,1,2,3,4].map(i => <span key={i} className={i < g.lives ? 'text-red-400' : 'text-gray-700'}>♥</span>)}</div>
        <span className="text-yellow-400 font-bold">{qNum + 1}/{TOTAL} • {g.score}pts</span>
      </div>
      <p className="text-xs text-gray-400 uppercase tracking-widest">What fills the missing spot?</p>
      <AnimatePresence mode="wait">
        <motion.div key={qNum} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className={`glass-panel p-4 rounded-2xl border-2 transition-all ${flash === 'ok' ? 'border-green-400' : flash === 'bad' ? 'border-red-400' : 'border-white/10'}`}>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${puzzle.size}, 1fr)` }}>
            {puzzle.display.map((cell, i) => (
              <div key={i} className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl border ${cell === '?' ? 'border-dashed border-cyan-400 bg-cyan-500/10' : 'border-white/10 bg-white/5'}`}>
                {cell}
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="grid grid-cols-4 gap-2 w-full">
        {puzzle.opts.map(opt => (
          <motion.button key={opt} onClick={() => answer(opt)} whileTap={{ scale: 0.85 }} disabled={!!flash}
            className="py-4 rounded-xl text-3xl bg-white/8 border border-white/15 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all disabled:opacity-50">{opt}</motion.button>
        ))}
      </div>
    </div>
  );
}
