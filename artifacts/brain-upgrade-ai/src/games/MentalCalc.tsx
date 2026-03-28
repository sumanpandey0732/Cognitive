import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSession } from '@/context/AppContext';
interface Props { onFinish: (s: Partial<GameSession>) => void; }
const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
export default function MentalCalc({ onFinish }: Props) {
  const ROUNDS = 8;
  const G = useRef({ score: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, lives: 5, done: false });
  const [round, setRound] = useState(0);
  const [ops, setOps] = useState<{n: number; op: string}[]>([]);
  const [showIdx, setShowIdx] = useState(-1);
  const [phase, setPhase] = useState<'showing' | 'answering'>('showing');
  const [options, setOptions] = useState<number[]>([]);
  const [finalVal, setFinalVal] = useState(0);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  const finalRef = useRef(0);
  function startRound(r: number) {
    const steps = Math.min(3 + Math.floor(r / 2), 6);
    const speed = Math.max(800, 1500 - r * 80);
    let val = rnd(10, 30);
    const operations: {n: number; op: string}[] = [{ n: val, op: 'START' }];
    for (let i = 0; i < steps - 1; i++) {
      const op = ['+', '-', '×'][rnd(0, r < 3 ? 1 : 2)];
      let n = 0;
      if (op === '+') { n = rnd(2, 15 + r * 3); val += n; }
      else if (op === '-') { n = rnd(2, Math.min(val - 1, 15 + r * 2)); val -= n; }
      else { n = rnd(2, 5); val *= n; }
      operations.push({ n, op });
    }
    finalRef.current = val; setFinalVal(val);
    const wrongs = new Set<number>();
    while (wrongs.size < 3) { const d = rnd(1, Math.max(5, Math.ceil(val * 0.2))); const w = val + (Math.random() > 0.5 ? d : -d); if (w > 0 && w !== val) wrongs.add(w); }
    setOptions([...([...wrongs]).slice(0, 3), val].sort(() => Math.random() - 0.5));
    setOps(operations); setFlash(null); setPhase('showing'); setShowIdx(0); setRound(r);
    let i = 0;
    const timer = setInterval(() => { i++; setShowIdx(i); if (i >= operations.length - 1) { clearInterval(timer); setTimeout(() => setPhase('answering'), speed); } }, speed);
  }
  useEffect(() => { startRound(0); }, []);
  function finish() { G.current.done = true; const total = G.current.correct + G.current.wrong; onFinish({ gameId: 'mental-calc', gameName: 'Mental Calc', domain: 'Speed Math', score: G.current.score, accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0, avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong, maxCombo: G.current.maxCombo, difficulty: 3, xpEarned: Math.floor(G.current.score / 5) }); re(); }
  function answer(choice: number) {
    if (flash) return;
    const ok = choice === finalRef.current;
    if (ok) { G.current.combo += 1; G.current.maxCombo = Math.max(G.current.maxCombo, G.current.combo); G.current.score += 20 * Math.min(G.current.combo, 4); G.current.correct += 1; setFlash('ok'); }
    else { G.current.combo = 0; G.current.wrong += 1; G.current.lives -= 1; setFlash('bad'); }
    re();
    const next = round + 1;
    if (next >= ROUNDS || G.current.lives <= 0) { setTimeout(finish, 600); } else { setTimeout(() => startRound(next), 700); }
  }
  const g = G.current;
  if (g.done) { const total = g.correct + g.wrong; return <div className="flex flex-col items-center gap-4 text-center py-6"><div className="text-5xl">🧮</div><h2 className="text-2xl font-black text-white">Mental Mastery!</h2><div className="grid grid-cols-3 gap-3">{[['Score', g.score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round(g.correct / total * 100) : 0}%`, 'text-green-400'], ['Combo', `×${g.maxCombo}`, 'text-yellow-400']].map(([l, v, c]) => <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>)}</div></div>; }
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex justify-between w-full text-sm">
        <div className="flex gap-1">{[0,1,2,3,4].map(i => <span key={i} className={i < g.lives ? 'text-red-400' : 'text-gray-700'}>♥</span>)}</div>
        <span className="text-gray-400">Round {round + 1}/{ROUNDS}</span>
        <span className="text-yellow-400 font-bold">{g.score}pts</span>
      </div>
      <div className={`w-full glass-panel p-8 rounded-2xl border-2 min-h-36 flex flex-col items-center justify-center transition-all ${flash === 'ok' ? 'border-green-400 bg-green-500/10' : flash === 'bad' ? 'border-red-400 bg-red-500/10' : 'border-white/10'}`}>
        {phase === 'showing' ? (
          <>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Track the calculation in your head!</p>
            <AnimatePresence mode="wait">
              <motion.div key={showIdx} initial={{ y: -20, opacity: 0, scale: 0.7 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0 }} className="text-5xl font-black text-cyan-300" style={{ textShadow: '0 0 25px rgba(0,229,255,0.7)' }}>
                {showIdx >= 0 && showIdx < ops.length ? (ops[showIdx].op === 'START' ? ops[showIdx].n : `${ops[showIdx].op} ${ops[showIdx].n}`) : '...'}
              </motion.div>
            </AnimatePresence>
          </>
        ) : (
          <>
            <p className="text-sm text-cyan-400 font-bold mb-2">What is the final result?</p>
            <div className="flex flex-wrap gap-2 justify-center text-sm text-gray-500">{ops.map((o, i) => <span key={i}>{o.op === 'START' ? o.n : `${o.op}${o.n}`}</span>)}</div>
          </>
        )}
      </div>
      {phase === 'answering' && <div className="grid grid-cols-2 gap-3 w-full">{options.map(opt => <motion.button key={opt} onClick={() => answer(opt)} whileTap={{ scale: 0.88 }} className="py-5 rounded-xl font-black text-2xl bg-white/8 border border-white/15 text-white hover:bg-cyan-500/20 hover:border-cyan-400 transition-all">{opt}</motion.button>)}</div>}
    </div>
  );
}
