import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

function genDots(count: number) {
  const dots: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    let x: number, y: number, ok = false;
    for (let t = 0; t < 50; t++) {
      x = rnd(10, 90); y = rnd(10, 90);
      if (dots.every(d => Math.hypot(d.x - x!, d.y - y!) > 12)) { ok = true; break; }
    }
    dots.push({ x: x!, y: y! });
  }
  return dots;
}

export default function FlashCount({ onFinish }: Props) {
  const ROUNDS = 10;
  const G = useRef({ score: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, done: false });
  const [phase, setPhase] = useState<'showing' | 'answer' | 'result'>('showing');
  const [dots, setDots] = useState<{ x: number; y: number }[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [options, setOptions] = useState<number[]>([]);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [round, setRound] = useState(0);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);

  function startRound(r: number) {
    const count = rnd(3 + Math.floor(r / 2), 6 + Math.floor(r / 2));
    const d = genDots(count);
    setDots(d);
    setCorrectCount(count);
    setPhase('showing');
    setFlash(null);

    const opts = new Set([count]);
    while (opts.size < 4) { opts.add(Math.max(1, count + rnd(-3, 3))); }
    setOptions([...opts].sort(() => Math.random() - 0.5));

    const showMs = Math.max(300, 800 - r * 40);
    setTimeout(() => { setDots([]); setPhase('answer'); }, showMs);
  }

  useEffect(() => { startRound(0); }, []);

  function finish() {
    G.current.done = true;
    const total = G.current.correct + G.current.wrong;
    onFinish({
      gameId: 'flash-count', gameName: 'Flash Count', domain: 'Focus',
      score: G.current.score,
      accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0,
      avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong,
      maxCombo: G.current.maxCombo, difficulty: 2,
      xpEarned: Math.floor(G.current.score / 5)
    });
    re();
  }

  function answer(n: number) {
    if (phase !== 'answer' || flash) return;
    const ok = n === correctCount;
    setFlash(ok ? 'ok' : 'bad');
    if (ok) {
      G.current.combo += 1; G.current.maxCombo = Math.max(G.current.maxCombo, G.current.combo);
      G.current.score += 15 * Math.min(G.current.combo, 4); G.current.correct += 1;
    } else { G.current.combo = 0; G.current.wrong += 1; }
    re();
    const next = round + 1;
    setTimeout(() => { if (next >= ROUNDS) finish(); else { setRound(next); startRound(next); } }, 700);
  }

  const g = G.current;
  if (g.done) {
    const total = g.correct + g.wrong;
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">👁</div>
        <h2 className="text-2xl font-black text-white">Flash Count Done!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', g.score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round(g.correct / total * 100) : 0}%`, 'text-green-400'], ['Combo', `×${g.maxCombo}`, 'text-yellow-400']].map(([l, v, c]) => (
            <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{round + 1}/{ROUNDS}</span>
        <span className="text-yellow-400 font-bold">{g.score}pts{g.combo > 1 ? ` • 🔥×${g.combo}` : ''}</span>
      </div>

      <div className={`relative w-full rounded-2xl border-2 overflow-hidden transition-all ${
        flash === 'ok' ? 'border-green-400 bg-green-500/10' : flash === 'bad' ? 'border-red-400 bg-red-500/10' : 'border-white/10 bg-black/40'
      }`} style={{ height: 280 }}>
        {phase === 'showing' ? (
          <AnimatePresence>
            {dots.map((d, i) => (
              <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute w-5 h-5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.8)]"
                style={{ left: `${d.x}%`, top: `${d.y}%`, transform: 'translate(-50%,-50%)' }} />
            ))}
          </AnimatePresence>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {flash
              ? <p className={`text-2xl font-black ${flash === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
                  {flash === 'ok' ? `✓ Correct! ${correctCount}` : `✗ Answer was ${correctCount}`}
                </p>
              : <p className="text-xl text-white font-bold animate-pulse">How many dots did you see?</p>}
          </div>
        )}
        {phase === 'showing' && (
          <div className="absolute inset-x-0 top-2 text-center">
            <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest animate-pulse">Count the dots!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {options.map(opt => (
          <motion.button key={opt} onClick={() => answer(opt)} whileTap={{ scale: 0.85 }}
            disabled={!!flash || phase !== 'answer'}
            className={`py-5 rounded-xl font-black text-2xl border-2 transition-all ${
              flash && opt === correctCount ? 'bg-green-500/20 border-green-400 text-green-400' :
              'bg-white/8 border-white/15 text-white hover:bg-cyan-500/20 hover:border-cyan-400 disabled:opacity-30'
            }`}>
            {opt}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
