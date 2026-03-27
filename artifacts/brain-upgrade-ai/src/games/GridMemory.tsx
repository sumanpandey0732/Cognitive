import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

export default function GridMemory({ onFinish }: Props) {
  const ROUNDS = 8;
  const G = useRef({ score: 0, correct: 0, wrong: 0, maxCombo: 0, combo: 0, done: false });
  const [phase, setPhase] = useState<'showing' | 'recall' | 'result'>('showing');
  const [gridSize, setGridSize] = useState(3);
  const [highlighted, setHighlighted] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [round, setRound] = useState(0);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);

  function startRound(r: number) {
    const size = Math.min(4, 3 + Math.floor(r / 3));
    const cells = size * size;
    const count = Math.min(3 + Math.floor(r / 2), Math.floor(cells * 0.6));
    const hl = new Set<number>();
    while (hl.size < count) hl.add(rnd(0, cells - 1));
    setGridSize(size);
    setHighlighted(hl);
    setSelected(new Set());
    setFlash(null);
    setPhase('showing');
    const showMs = Math.max(800, 2000 - r * 100);
    setTimeout(() => setPhase('recall'), showMs);
  }

  useEffect(() => { startRound(0); }, []);

  function finish() {
    G.current.done = true;
    const total = G.current.correct + G.current.wrong;
    onFinish({
      gameId: 'grid-memory', gameName: 'Grid Memory', domain: 'Memory',
      score: G.current.score,
      accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0,
      avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong,
      maxCombo: G.current.maxCombo, difficulty: 2,
      xpEarned: Math.floor(G.current.score / 5)
    });
    re();
  }

  function toggleCell(i: number) {
    if (phase !== 'recall') return;
    setSelected(prev => {
      const s = new Set(prev);
      if (s.has(i)) s.delete(i); else s.add(i);
      return s;
    });
  }

  function submit() {
    let correct = 0, wrong = 0;
    selected.forEach(i => { if (highlighted.has(i)) correct++; else wrong++; });
    highlighted.forEach(i => { if (!selected.has(i)) wrong++; });
    G.current.correct += correct;
    G.current.wrong += wrong;
    if (wrong === 0) {
      G.current.combo += 1; G.current.maxCombo = Math.max(G.current.maxCombo, G.current.combo);
      G.current.score += 20 * highlighted.size * Math.min(G.current.combo, 3);
      setFlash('ok');
    } else {
      G.current.combo = 0;
      G.current.score += Math.max(0, correct - wrong) * 10;
      setFlash('bad');
    }
    setPhase('result');
    re();
    const next = round + 1;
    setTimeout(() => { if (next >= ROUNDS) finish(); else { setRound(next); startRound(next); } }, 1000);
  }

  const g = G.current;
  const total_cells = gridSize * gridSize;

  if (g.done) {
    const total = g.correct + g.wrong;
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">🧩</div>
        <h2 className="text-2xl font-black text-white">Memory Grid Done!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', g.score, 'text-cyan-400'], ['Correct', g.correct, 'text-green-400'], ['Combo', `×${g.maxCombo}`, 'text-yellow-400']].map(([l, v, c]) => (
            <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex justify-between w-full text-sm">
        <span className="text-gray-400">Round {round + 1}/{ROUNDS}</span>
        <span className="text-purple-400 font-bold">
          {phase === 'showing' ? '👁 Memorize!' : phase === 'recall' ? '🧠 Recall!' : '⏳...'}
        </span>
        <span className="text-yellow-400 font-bold">{g.score}pts</span>
      </div>

      <div className={`inline-grid gap-2`} style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
        {Array.from({ length: total_cells }, (_, i) => {
          const isHL = highlighted.has(i);
          const isSel = selected.has(i);
          const isResult = phase === 'result';
          return (
            <motion.button key={i} onClick={() => toggleCell(i)} whileTap={{ scale: 0.85 }}
              className={`w-16 h-16 rounded-xl border-2 transition-all ${
                isResult
                  ? isHL && isSel ? 'bg-green-500/30 border-green-400' :
                    isHL && !isSel ? 'bg-yellow-500/30 border-yellow-400' :
                    !isHL && isSel ? 'bg-red-500/30 border-red-400' : 'bg-white/5 border-white/10'
                  : phase === 'showing'
                  ? isHL ? 'bg-cyan-500/40 border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.4)]' : 'bg-white/5 border-white/10'
                  : isSel ? 'bg-purple-500/30 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'bg-white/5 border-white/15 hover:border-purple-400/50'
              }`}>
              {isResult && isHL && !isSel && <span className="text-yellow-400 text-xs">miss</span>}
            </motion.button>
          );
        })}
      </div>

      {phase === 'recall' && (
        <motion.button onClick={submit} whileTap={{ scale: 0.95 }}
          className="px-8 py-3 rounded-xl font-black bg-cyan-500 text-black hover:bg-cyan-400 transition-all">
          ✓ SUBMIT ({selected.size} selected)
        </motion.button>
      )}
      {phase === 'showing' && <p className="text-cyan-400 text-sm animate-pulse font-bold">Memorize highlighted cells!</p>}
    </div>
  );
}
