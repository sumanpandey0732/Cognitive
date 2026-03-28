import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameSession } from '@/context/AppContext';
interface Props { onFinish: (s: Partial<GameSession>) => void; }
const DIRS = ['↑', '→', '↓', '←', '↗', '↘', '↙', '↖'];
export default function DirectionMemory({ onFinish }: Props) {
  const ROUNDS = 8;
  const G = useRef({ score: 0, correct: 0, wrong: 0, maxLen: 0, combo: 0, done: false });
  const [seq, setSeq] = useState<string[]>([]);
  const [input, setInput] = useState<string[]>([]);
  const [showIdx, setShowIdx] = useState(-1);
  const [phase, setPhase] = useState<'showing' | 'input' | 'result'>('showing');
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [round, setRound] = useState(0);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  function startRound(r: number) {
    const len = 3 + Math.floor(r / 2);
    const s = Array.from({ length: Math.min(len, 8) }, () => DIRS[Math.floor(Math.random() * DIRS.length)]);
    setSeq(s); setInput([]); setFlash(null); setPhase('showing'); setShowIdx(-1);
    const speed = Math.max(400, 800 - r * 40);
    s.forEach((_, i) => { setTimeout(() => setShowIdx(i), i * speed + 200); setTimeout(() => setShowIdx(-1), i * speed + speed - 80); });
    setTimeout(() => { setShowIdx(-1); setPhase('input'); }, s.length * speed + 500);
  }
  useEffect(() => { startRound(0); }, []);
  function finish() { G.current.done = true; const total = G.current.correct + G.current.wrong; onFinish({ gameId: 'direction-memory', gameName: 'Direction Memory', domain: 'Memory', score: G.current.score, accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0, avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong, maxCombo: G.current.maxLen, difficulty: 2, xpEarned: Math.floor(G.current.score / 5) }); re(); }
  function tapDir(d: string) {
    if (phase !== 'input') return;
    const idx = input.length;
    const newInput = [...input, d];
    setInput(newInput);
    if (d !== seq[idx]) {
      G.current.combo = 0; G.current.wrong += 1; setFlash('bad'); re();
      const next = round + 1;
      if (next >= ROUNDS) { setTimeout(finish, 700); } else { setTimeout(() => { setRound(next); startRound(next); }, 900); }
      return;
    }
    if (newInput.length === seq.length) {
      G.current.combo += 1; G.current.maxLen = Math.max(G.current.maxLen, seq.length);
      G.current.score += 15 * seq.length; G.current.correct += seq.length; setFlash('ok'); re();
      const next = round + 1;
      if (next >= ROUNDS) { setTimeout(finish, 600); } else { setTimeout(() => { setRound(next); startRound(next); }, 800); }
    }
  }
  const g = G.current;
  if (g.done) { const total = g.correct + g.wrong; return <div className="flex flex-col items-center gap-4 text-center py-6"><div className="text-5xl">🧭</div><h2 className="text-2xl font-black text-white">Direction Master!</h2><div className="grid grid-cols-3 gap-3">{[['Score', g.score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round(g.correct / total * 100) : 0}%`, 'text-green-400'], ['Max Seq', g.maxLen, 'text-purple-400']].map(([l, v, c]) => <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>)}</div></div>; }
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex justify-between w-full text-sm">
        <span className="text-gray-400">Round {round + 1}/{ROUNDS} • Len: {seq.length}</span>
        <span className="text-yellow-400 font-bold">{g.score}pts</span>
      </div>
      <div className={`w-full glass-panel p-6 rounded-2xl border-2 min-h-28 flex flex-col items-center justify-center transition-all ${flash === 'ok' ? 'border-green-400 bg-green-500/10' : flash === 'bad' ? 'border-red-400 bg-red-500/10' : 'border-white/10'}`}>
        {phase === 'showing' && showIdx >= 0 ? (
          <motion.div key={showIdx} initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-7xl font-black text-cyan-300" style={{ textShadow: '0 0 30px rgba(0,229,255,0.8)' }}>{seq[showIdx]}</motion.div>
        ) : phase === 'showing' ? <p className="text-2xl text-gray-500 animate-pulse">Watch...</p>
        : <div className="flex gap-2 flex-wrap justify-center">{seq.map((d, i) => <span key={i} className={`text-2xl font-black ${i < input.length ? (input[i] === d ? 'text-green-400' : 'text-red-400') : 'text-gray-600'}`}>{i < input.length ? input[i] : '?'}</span>)}</div>}
      </div>
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {['↖','↑','↗','←','·','→','↙','↓','↘'].map((d, i) => d === '·' ? <div key={i} /> : (
          <motion.button key={d} onClick={() => tapDir(d)} whileTap={{ scale: 0.8 }}
            className="aspect-square rounded-xl font-black text-3xl bg-white/8 border border-white/15 text-white hover:bg-purple-500/20 hover:border-purple-400 transition-all disabled:opacity-30"
            disabled={phase !== 'input'}>{d}</motion.button>
        ))}
      </div>
    </div>
  );
}
