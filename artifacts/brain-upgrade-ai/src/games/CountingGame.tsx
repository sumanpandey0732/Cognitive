import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSession } from '@/context/AppContext';
interface Props { onFinish: (s: Partial<GameSession>) => void; }
const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
export default function CountingGame({ onFinish }: Props) {
  const ROUNDS = 10;
  const G = useRef({ score: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, lives: 5, level: 0, done: false });
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState(0);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<'up' | 'down'>('up');
  const [options, setOptions] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(6);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const optRef = useRef<number[]>([]);
  const currentRef = useRef(0);
  function startRound(r: number) {
    clearInterval(timerRef.current);
    const s = [2, 3, 5, 7, 10, 4, 6, 8][rnd(0, Math.min(r, 7))];
    const startVal = rnd(10, 50);
    const d = Math.random() > 0.5 ? 'up' : 'down';
    const steps = rnd(3, 5 + r);
    const ans = d === 'up' ? startVal + s * steps : startVal - s * steps;
    const wrongs = new Set<number>();
    while (wrongs.size < 3) { const w = ans + (Math.random() > 0.5 ? 1 : -1) * rnd(s, s * 3); if (w !== ans) wrongs.add(w); }
    const opts = [...[...wrongs].slice(0, 3), ans].sort(() => Math.random() - 0.5);
    setTarget(ans); setStep(s); setDir(d as 'up'|'down'); setCurrent(startVal); currentRef.current = startVal; setOptions(opts); optRef.current = opts; setFlash(null); setRound(r); setTimeLeft(6);
    timerRef.current = setInterval(() => setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); answerFn(null); return 0; } return t - 1; }), 1000);
  }
  function answerFn(choice: number | null) {
    clearInterval(timerRef.current);
    const ok = choice !== null && choice === target;
    if (ok) { G.current.combo += 1; G.current.maxCombo = Math.max(G.current.maxCombo, G.current.combo); G.current.score += 12 * Math.min(G.current.combo, 5); G.current.correct += 1; setFlash('ok'); }
    else { G.current.combo = 0; G.current.wrong += 1; G.current.lives -= 1; setFlash('bad'); }
    re();
    const next = round + 1;
    if (next >= ROUNDS || G.current.lives <= 0) { setTimeout(finish, 500); }
    else { setTimeout(() => startRound(next), 600); }
  }
  useEffect(() => { startRound(0); return () => clearInterval(timerRef.current); }, []);
  function finish() { G.current.done = true; const total = G.current.correct + G.current.wrong; onFinish({ gameId: 'counting-game', gameName: 'Count Pattern', domain: 'Logic', score: G.current.score, accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0, avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong, maxCombo: G.current.maxCombo, difficulty: 2, xpEarned: Math.floor(G.current.score / 5) }); re(); }
  const g = G.current;
  if (g.done) { const total = g.correct + g.wrong; return <div className="flex flex-col items-center gap-4 text-center py-6"><div className="text-5xl">🔢</div><h2 className="text-2xl font-black text-white">Count Master!</h2><div className="grid grid-cols-3 gap-3">{[['Score', g.score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round(g.correct / total * 100) : 0}%`, 'text-green-400'], ['Combo', `×${g.maxCombo}`, 'text-yellow-400']].map(([l, v, c]) => <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>)}</div></div>; }
  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-sm mx-auto">
      <div className="flex justify-between w-full text-sm">
        <div className="flex gap-1">{[0,1,2,3,4].map(i => <span key={i} className={i < g.lives ? 'text-red-400' : 'text-gray-700'}>♥</span>)}</div>
        <span className="text-yellow-400 font-bold">{round + 1}/{ROUNDS} • {g.score}pts</span>
        <span className={`font-mono font-bold ${timeLeft <= 2 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>{timeLeft}s</span>
      </div>
      <div className="w-full h-2 bg-white/5 rounded-full"><motion.div className={`h-2 rounded-full ${timeLeft <= 2 ? 'bg-red-500' : 'bg-cyan-500'}`} animate={{ width: `${(timeLeft / 6) * 100}%` }} /></div>
      <AnimatePresence mode="wait">
        <motion.div key={round} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className={`w-full glass-panel p-6 rounded-2xl border-2 text-center transition-all ${flash === 'ok' ? 'border-green-400 bg-green-500/10' : flash === 'bad' ? 'border-red-400 bg-red-500/10' : 'border-white/10'}`}>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Starting at <span className="text-white font-bold">{current}</span>, count <span className="text-cyan-400 font-bold">{dir === 'up' ? 'UP' : 'DOWN'}</span> by <span className="text-yellow-400 font-bold">{step}</span>s</p>
          <p className="text-4xl font-black text-white mt-2">{current} → {dir === 'up' ? '+' : '−'}{step} → {dir === 'up' ? '+' : '−'}{step} → ... → <span className="text-yellow-300">?</span></p>
          {flash === 'bad' && <p className="text-red-400 text-sm mt-2">Answer: {target}</p>}
        </motion.div>
      </AnimatePresence>
      <div className="grid grid-cols-2 gap-3 w-full">
        {options.map(opt => <motion.button key={opt} onClick={() => answerFn(opt)} whileTap={{ scale: 0.88 }} className="py-5 rounded-xl font-black text-2xl bg-white/8 border border-white/15 text-white hover:bg-cyan-500/20 hover:border-cyan-400 transition-all">{opt}</motion.button>)}
      </div>
    </div>
  );
}
