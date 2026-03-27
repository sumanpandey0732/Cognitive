import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

function makeStatement(level: number) {
  const ops = level < 4 ? ['+', '-'] : level < 7 ? ['+', '-', '×'] : ['+', '-', '×', '÷'];
  const op = ops[rnd(0, ops.length - 1)];
  let q = '', correct = 0;
  if (op === '+') { const a = rnd(2, 20 + level * 5), b = rnd(2, 20 + level * 5); q = `${a} + ${b}`; correct = a + b; }
  else if (op === '-') { const b = rnd(2, 20), a = b + rnd(2, 20); q = `${a} − ${b}`; correct = a - b; }
  else if (op === '×') { const a = rnd(2, 9 + level), b = rnd(2, 9); q = `${a} × ${b}`; correct = a * b; }
  else { const b = rnd(2, 9), a = b * rnd(2, 9); q = `${a} ÷ ${b}`; correct = a / b; }

  const showWrong = Math.random() > 0.45;
  let shown = correct;
  if (showWrong) {
    while (shown === correct) shown = correct + (Math.random() > 0.5 ? 1 : -1) * rnd(1, Math.max(3, Math.ceil(correct * 0.2)));
  }
  return { question: `${q} = ${shown}`, isTrue: !showWrong, correct };
}

export default function TrueOrFalse({ onFinish }: Props) {
  const TOTAL = 20;
  const G = useRef({ score: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, lives: 5, level: 1, done: false });
  const [qNum, setQNum] = useState(0);
  const [stmt, setStmt] = useState(() => makeStatement(1));
  const [timeLeft, setTimeLeft] = useState(5);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const stmtRef = useRef(stmt);
  useEffect(() => { stmtRef.current = stmt; }, [stmt]);

  const maxTime = Math.max(2, 5 - Math.floor(qNum / 6));

  useEffect(() => {
    if (G.current.done) return;
    setTimeLeft(maxTime);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); answer(null); return 0; }
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
      gameId: 'true-or-false', gameName: 'True or False', domain: 'Speed Math',
      score: G.current.score,
      accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0,
      avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong,
      maxCombo: G.current.maxCombo, difficulty: 2,
      xpEarned: Math.floor(G.current.score / 5)
    });
    re();
  }

  function answer(choice: boolean | null) {
    clearInterval(timerRef.current);
    const ok = choice !== null && choice === stmtRef.current.isTrue;
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
    if (next >= TOTAL || G.current.lives <= 0) { setTimeout(finish, 450); }
    else {
      setTimeout(() => {
        const s = makeStatement(G.current.level);
        setStmt(s); stmtRef.current = s;
        setQNum(next); setFlash(null);
      }, 450);
    }
  }

  const g = G.current;
  if (g.done) {
    const total = g.correct + g.wrong;
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">✅</div>
        <h2 className="text-2xl font-black text-white">Truth Verified!</h2>
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
        <span className={`font-mono font-bold ${timeLeft <= 1 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>{timeLeft}s</span>
      </div>
      <div className="w-full h-2 bg-white/5 rounded-full">
        <motion.div className={`h-2 rounded-full ${timeLeft <= 1 ? 'bg-red-500' : 'bg-cyan-500'}`}
          animate={{ width: `${(timeLeft / maxTime) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={qNum} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
          className={`w-full glass-panel p-8 rounded-2xl text-center border-2 transition-all ${
            flash === 'ok' ? 'border-green-400 bg-green-500/10' : flash === 'bad' ? 'border-red-400 bg-red-500/10' : 'border-white/10'
          }`}>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Is this TRUE or FALSE?</p>
          <p className="text-4xl font-black text-white">{stmt.question}</p>
          {g.combo > 1 && <p className="text-orange-400 text-xs font-bold mt-2">🔥 ×{g.combo}</p>}
        </motion.div>
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-4 w-full">
        {[{ label: '✅ TRUE', val: true, bg: 'bg-green-500/20', border: 'border-green-400', hover: 'hover:bg-green-500/30' },
          { label: '❌ FALSE', val: false, bg: 'bg-red-500/20', border: 'border-red-400', hover: 'hover:bg-red-500/30' }].map(b => (
          <motion.button key={String(b.val)} onClick={() => answer(b.val)} whileTap={{ scale: 0.88 }}
            className={`py-6 rounded-xl font-black text-xl border-2 transition-all ${b.bg} ${b.border} ${b.hover} text-white`}>
            {b.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
