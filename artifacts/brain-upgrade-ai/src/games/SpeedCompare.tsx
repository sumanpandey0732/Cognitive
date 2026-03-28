import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSession } from '@/context/AppContext';
interface Props { onFinish: (s: Partial<GameSession>) => void; }
const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
function makePair(level: number) {
  const type = rnd(0, Math.min(level, 2));
  let left = 0, right = 0, hint = '';
  if (type === 0) { left = rnd(1, 100 + level * 20); right = rnd(1, 100 + level * 20); while (left === right) right = rnd(1, 100 + level * 20); hint = 'Which is LARGER?'; }
  else if (type === 1) {
    const a = rnd(2, 20), b = rnd(2, 20), c = rnd(2, 20), d = rnd(2, 20);
    left = a * b; right = c * d; while (left === right) { const nd = rnd(2, 20); right = c * nd; }
    hint = `${a}×${b}  vs  ${c}×${d}`;
  } else {
    const a = rnd(5, 30), b = rnd(2, 10); const c = rnd(5, 30), d = rnd(2, 10);
    left = a + b; right = c - d;
    hint = `${a}+${b}  vs  ${c}−${d}`;
  }
  return { left, right, hint, answer: left > right ? 'left' : 'right' };
}
export default function SpeedCompare({ onFinish }: Props) {
  const TOTAL = 20;
  const G = useRef({ score: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, lives: 5, level: 0, done: false });
  const [qNum, setQNum] = useState(0);
  const [pair, setPair] = useState(() => makePair(0));
  const [timeLeft, setTimeLeft] = useState(5);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const pairRef = useRef(pair);
  useEffect(() => { pairRef.current = pair; }, [pair]);
  const maxTime = Math.max(2, 5 - Math.floor(qNum / 6));
  useEffect(() => {
    if (G.current.done) return;
    setTimeLeft(maxTime);
    timerRef.current = setInterval(() => setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); answer(null); return 0; } return t - 1; }), 1000);
    return () => clearInterval(timerRef.current);
  }, [qNum]);
  function finish() { clearInterval(timerRef.current); G.current.done = true; const total = G.current.correct + G.current.wrong; onFinish({ gameId: 'speed-compare', gameName: 'Speed Compare', domain: 'Logic', score: G.current.score, accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0, avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong, maxCombo: G.current.maxCombo, difficulty: 1, xpEarned: Math.floor(G.current.score / 5) }); re(); }
  function answer(side: 'left' | 'right' | null) {
    clearInterval(timerRef.current);
    const ok = side !== null && side === pairRef.current.answer;
    if (ok) { G.current.combo += 1; G.current.maxCombo = Math.max(G.current.maxCombo, G.current.combo); G.current.score += 8 * Math.min(G.current.combo, 6); G.current.correct += 1; if (G.current.correct % 5 === 0) G.current.level += 1; setFlash('ok'); }
    else { G.current.combo = 0; G.current.wrong += 1; G.current.lives -= 1; setFlash('bad'); }
    re();
    const next = qNum + 1;
    if (next >= TOTAL || G.current.lives <= 0) { setTimeout(finish, 400); }
    else { setTimeout(() => { const p = makePair(G.current.level); setPair(p); pairRef.current = p; setQNum(next); setFlash(null); }, 400); }
  }
  const g = G.current;
  if (g.done) { const total = g.correct + g.wrong; return <div className="flex flex-col items-center gap-4 text-center py-6"><div className="text-5xl">⚖️</div><h2 className="text-2xl font-black text-white">Compare Complete!</h2><div className="grid grid-cols-3 gap-3">{[['Score', g.score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round(g.correct / total * 100) : 0}%`, 'text-green-400'], ['Combo', `×${g.maxCombo}`, 'text-yellow-400']].map(([l, v, c]) => <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>)}</div></div>; }
  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-sm mx-auto">
      <div className="flex justify-between w-full text-sm">
        <div className="flex gap-1">{[0,1,2,3,4].map(i => <span key={i} className={i < g.lives ? 'text-red-400' : 'text-gray-700'}>♥</span>)}</div>
        <span className="text-yellow-400 font-bold">{qNum + 1}/{TOTAL} • {g.score}pts</span>
        <span className={`font-mono font-bold ${timeLeft <= 1 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>{timeLeft}s</span>
      </div>
      <div className="w-full h-2 bg-white/5 rounded-full"><motion.div className={`h-2 rounded-full ${timeLeft <= 1 ? 'bg-red-500' : 'bg-cyan-500'}`} animate={{ width: `${(timeLeft / maxTime) * 100}%` }} /></div>
      <p className="text-sm text-gray-400 font-bold">{pair.hint || 'Which is LARGER?'}</p>
      <AnimatePresence mode="wait">
        <motion.div key={qNum} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-4 w-full">
          {(['left', 'right'] as const).map(side => (
            <motion.button key={side} onClick={() => answer(side)} whileTap={{ scale: 0.88 }}
              className={`py-8 rounded-2xl font-black text-4xl border-2 transition-all ${
                flash === 'ok' && pair.answer === side ? 'bg-green-500/30 border-green-400' :
                flash === 'bad' && pair.answer === side ? 'bg-green-500/10 border-green-400/30' :
                'bg-white/8 border-white/15 text-white hover:bg-cyan-500/20 hover:border-cyan-400'
              }`}>
              {side === 'left' ? pair.left : pair.right}
            </motion.button>
          ))}
        </motion.div>
      </AnimatePresence>
      {g.combo > 1 && !flash && <p className="text-orange-400 text-sm font-bold">🔥 ×{g.combo} Combo!</p>}
    </div>
  );
}
