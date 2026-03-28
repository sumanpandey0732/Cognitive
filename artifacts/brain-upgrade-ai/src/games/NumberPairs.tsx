import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSession } from '@/context/AppContext';
interface Props { onFinish: (s: Partial<GameSession>) => void; }
const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
function makeGrid(level: number) {
  const target = rnd(10 + level * 3, 25 + level * 5);
  const count = Math.min(8 + level * 2, 20);
  const pairs: number[] = [];
  const used = new Set<number>();
  let added = 0;
  while (added < Math.floor(count / 2)) {
    const a = rnd(1, target - 1);
    const b = target - a;
    if (!used.has(a) && !used.has(b) && a !== b) { used.add(a); used.add(b); pairs.push(a, b); added++; }
  }
  const decoys: number[] = [];
  while (pairs.length + decoys.length < count) {
    const d = rnd(1, target * 2);
    if (!used.has(d)) { used.add(d); decoys.push(d); }
  }
  const all = [...pairs, ...decoys].sort(() => Math.random() - 0.5);
  return { numbers: all, target, pairSet: new Set(pairs) };
}
export default function NumberPairs({ onFinish }: Props) {
  const ROUNDS = 8;
  const G = useRef({ score: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, done: false });
  const [round, setRound] = useState(0);
  const [puzzle, setPuzzle] = useState(() => makeGrid(0));
  const [selected, setSelected] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [flash, setFlash] = useState<{idxs: number[]; ok: boolean} | null>(null);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  function finish() { G.current.done = true; const total = G.current.correct + G.current.wrong; onFinish({ gameId: 'number-pairs', gameName: 'Number Pairs', domain: 'Logic', score: G.current.score, accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0, avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong, maxCombo: G.current.maxCombo, difficulty: 2, xpEarned: Math.floor(G.current.score / 5) }); re(); }
  function select(idx: number) {
    if (matched.has(idx) || flash) return;
    if (selected.includes(idx)) { setSelected([]); return; }
    const newSel = [...selected, idx];
    if (newSel.length < 2) { setSelected(newSel); return; }
    const [a, b] = newSel;
    const ok = puzzle.numbers[a] + puzzle.numbers[b] === puzzle.target;
    setFlash({ idxs: newSel, ok });
    if (ok) {
      G.current.combo += 1; G.current.maxCombo = Math.max(G.current.maxCombo, G.current.combo);
      G.current.score += 15 * Math.min(G.current.combo, 4); G.current.correct += 1;
      setTimeout(() => {
        const newMatched = new Set(matched); newMatched.add(a); newMatched.add(b); setMatched(newMatched); setSelected([]); setFlash(null);
        const totalPairs = puzzle.pairSet.size / 2;
        const matchedPairs = newMatched.size / 2;
        if (matchedPairs >= totalPairs) { G.current.score += 30; const next = round + 1; if (next >= ROUNDS) finish(); else { setRound(next); setPuzzle(makeGrid(Math.min(next, 5))); setMatched(new Set()); } }
        re();
      }, 400);
    } else {
      G.current.combo = 0; G.current.wrong += 1; re();
      setTimeout(() => { setSelected([]); setFlash(null); }, 500);
    }
  }
  const g = G.current;
  if (g.done) { const total = g.correct + g.wrong; return <div className="flex flex-col items-center gap-4 text-center py-6"><div className="text-5xl">🔗</div><h2 className="text-2xl font-black text-white">Pairs Found!</h2><div className="grid grid-cols-3 gap-3">{[['Score', g.score, 'text-cyan-400'], ['Pairs', g.correct, 'text-green-400'], ['Combo', `×${g.maxCombo}`, 'text-yellow-400']].map(([l, v, c]) => <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>)}</div></div>; }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Round {round + 1}/{ROUNDS}</span>
        <div className="glass-panel px-4 py-2 rounded-xl text-center"><span className="text-white font-bold text-sm">Pairs summing to </span><span className="text-cyan-400 font-black text-xl">{puzzle.target}</span></div>
        <span className="text-yellow-400 font-bold">{g.score}pts</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {puzzle.numbers.map((n, i) => (
          <motion.button key={i} onClick={() => select(i)} whileTap={{ scale: 0.85 }}
            disabled={matched.has(i)}
            className={`py-4 rounded-xl font-black text-xl border-2 transition-all ${
              matched.has(i) ? 'bg-green-500/15 border-green-400/20 text-green-400/50 cursor-default' :
              flash?.idxs.includes(i) ? (flash.ok ? 'bg-green-500/30 border-green-400' : 'bg-red-500/30 border-red-400') :
              selected.includes(i) ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,229,255,0.4)]' :
              'bg-white/8 border-white/15 text-white hover:border-cyan-400/50'
            }`}>{n}</motion.button>
        ))}
      </div>
      {g.combo > 1 && <p className="text-center text-orange-400 text-sm font-bold">🔥 ×{g.combo} Combo!</p>}
    </div>
  );
}
