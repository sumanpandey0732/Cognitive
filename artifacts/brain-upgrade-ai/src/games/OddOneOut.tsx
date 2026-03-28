import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSession } from '@/context/AppContext';
interface Props { onFinish: (s: Partial<GameSession>) => void; }
const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
function isPrime(n: number) { if (n < 2) return false; for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false; return true; }
function makePuzzle(level: number) {
  const types = ['even-odd', 'multiple', 'prime', 'range', 'divisor'];
  const type = types[rnd(0, Math.min(level, types.length - 1))];
  let nums: number[] = [], odd = -1, hint = '';
  if (type === 'even-odd') {
    const base = rnd(0, 1); // 0=even, 1=odd
    nums = Array.from({length: 5}, () => rnd(2, 30) * 2 + base);
    odd = rnd(0, 4); nums[odd] = rnd(2, 30) * 2 + (1 - base);
    hint = `Find the ${base === 0 ? 'ODD' : 'EVEN'} one out`;
  } else if (type === 'multiple') {
    const m = rnd(2, 7 + level);
    nums = Array.from({length: 5}, () => m * rnd(1, 15));
    odd = rnd(0, 4);
    let notM = rnd(2, 50);
    while (notM % m === 0) notM = rnd(2, 50);
    nums[odd] = notM;
    hint = `Find the non-multiple of ${m}`;
  } else if (type === 'prime') {
    const primes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71];
    nums = primes.slice(rnd(0, primes.length - 5), rnd(0, primes.length - 5) + 4);
    while (nums.length < 4) nums.push(primes[rnd(0, 9)]);
    nums = nums.slice(0, 4);
    const composite = [4,6,8,9,10,12,14,15,16,18,20,21,22][rnd(0, 12)];
    const pos = rnd(0, 4); nums.splice(pos, 0, composite); odd = pos;
    hint = 'Find the non-prime number';
  } else if (type === 'range') {
    const base = rnd(10, 50); const range = rnd(3, 8 + level);
    nums = Array.from({length: 5}, () => base + rnd(0, range));
    odd = rnd(0, 4); nums[odd] = base + range * 3 + rnd(5, 20);
    hint = 'Find the number that doesn\'t belong in range';
  } else {
    const d = rnd(2, 9);
    nums = Array.from({length: 5}, () => { let n = d * rnd(1, 12); return n; });
    odd = rnd(0, 4); let notD = rnd(2, 100); while (notD % d === 0) notD++; nums[odd] = notD;
    hint = `Find the number NOT divisible by ${d}`;
  }
  return { nums, odd, hint };
}
export default function OddOneOut({ onFinish }: Props) {
  const TOTAL = 12;
  const G = useRef({ score: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, lives: 5, level: 0, done: false });
  const [qNum, setQNum] = useState(0);
  const [puzzle, setPuzzle] = useState(() => makePuzzle(0));
  const [flash, setFlash] = useState<{idx: number; ok: boolean} | null>(null);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  function finish() { G.current.done = true; const total = G.current.correct + G.current.wrong; onFinish({ gameId: 'odd-one-out', gameName: 'Odd One Out', domain: 'Logic', score: G.current.score, accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0, avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong, maxCombo: G.current.maxCombo, difficulty: 2, xpEarned: Math.floor(G.current.score / 5) }); re(); }
  function answer(idx: number) {
    if (flash) return;
    const ok = idx === puzzle.odd;
    setFlash({ idx, ok });
    if (ok) { G.current.combo += 1; G.current.maxCombo = Math.max(G.current.maxCombo, G.current.combo); G.current.score += 15 * Math.min(G.current.combo, 5); G.current.correct += 1; if (G.current.correct % 4 === 0) G.current.level += 1; }
    else { G.current.combo = 0; G.current.wrong += 1; G.current.lives -= 1; }
    re();
    const next = qNum + 1;
    if (next >= TOTAL || G.current.lives <= 0) { setTimeout(finish, 600); }
    else { setTimeout(() => { setPuzzle(makePuzzle(G.current.level)); setQNum(next); setFlash(null); }, 700); }
  }
  const g = G.current;
  if (g.done) { const total = g.correct + g.wrong; return <div className="flex flex-col items-center gap-4 text-center py-6"><div className="text-5xl">🔍</div><h2 className="text-2xl font-black text-white">Odd One Out!</h2><div className="grid grid-cols-3 gap-3">{[['Score', g.score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round(g.correct / total * 100) : 0}%`, 'text-green-400'], ['Combo', `×${g.maxCombo}`, 'text-yellow-400']].map(([l, v, c]) => <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>)}</div></div>; }
  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-sm mx-auto">
      <div className="flex justify-between w-full text-sm">
        <div className="flex gap-1">{[0,1,2,3,4].map(i => <span key={i} className={i < g.lives ? 'text-red-400' : 'text-gray-700'}>♥</span>)}</div>
        <span className="text-yellow-400 font-bold">{qNum + 1}/{TOTAL} • {g.score}pts</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={qNum} initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}
          className="w-full glass-panel p-5 rounded-2xl border border-white/10 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Odd One Out</p>
          <p className="text-cyan-400 font-bold text-sm">{puzzle.hint}</p>
        </motion.div>
      </AnimatePresence>
      <div className="grid grid-cols-5 gap-2 w-full">
        {puzzle.nums.map((n, i) => (
          <motion.button key={`${qNum}-${i}`} onClick={() => answer(i)} whileTap={{ scale: 0.85 }}
            disabled={!!flash}
            className={`py-5 rounded-xl font-black text-xl border-2 transition-all ${
              flash && i === puzzle.odd ? 'bg-green-500/30 border-green-400 text-green-300' :
              flash && i === flash.idx && !flash.ok ? 'bg-red-500/30 border-red-400 text-red-300' :
              'bg-white/8 border-white/15 text-white hover:bg-purple-500/20 hover:border-purple-400 disabled:opacity-60'
            }`}>{n}</motion.button>
        ))}
      </div>
      {g.combo > 1 && !flash && <p className="text-orange-400 text-sm font-bold">🔥 ×{g.combo} Combo!</p>}
    </div>
  );
}
