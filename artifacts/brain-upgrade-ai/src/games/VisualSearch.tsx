import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameSession } from '@/context/AppContext';
interface Props { onFinish: (s: Partial<GameSession>) => void; }
const SYMBOLS = ['★','●','■','▲','◆','✦','⬟','⬡','✿','❋','✱','⬤','◉','▼','◀','▶'];
const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
export default function VisualSearch({ onFinish }: Props) {
  const ROUNDS = 8;
  const G = useRef({ score: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, done: false, startMs: Date.now() });
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState('');
  const [grid, setGrid] = useState<{sym: string; isTarget: boolean; id: number}[]>([]);
  const [found, setFound] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(12);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const foundRef = useRef<number[]>([]);
  const gridRef = useRef(grid);
  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { foundRef.current = found; }, [found]);
  function startRound(r: number) {
    clearInterval(timerRef.current);
    const tgt = SYMBOLS[rnd(0, SYMBOLS.length - 1)];
    const distract = SYMBOLS.filter(s => s !== tgt);
    const size = Math.min(20 + r * 4, 48);
    const targetCount = Math.max(2, Math.floor(size * 0.15));
    const cells = [];
    for (let i = 0; i < targetCount; i++) cells.push({ sym: tgt, isTarget: true, id: i });
    for (let i = targetCount; i < size; i++) cells.push({ sym: distract[rnd(0, distract.length - 1)], isTarget: false, id: i });
    const shuffled = cells.sort(() => Math.random() - 0.5);
    setTarget(tgt); setGrid(shuffled); setFound([]); foundRef.current = []; setTimeLeft(12); setRound(r);
    timerRef.current = setInterval(() => setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); autoSubmit(r); return 0; } return t - 1; }), 1000);
  }
  function autoSubmit(r: number) {
    const unfoundTargets = gridRef.current.filter(c => c.isTarget && !foundRef.current.includes(c.id)).length;
    G.current.wrong += unfoundTargets; G.current.combo = 0; re();
    const next = r + 1;
    if (next >= ROUNDS) finish(); else setTimeout(() => startRound(next), 400);
  }
  useEffect(() => { startRound(0); return () => clearInterval(timerRef.current); }, []);
  function finish() { clearInterval(timerRef.current); G.current.done = true; const total = G.current.correct + G.current.wrong; onFinish({ gameId: 'visual-search', gameName: 'Visual Search', domain: 'Focus', score: G.current.score, accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0, avgResponseMs: Math.round((Date.now() - G.current.startMs) / Math.max(1, total)), correct: G.current.correct, wrong: G.current.wrong, maxCombo: G.current.maxCombo, difficulty: 2, xpEarned: Math.floor(G.current.score / 5) }); re(); }
  function tap(cell: typeof grid[0]) {
    if (found.includes(cell.id)) return;
    if (!cell.isTarget) { G.current.combo = 0; G.current.wrong += 1; G.current.score = Math.max(0, G.current.score - 5); re(); return; }
    const newFound = [...found, cell.id]; setFound(newFound); foundRef.current = newFound;
    G.current.combo += 1; G.current.maxCombo = Math.max(G.current.maxCombo, G.current.combo);
    G.current.score += 10 * Math.min(G.current.combo, 4); G.current.correct += 1; re();
    const allTargets = gridRef.current.filter(c => c.isTarget).length;
    if (newFound.length >= allTargets) { clearInterval(timerRef.current); const next = round + 1; if (next >= ROUNDS) setTimeout(finish, 300); else setTimeout(() => startRound(next), 400); }
  }
  const g = G.current;
  const totalTargets = grid.filter(c => c.isTarget).length;
  if (g.done) { const total = g.correct + g.wrong; return <div className="flex flex-col items-center gap-4 text-center py-6"><div className="text-5xl">🔍</div><h2 className="text-2xl font-black text-white">Search Complete!</h2><div className="grid grid-cols-3 gap-3">{[['Score', g.score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round(g.correct / total * 100) : 0}%`, 'text-green-400'], ['Combo', `×${g.maxCombo}`, 'text-yellow-400']].map(([l, v, c]) => <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>)}</div></div>; }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between text-sm items-center">
        <span className="text-gray-400">{round + 1}/{ROUNDS}</span>
        <div className="glass-panel px-4 py-2 rounded-xl border border-white/10 text-center">
          <span className="text-xs text-gray-400">Find all: </span><span className="text-3xl font-black text-yellow-300">{target}</span>
          <span className="text-xs text-gray-400 ml-2">({found.length}/{totalTargets})</span>
        </div>
        <span className={`font-mono font-bold ${timeLeft <= 3 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>{timeLeft}s</span>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full"><motion.div className={`h-1.5 rounded-full ${timeLeft <= 3 ? 'bg-red-500' : 'bg-cyan-500'}`} animate={{ width: `${(timeLeft / 12) * 100}%` }} /></div>
      <div className="flex flex-wrap gap-1 justify-center p-2 glass-panel rounded-2xl border border-white/5">
        {grid.map(cell => (
          <motion.button key={cell.id} onClick={() => tap(cell)} whileTap={{ scale: 0.7 }}
            className={`w-9 h-9 rounded text-xl flex items-center justify-center transition-all ${found.includes(cell.id) ? 'bg-green-500/30 text-green-400 border border-green-400/30' : 'bg-white/5 hover:bg-white/15 text-white border border-transparent'}`}>
            {cell.sym}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
