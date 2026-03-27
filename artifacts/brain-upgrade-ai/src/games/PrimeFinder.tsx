import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

function isPrime(n: number) {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false;
  return true;
}

const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

function genGrid(size: number, level: number) {
  const used = new Set<number>();
  const nums: number[] = [];
  const max = 30 + level * 15;
  while (nums.length < size) {
    const n = rnd(2, max);
    if (!used.has(n)) { used.add(n); nums.push(n); }
  }
  return nums;
}

export default function PrimeFinder({ onFinish }: Props) {
  const ROUNDS = 6;
  const G = useRef({ score: 0, correct: 0, wrong: 0, done: false });
  const [round, setRound] = useState(0);
  const [grid, setGrid] = useState<number[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(15);
  const [revealed, setRevealed] = useState(false);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  function startRound(r: number) {
    clearInterval(timerRef.current);
    const size = 12 + r * 2;
    const g = genGrid(size, r);
    setGrid(g);
    setSelected(new Set());
    setRevealed(false);
    setTimeLeft(Math.max(8, 15 - r));

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); submitRound(r, g); return 0; }
        return t - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    startRound(0);
    return () => clearInterval(timerRef.current);
  }, []);

  function submitRound(r: number, g: number[]) {
    clearInterval(timerRef.current);
    setRevealed(true);
    const primes = new Set(g.filter(isPrime));
    let correct = 0, wrong = 0;
    selected.forEach(n => { if (primes.has(n)) correct++; else wrong++; });
    primes.forEach(n => { if (!selected.has(n)) wrong++; });
    G.current.correct += correct;
    G.current.wrong += wrong;
    G.current.score += correct * 10 - wrong * 5;
    re();
    const next = r + 1;
    setTimeout(() => {
      if (next >= ROUNDS) finish();
      else { setRound(next); startRound(next); }
    }, 1200);
  }

  function finish() {
    G.current.done = true;
    const total = G.current.correct + G.current.wrong;
    onFinish({
      gameId: 'prime-finder', gameName: 'Prime Finder', domain: 'Logic',
      score: Math.max(0, G.current.score),
      accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0,
      avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong,
      maxCombo: 0, difficulty: 2,
      xpEarned: Math.floor(Math.max(0, G.current.score) / 5)
    });
    re();
  }

  function toggle(n: number) {
    if (revealed) return;
    setSelected(prev => {
      const s = new Set(prev);
      if (s.has(n)) s.delete(n); else s.add(n);
      return s;
    });
  }

  const g = G.current;
  if (g.done) {
    const total = g.correct + g.wrong;
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">🔢</div>
        <h2 className="text-2xl font-black text-white">Prime Hunter Done!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', Math.max(0, g.score), 'text-cyan-400'], ['Found', g.correct, 'text-green-400'], ['Missed', g.wrong, 'text-red-400']].map(([l, v, c]) => (
            <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>
          ))}
        </div>
      </div>
    );
  }

  const primeSet = new Set(grid.filter(isPrime));
  const maxTime = Math.max(8, 15 - round);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Round {round + 1}/{ROUNDS}</span>
        <span className="text-purple-400 font-bold">Tap all PRIME numbers!</span>
        <span className={`font-mono font-bold ${timeLeft <= 3 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>{timeLeft}s</span>
      </div>
      <div className="w-full h-2 bg-white/5 rounded-full">
        <motion.div className={`h-2 rounded-full ${timeLeft <= 3 ? 'bg-red-500' : 'bg-purple-500'}`}
          animate={{ width: `${(timeLeft / maxTime) * 100}%` }} />
      </div>
      <p className="text-xs text-gray-400 text-center">A prime number is divisible only by 1 and itself. (2, 3, 5, 7, 11, 13...)</p>
      <div className="grid grid-cols-4 gap-2">
        {grid.map(n => {
          const isSel = selected.has(n);
          const correct = primeSet.has(n);
          return (
            <motion.button key={n} onClick={() => toggle(n)} whileTap={{ scale: 0.85 }}
              className={`py-3 rounded-xl font-black text-lg border-2 transition-all ${
                revealed
                  ? correct ? 'bg-green-500/20 border-green-400 text-green-400' : 'bg-red-500/10 border-red-400/20 text-gray-500'
                  : isSel
                  ? 'bg-purple-500/30 border-purple-400 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                  : 'bg-white/5 border-white/15 text-white hover:border-purple-400/50'
              }`}>
              {n}
              {revealed && correct && !isSel && <span className="block text-xs text-green-400">prime!</span>}
            </motion.button>
          );
        })}
      </div>
      <p className="text-xs text-center text-gray-500">Selected: {selected.size} | {primeSet.size} primes hidden</p>
    </div>
  );
}
