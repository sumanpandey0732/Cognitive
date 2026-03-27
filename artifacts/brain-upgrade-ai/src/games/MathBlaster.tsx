import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

function makeQuestion(level: number) {
  const ops = level < 3 ? ['+', '-'] : level < 6 ? ['+', '-', '×'] : ['+', '-', '×', '÷'];
  const op = ops[rnd(0, ops.length - 1)];
  let q = '', ans = 0;
  if (op === '+') { const a = rnd(5, 15 + level * 5), b = rnd(5, 15 + level * 5); q = `${a} + ${b}`; ans = a + b; }
  else if (op === '-') { const b = rnd(2, 20 + level * 3), a = b + rnd(5, 25); q = `${a} − ${b}`; ans = a - b; }
  else if (op === '×') { const a = rnd(2, 6 + level), b = rnd(2, 12); q = `${a} × ${b}`; ans = a * b; }
  else { const b = rnd(2, 9), a = b * rnd(2, 12); q = `${a} ÷ ${b}`; ans = a / b; }
  const wrongs = new Set<number>();
  while (wrongs.size < 3) {
    const d = rnd(1, Math.max(4, Math.ceil(Math.abs(ans) * 0.25)));
    wrongs.add(ans + (Math.random() > 0.5 ? d : -d));
  }
  const opts = [...[...wrongs].slice(0, 3), ans].sort(() => Math.random() - 0.5);
  return { q, ans, opts };
}

export default function MathBlaster({ onFinish }: Props) {
  const TOTAL = 15;
  const G = useRef({ score: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, lives: 5, level: 1, done: false });
  const [qNum, setQNum] = useState(0);
  const [question, setQuestion] = useState(() => makeQuestion(1));
  const [timeLeft, setTimeLeft] = useState(6);
  const [flash, setFlash] = useState<'none' | 'ok' | 'bad'>('none');
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const qRef = useRef(question);
  useEffect(() => { qRef.current = question; }, [question]);

  const maxTime = Math.max(3, 6 - Math.floor(qNum / 4));

  useEffect(() => {
    if (G.current.done) return;
    setTimeLeft(maxTime);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); submit(null); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [qNum]);

  function finish() {
    clearInterval(timerRef.current);
    G.current.done = true;
    const total = G.current.correct + G.current.wrong;
    onFinish({
      gameId: 'math-blaster', gameName: 'Math Blaster', domain: 'Speed Math',
      score: G.current.score,
      accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0,
      avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong,
      maxCombo: G.current.maxCombo, difficulty: 2,
      xpEarned: Math.floor(G.current.score / 5)
    });
    re();
  }

  function submit(chosen: number | null) {
    clearInterval(timerRef.current);
    const ok = chosen !== null && chosen === qRef.current.ans;
    if (ok) {
      G.current.combo += 1; G.current.maxCombo = Math.max(G.current.maxCombo, G.current.combo);
      G.current.score += 10 * Math.min(G.current.combo, 5); G.current.correct += 1;
      if (G.current.correct % 5 === 0) G.current.level += 1;
      setFlash('ok');
    } else {
      G.current.combo = 0; G.current.wrong += 1; G.current.lives -= 1; setFlash('bad');
    }
    re();
    const next = qNum + 1;
    if (next >= TOTAL || G.current.lives <= 0) { setTimeout(finish, 400); }
    else {
      setTimeout(() => {
        const q = makeQuestion(G.current.level);
        setQuestion(q); qRef.current = q; setQNum(next); setFlash('none');
      }, 400);
    }
  }

  const g = G.current;
  if (g.done) {
    const total = g.correct + g.wrong;
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">🚀</div>
        <h2 className="text-2xl font-black text-white">Blast Complete!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', g.score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round(g.correct / total * 100) : 0}%`, 'text-green-400'], ['Combo', `×${g.maxCombo}`, 'text-yellow-400']].map(([l, v, c]) => (
            <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-sm mx-auto">
      <div className="flex justify-between w-full text-sm">
        <div className="flex gap-1">{[0,1,2,3,4].map(i => <span key={i} className={i < g.lives ? 'text-red-400' : 'text-gray-700'}>♥</span>)}</div>
        <span className="text-yellow-400 font-bold">{qNum + 1}/{TOTAL} • {g.score}pts</span>
        <span className={`font-mono font-bold ${timeLeft <= 2 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>{timeLeft}s</span>
      </div>
      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div className={`h-2 rounded-full ${timeLeft <= 2 ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-500 to-purple-500'}`}
          animate={{ width: `${(timeLeft / maxTime) * 100}%` }} transition={{ duration: 0.3 }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={qNum} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.1, opacity: 0 }}
          className={`w-full glass-panel p-8 rounded-2xl text-center border-2 transition-colors ${flash === 'ok' ? 'border-green-400 bg-green-500/10' : flash === 'bad' ? 'border-red-400 bg-red-500/10' : 'border-white/10'}`}>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Q{qNum + 1}</p>
          <p className="text-5xl font-black text-white">{question.q} = <span className="text-yellow-300">?</span></p>
          {g.combo > 1 && <p className="text-orange-400 text-xs font-bold mt-2">🔥 ×{g.combo} Combo!</p>}
        </motion.div>
      </AnimatePresence>
      <div className="grid grid-cols-2 gap-3 w-full">
        {question.opts.map(opt => (
          <motion.button key={opt} onClick={() => submit(opt)} whileTap={{ scale: 0.88 }}
            className="py-5 rounded-xl font-black text-2xl bg-white/8 border border-white/15 text-white hover:bg-cyan-500/25 hover:border-cyan-400 transition-all">
            {opt}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
