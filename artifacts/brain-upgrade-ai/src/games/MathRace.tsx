import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameSession } from '@/context/AppContext';
interface Props { onFinish: (s: Partial<GameSession>) => void; }
const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
function makeQ(level: number) {
  const op = ['+', '-', '×', '÷'][rnd(0, Math.min(level, 3))];
  let q = '', ans = 0;
  if (op === '+') { const a = rnd(5, 20 + level * 5), b = rnd(5, 20 + level * 5); q = `${a} + ${b}`; ans = a + b; }
  else if (op === '-') { const b = rnd(5, 20 + level * 3), a = b + rnd(5, 20); q = `${a} − ${b}`; ans = a - b; }
  else if (op === '×') { const a = rnd(2, 9 + level), b = rnd(2, 12); q = `${a} × ${b}`; ans = a * b; }
  else { const b = rnd(2, 9), a = b * rnd(2, 12); q = `${a} ÷ ${b}`; ans = a / b; }
  const wrongs = new Set<number>();
  while (wrongs.size < 3) { const d = rnd(1, Math.max(3, Math.ceil(ans * 0.2))); wrongs.add(ans + (Math.random() > 0.5 ? d : -d)); }
  return { q, ans, opts: [...[...wrongs].slice(0, 3), ans].sort(() => Math.random() - 0.5) };
}
export default function MathRace({ onFinish }: Props) {
  const TIME = 60;
  const G = useRef({ score: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, level: 1, done: false });
  const [question, setQuestion] = useState(() => makeQ(1));
  const [timeLeft, setTimeLeft] = useState(TIME);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const qRef = useRef(question);
  useEffect(() => { qRef.current = question; }, [question]);
  useEffect(() => {
    timerRef.current = setInterval(() => setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); finish(); return 0; } return t - 1; }), 1000);
    return () => clearInterval(timerRef.current);
  }, []);
  function finish() { clearInterval(timerRef.current); G.current.done = true; const total = G.current.correct + G.current.wrong; onFinish({ gameId: 'math-race', gameName: 'Math Race', domain: 'Speed Math', score: G.current.score, accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0, avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong, maxCombo: G.current.maxCombo, difficulty: 2, xpEarned: Math.floor(G.current.score / 5) }); re(); }
  function answer(choice: number) {
    const ok = choice === qRef.current.ans;
    if (ok) { G.current.combo += 1; G.current.maxCombo = Math.max(G.current.maxCombo, G.current.combo); G.current.score += 10 * Math.min(G.current.combo, 5); G.current.correct += 1; if (G.current.correct % 8 === 0) G.current.level += 1; setFlash('ok'); }
    else { G.current.combo = 0; G.current.wrong += 1; setFlash('bad'); }
    re();
    const q = makeQ(G.current.level); setQuestion(q); qRef.current = q;
    setTimeout(() => setFlash(null), 200);
  }
  const g = G.current;
  if (g.done) { const total = g.correct + g.wrong; return <div className="flex flex-col items-center gap-4 text-center py-6"><div className="text-5xl">🏁</div><h2 className="text-2xl font-black text-white">Race Over!</h2><div className="grid grid-cols-3 gap-3">{[['Score', g.score, 'text-cyan-400'], ['Correct', g.correct, 'text-green-400'], ['Accuracy', `${total > 0 ? Math.round(g.correct / total * 100) : 0}%`, 'text-yellow-400']].map(([l, v, c]) => <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>)}</div></div>; }
  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-sm mx-auto">
      <div className="flex justify-between w-full items-center">
        <span className="text-green-400 font-black text-2xl">✓{g.correct}</span>
        <div className="text-center"><span className={`font-mono font-black text-3xl ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>{timeLeft}s</span></div>
        <span className="text-yellow-400 font-black text-2xl">{g.score}pts</span>
      </div>
      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden"><motion.div className={`h-3 rounded-full ${timeLeft <= 10 ? 'bg-red-500' : 'bg-gradient-to-r from-green-500 to-cyan-500'}`} style={{ width: `${(timeLeft / TIME) * 100}%` }} /></div>
      <motion.div key={g.correct} initial={{ scale: 0.9, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }}
        className={`w-full glass-panel p-8 rounded-2xl text-center border-2 transition-all ${flash === 'ok' ? 'border-green-400 bg-green-500/10' : flash === 'bad' ? 'border-red-400 bg-red-500/10' : 'border-white/10'}`}>
        <p className="text-5xl font-black text-white">{question.q} = <span className="text-yellow-300">?</span></p>
        {g.combo > 1 && <p className="text-orange-400 text-xs font-bold mt-1">🔥 ×{g.combo}</p>}
      </motion.div>
      <div className="grid grid-cols-2 gap-3 w-full">{question.opts.map(opt => <motion.button key={opt} onClick={() => answer(opt)} whileTap={{ scale: 0.88 }} className="py-5 rounded-xl font-black text-2xl bg-white/8 border border-white/15 text-white hover:bg-cyan-500/20 hover:border-cyan-400 transition-all">{opt}</motion.button>)}</div>
    </div>
  );
}
