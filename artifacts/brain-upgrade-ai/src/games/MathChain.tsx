import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSession } from '@/context/AppContext';
interface Props { onFinish: (s: Partial<GameSession>) => void; }
const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
function nextStep(start: number, level: number) {
  const ops = level < 3 ? ['+', '-'] : level < 6 ? ['+', '-', '×'] : ['+', '-', '×'];
  const op = ops[rnd(0, ops.length - 1)];
  let b = 0, result = 0;
  if (op === '+') { b = rnd(1, 15 + level * 3); result = start + b; }
  else if (op === '-') { b = rnd(1, Math.min(start - 1, 15 + level * 2)); result = start - b; if (b <= 0 || result < 0) { b = 1; result = start + 1; } }
  else { b = rnd(2, 5 + level); result = start * b; }
  const wrongs = new Set<number>();
  while (wrongs.size < 3) { const d = rnd(1, Math.max(3, Math.ceil(result * 0.2))); const w = result + (Math.random() > 0.5 ? d : -d); if (w !== result && w > 0) wrongs.add(w); }
  return { op, b, result, opts: [...[...wrongs].slice(0, 3), result].sort(() => Math.random() - 0.5), question: `${start} ${op} ${b} = ?` };
}
export default function MathChain({ onFinish }: Props) {
  const G = useRef({ score: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, lives: 5, level: 1, done: false, chain: 0 });
  const [current, setCurrent] = useState(rnd(5, 20));
  const [step, setStep] = useState(() => nextStep(rnd(5, 20), 1));
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [qNum, setQNum] = useState(0);
  const [timeLeft, setTimeLeft] = useState(7);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const stepRef = useRef(step);
  useEffect(() => { stepRef.current = step; }, [step]);
  const TOTAL = 15;
  const maxTime = Math.max(3, 7 - Math.floor(qNum / 3));
  useEffect(() => {
    if (G.current.done) return;
    setTimeLeft(maxTime);
    timerRef.current = setInterval(() => setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); submit(null); return 0; } return t - 1; }), 1000);
    return () => clearInterval(timerRef.current);
  }, [qNum]);
  function finish() { clearInterval(timerRef.current); G.current.done = true; const total = G.current.correct + G.current.wrong; onFinish({ gameId: 'math-chain', gameName: 'Math Chain', domain: 'Speed Math', score: G.current.score, accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0, avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong, maxCombo: G.current.maxCombo, difficulty: 2, xpEarned: Math.floor(G.current.score / 5) }); re(); }
  function submit(choice: number | null) {
    clearInterval(timerRef.current);
    const ok = choice !== null && choice === stepRef.current.result;
    if (ok) { G.current.combo += 1; G.current.maxCombo = Math.max(G.current.maxCombo, G.current.combo); G.current.score += 12 * Math.min(G.current.combo, 5) + G.current.chain * 3; G.current.correct += 1; G.current.chain += 1; if (G.current.correct % 5 === 0) G.current.level += 1; setFlash('ok'); }
    else { G.current.combo = 0; G.current.wrong += 1; G.current.lives -= 1; G.current.chain = 0; setFlash('bad'); }
    re();
    const next = qNum + 1;
    if (next >= TOTAL || G.current.lives <= 0) { setTimeout(finish, 450); }
    else {
      const nextStart = ok ? stepRef.current.result : rnd(5, 30);
      setTimeout(() => { const s = nextStep(nextStart, G.current.level); setStep(s); stepRef.current = s; setCurrent(nextStart); setQNum(next); setFlash(null); }, 450);
    }
  }
  const g = G.current;
  if (g.done) { const total = g.correct + g.wrong; return <div className="flex flex-col items-center gap-4 text-center py-6"><div className="text-5xl">⛓️</div><h2 className="text-2xl font-black text-white">Chain Complete!</h2><div className="grid grid-cols-3 gap-3">{[['Score', g.score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round(g.correct / total * 100) : 0}%`, 'text-green-400'], ['Max Chain', g.chain, 'text-orange-400']].map(([l, v, c]) => <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>)}</div></div>; }
  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-sm mx-auto">
      <div className="flex justify-between w-full text-sm">
        <div className="flex gap-1">{[0,1,2,3,4].map(i => <span key={i} className={i < g.lives ? 'text-red-400' : 'text-gray-700'}>♥</span>)}</div>
        <span className="text-orange-400 font-bold">Chain: {g.chain} 🔗</span>
        <span className={`font-mono font-bold ${timeLeft <= 2 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>{timeLeft}s</span>
      </div>
      <div className="w-full h-2 bg-white/5 rounded-full"><motion.div className={`h-2 rounded-full ${timeLeft <= 2 ? 'bg-red-500' : 'bg-orange-500'}`} animate={{ width: `${(timeLeft / maxTime) * 100}%` }} /></div>
      <AnimatePresence mode="wait">
        <motion.div key={qNum} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }}
          className={`w-full glass-panel p-8 rounded-2xl text-center border-2 transition-all ${flash === 'ok' ? 'border-green-400 bg-green-500/10' : flash === 'bad' ? 'border-red-400 bg-red-500/10' : 'border-white/10'}`}>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">The answer becomes the next starting number!</p>
          <p className="text-4xl font-black text-white">{step.question}</p>
          {g.combo > 1 && <p className="text-orange-400 text-xs font-bold mt-2">🔥 ×{g.combo}</p>}
        </motion.div>
      </AnimatePresence>
      <div className="grid grid-cols-2 gap-3 w-full">{step.opts.map(opt => <motion.button key={opt} onClick={() => submit(opt)} whileTap={{ scale: 0.88 }} className="py-5 rounded-xl font-black text-2xl bg-white/8 border border-white/15 text-white hover:bg-orange-500/20 hover:border-orange-400 transition-all">{opt}</motion.button>)}</div>
    </div>
  );
}
