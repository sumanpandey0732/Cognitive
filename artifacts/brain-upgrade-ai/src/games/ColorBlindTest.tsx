import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSession } from '@/context/AppContext';
interface Props { onFinish: (s: Partial<GameSession>) => void; }
const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
function hexToRgb(h: string) { const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16); return { r, g, b }; }
function rgbToHex(r: number, g: number, b: number) { return '#' + [r, g, b].map(x => Math.min(255, Math.max(0, x)).toString(16).padStart(2, '0')).join(''); }
function makePuzzle(level: number) {
  const bases = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ec4899', '#eab308', '#06b6d4', '#ef4444'];
  const base = bases[rnd(0, bases.length - 1)];
  const { r, g, b } = hexToRgb(base);
  const diff = Math.max(15, 60 - level * 5);
  const channel = ['r', 'g', 'b'][rnd(0, 2)] as 'r' | 'g' | 'b';
  const delta = (Math.random() > 0.5 ? 1 : -1) * diff;
  const odd = rgbToHex(channel === 'r' ? r + delta : r, channel === 'g' ? g + delta : g, channel === 'b' ? b + delta : b);
  const gridSize = Math.min(3 + Math.floor(level / 2), 6);
  const count = gridSize * gridSize;
  const oddIdx = rnd(0, count - 1);
  const colors = Array.from({ length: count }, (_, i) => i === oddIdx ? odd : base);
  return { colors, oddIdx, base, odd };
}
export default function ColorBlindTest({ onFinish }: Props) {
  const TOTAL = 10;
  const G = useRef({ score: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, lives: 5, level: 0, done: false });
  const [qNum, setQNum] = useState(0);
  const [puzzle, setPuzzle] = useState(() => makePuzzle(0));
  const [flash, setFlash] = useState<{idx: number; ok: boolean} | null>(null);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  function finish() { G.current.done = true; const total = G.current.correct + G.current.wrong; onFinish({ gameId: 'color-blind-test', gameName: 'Color Blind Test', domain: 'Focus', score: G.current.score, accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0, avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong, maxCombo: G.current.maxCombo, difficulty: 2, xpEarned: Math.floor(G.current.score / 5) }); re(); }
  function tap(idx: number) {
    if (flash) return;
    const ok = idx === puzzle.oddIdx;
    setFlash({ idx, ok });
    if (ok) { G.current.combo += 1; G.current.maxCombo = Math.max(G.current.maxCombo, G.current.combo); G.current.score += 20 * Math.min(G.current.combo, 5); G.current.correct += 1; if (G.current.correct % 3 === 0) G.current.level = Math.min(G.current.level + 1, 8); }
    else { G.current.combo = 0; G.current.wrong += 1; G.current.lives -= 1; }
    re();
    const next = qNum + 1;
    if (next >= TOTAL || G.current.lives <= 0) { setTimeout(finish, 700); }
    else { setTimeout(() => { setPuzzle(makePuzzle(G.current.level)); setQNum(next); setFlash(null); }, 800); }
  }
  const g = G.current;
  const gridSize = Math.min(3 + Math.floor(g.level / 2), 6);
  if (g.done) { const total = g.correct + g.wrong; return <div className="flex flex-col items-center gap-4 text-center py-6"><div className="text-5xl">🎨</div><h2 className="text-2xl font-black text-white">Eye Test Done!</h2><div className="grid grid-cols-3 gap-3">{[['Score', g.score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round(g.correct / total * 100) : 0}%`, 'text-green-400'], ['Combo', `×${g.maxCombo}`, 'text-yellow-400']].map(([l, v, c]) => <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>)}</div></div>; }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between text-sm">
        <div className="flex gap-1">{[0,1,2,3,4].map(i => <span key={i} className={i < g.lives ? 'text-red-400' : 'text-gray-700'}>♥</span>)}</div>
        <span className="text-yellow-400 font-bold">{qNum + 1}/{TOTAL} • {g.score}pts{g.combo > 1 ? ` 🔥×${g.combo}` : ''}</span>
      </div>
      <p className="text-center text-sm text-gray-400">Find the slightly DIFFERENT color tile</p>
      <AnimatePresence mode="wait">
        <motion.div key={qNum} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="inline-grid gap-1.5 mx-auto" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
          {puzzle.colors.map((color, i) => (
            <motion.button key={i} onClick={() => tap(i)} whileTap={{ scale: 0.8 }}
              className="rounded-lg border-2 transition-all"
              style={{ width: Math.min(70, 300 / gridSize), height: Math.min(70, 300 / gridSize), background: color, borderColor: flash?.idx === i ? (flash.ok ? '#22c55e' : '#ef4444') : flash && i === puzzle.oddIdx ? '#22c55e' : 'transparent' }} />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
