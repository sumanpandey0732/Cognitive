import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

export default function SpeedSort({ onFinish }: Props) {
  const ROUNDS = 10;
  const G = useRef({ score: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, done: false });
  const [round, setRound] = useState(0);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected] = useState<number[]>([]);
  const [sorted, setSorted] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(8);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  function genRound(r: number) {
    const count = Math.min(4 + Math.floor(r / 2), 8);
    const used = new Set<number>();
    const nums: number[] = [];
    while (nums.length < count) {
      const n = rnd(1, 50 + r * 10);
      if (!used.has(n)) { used.add(n); nums.push(n); }
    }
    const o: 'asc' | 'desc' = Math.random() > 0.5 ? 'asc' : 'desc';
    return { nums, o };
  }

  function startRound(r: number) {
    clearInterval(timerRef.current);
    const { nums, o } = genRound(r);
    setNumbers(nums.sort(() => Math.random() - 0.5));
    setOrder(o);
    setSelected([]);
    setSorted([]);
    setFlash(null);
    const t = Math.max(4, 8 - Math.floor(r / 2));
    setTimeLeft(t);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    startRound(0);
    return () => clearInterval(timerRef.current);
  }, []);

  function handleTimeout() {
    G.current.combo = 0;
    G.current.wrong += 1;
    re();
    const next = round + 1;
    if (next >= ROUNDS || G.current.wrong >= 3) finish();
    else { setRound(next); setTimeout(() => startRound(next), 600); }
  }

  function finish() {
    clearInterval(timerRef.current);
    G.current.done = true;
    const total = G.current.correct + G.current.wrong;
    onFinish({
      gameId: 'speed-sort', gameName: 'Speed Sort', domain: 'Logic',
      score: G.current.score,
      accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0,
      avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong,
      maxCombo: G.current.maxCombo, difficulty: 2,
      xpEarned: Math.floor(G.current.score / 5)
    });
    re();
  }

  function tapNumber(n: number) {
    if (selected.includes(n) || flash) return;
    const newSel = [...selected, n];
    setSelected(newSel);

    // Check if the selected sequence is correct so far
    const correctOrder = [...numbers].sort((a, b) => order === 'asc' ? a - b : b - a);
    const idx = newSel.length - 1;

    if (n !== correctOrder[idx]) {
      G.current.combo = 0;
      G.current.wrong += 1;
      setFlash('bad');
      clearInterval(timerRef.current);
      re();
      setTimeout(() => {
        const next = round + 1;
        if (next >= ROUNDS || G.current.wrong >= 3) finish();
        else { setRound(next); startRound(next); }
      }, 700);
      return;
    }

    setSorted(correctOrder.slice(0, newSel.length));

    if (newSel.length === numbers.length) {
      clearInterval(timerRef.current);
      G.current.combo += 1;
      G.current.maxCombo = Math.max(G.current.maxCombo, G.current.combo);
      G.current.score += 20 * Math.min(G.current.combo, 4) + timeLeft * 2;
      G.current.correct += 1;
      setFlash('ok');
      re();
      setTimeout(() => {
        const next = round + 1;
        if (next >= ROUNDS) finish();
        else { setRound(next); startRound(next); }
      }, 600);
    }
  }

  const g = G.current;
  if (g.done) {
    const total = g.correct + g.wrong;
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">🔢</div>
        <h2 className="text-2xl font-black text-white">Sort Complete!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', g.score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round(g.correct / total * 100) : 0}%`, 'text-green-400'], ['Combo', `×${g.maxCombo}`, 'text-yellow-400']].map(([l, v, c]) => (
            <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>
          ))}
        </div>
      </div>
    );
  }

  const correctOrder = [...numbers].sort((a, b) => order === 'asc' ? a - b : b - a);
  const maxTime = Math.max(4, 8 - Math.floor(round / 2));

  return (
    <div className="flex flex-col gap-5 w-full max-w-sm mx-auto">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">{round + 1}/{ROUNDS}</span>
        <div className="glass-panel px-4 py-1.5 rounded-full">
          <span className="text-white font-black">Sort </span>
          <span className={`font-black ${order === 'asc' ? 'text-green-400' : 'text-red-400'}`}>
            {order === 'asc' ? '↑ SMALLEST → LARGEST' : '↓ LARGEST → SMALLEST'}
          </span>
        </div>
        <span className={`font-mono font-bold ${timeLeft <= 2 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>{timeLeft}s</span>
      </div>
      <div className="w-full h-2 bg-white/5 rounded-full">
        <motion.div className={`h-2 rounded-full ${timeLeft <= 2 ? 'bg-red-500' : 'bg-cyan-500'}`}
          animate={{ width: `${(timeLeft / maxTime) * 100}%` }} />
      </div>

      {/* Selected so far */}
      <div className={`glass-panel p-4 rounded-xl border-2 min-h-12 flex gap-2 items-center justify-center flex-wrap transition-all ${
        flash === 'ok' ? 'border-green-400 bg-green-500/10' : flash === 'bad' ? 'border-red-400 bg-red-500/10' : 'border-white/10'
      }`}>
        {selected.length === 0
          ? <p className="text-gray-500 text-sm">Tap numbers in order...</p>
          : selected.map((n, i) => (
            <span key={i} className={`font-black text-xl px-3 py-1 rounded-lg ${
              n === correctOrder[i] ? 'text-green-400 bg-green-500/20' : 'text-red-400 bg-red-500/20'
            }`}>{n}</span>
          ))}
        {flash === 'ok' && <span className="text-green-400 font-black text-2xl">✓ +{20 * Math.min(g.combo, 4) + timeLeft * 2}pts</span>}
      </div>

      {/* Number grid */}
      <div className="grid grid-cols-4 gap-2">
        {numbers.map(n => (
          <motion.button key={n}
            onClick={() => tapNumber(n)}
            whileTap={{ scale: 0.85 }}
            disabled={selected.includes(n) || !!flash}
            className={`py-4 rounded-xl font-black text-xl border-2 transition-all ${
              selected.includes(n) ? 'bg-white/5 border-white/5 text-gray-600 cursor-default' :
              'bg-white/8 border-white/15 text-white hover:bg-cyan-500/20 hover:border-cyan-400'
            }`}>
            {n}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
