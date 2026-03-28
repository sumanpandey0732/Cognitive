import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSession } from '@/context/AppContext';
interface Props { onFinish: (s: Partial<GameSession>) => void; }
const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
export default function SpeedAddition({ onFinish }: Props) {
  const ROUNDS = 10;
  const G = useRef({ score: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, lives: 5, done: false });
  const [round, setRound] = useState(0);
  const [nums, setNums] = useState<number[]>([]);
  const [showIdx, setShowIdx] = useState(-1);
  const [total, setTotal] = useState(0);
  const [phase, setPhase] = useState<'showing' | 'answering'>('showing');
  const [options, setOptions] = useState<number[]>([]);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  const totalRef = useRef(0);
  function startRound(r: number) {
    const count = Math.min(3 + Math.floor(r / 2), 7);
    const speed = Math.max(500, 1000 - r * 50);
    const numbers = Array.from({ length: count }, () => rnd(1, 10 + r * 3));
    const sum = numbers.reduce((a, b) => a + b, 0);
    totalRef.current = sum; setTotal(sum); setNums(numbers); setFlash(null); setPhase('showing'); setShowIdx(0);
    const wrongs = new Set<number>();
    while (wrongs.size < 3) { const d = rnd(1, Math.max(5, Math.ceil(sum * 0.2))); const w = sum + (Math.random() > 0.5 ? d : -d); if (w > 0 && w !== sum) wrongs.add(w); }
    setOptions([...([...wrongs]).slice(0, 3), sum].sort(() => Math.random() - 0.5));
    let i = 0;
    const interval = setInterval(() => {
      i++; setShowIdx(i);
      if (i >= count - 1) { clearInterval(interval); setTimeout(() => setPhase('answering'), speed); }
    }, speed);
  }
  useEffect(() => { startRound(0); }, []);
  function finish() { G.current.done = true; const total = G.current.correct + G.current.wrong; onFinish({ gameId: 'speed-addition', gameName: 'Speed Addition', domain: 'Speed Math', score: G.current.score, accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0, avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong, maxCombo: G.current.maxCombo, difficulty: 2, xpEarned: Math.floor(G.current.score / 5) }); re(); }
  function answer(choice: number) {
    if (flash) return;
    const ok = choice === totalRef.current;
    if (ok) { G.current.combo += 1; G.current.maxCombo = Math.max(G.current.maxCombo, G.current.combo); G.current.score += 15 * Math.min(G.current.combo, 4); G.current.correct += 1; setFlash('ok'); }
    else { G.current.combo = 0; G.current.wrong += 1; G.current.lives -= 1; setFlash('bad'); }
    re();
    const next = round + 1;
    if (next >= ROUNDS || G.current.lives <= 0) { setTimeout(finish, 600); }
    else { setTimeout(() => { setRound(next); startRound(next); }, 700); }
  }
  const g = G.current;
  if (g.done) { const total = g.correct + g.wrong; return <div className="flex flex-col items-center gap-4 text-center py-6"><div className="text-5xl">➕</div><h2 className="text-2xl font-black text-white">Addition Done!</h2><div className="grid grid-cols-3 gap-3">{[['Score', g.score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round(g.correct / total * 100) : 0}%`, 'text-green-400'], ['Combo', `×${g.maxCombo}`, 'text-yellow-400']].map(([l, v, c]) => <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>)}</div></div>; }
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex justify-between w-full text-sm">
        <div className="flex gap-1">{[0,1,2,3,4].map(i => <span key={i} className={i < g.lives ? 'text-red-400' : 'text-gray-700'}>♥</span>)}</div>
        <span className="text-gray-400">Round {round + 1}/{ROUNDS}</span>
        <span className="text-yellow-400 font-bold">{g.score}pts</span>
      </div>
      <div className={`w-full glass-panel p-8 rounded-2xl border-2 text-center min-h-36 flex flex-col items-center justify-center transition-all ${flash === 'ok' ? 'border-green-400 bg-green-500/10' : flash === 'bad' ? 'border-red-400 bg-red-500/10' : 'border-white/10'}`}>
        {phase === 'showing' ? (
          <>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Keep a running total!</p>
            <AnimatePresence mode="wait">
              <motion.div key={showIdx} initial={{ y: -20, opacity: 0, scale: 0.5 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0 }}
                className="text-7xl font-black text-cyan-300" style={{ textShadow: '0 0 30px rgba(0,229,255,0.8)' }}>
                {showIdx >= 0 && showIdx < nums.length ? (showIdx > 0 ? `+${nums[showIdx]}` : nums[showIdx]) : '...'}
              </motion.div>
            </AnimatePresence>
          </>
        ) : (
          <>
            <p className="text-sm text-cyan-400 font-bold mb-2">What was the total?</p>
            <p className="text-gray-500 text-sm">{nums.join(' + ')} = ?</p>
          </>
        )}
      </div>
      {phase === 'answering' && (
        <div className="grid grid-cols-2 gap-3 w-full">{options.map(opt => <motion.button key={opt} onClick={() => answer(opt)} whileTap={{ scale: 0.88 }} className="py-5 rounded-xl font-black text-2xl bg-white/8 border border-white/15 text-white hover:bg-cyan-500/20 hover:border-cyan-400 transition-all">{opt}</motion.button>)}</div>
      )}
    </div>
  );
}
