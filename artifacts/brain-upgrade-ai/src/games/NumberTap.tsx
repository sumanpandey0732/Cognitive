import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const GRID = 25;

function shuffle<T>(arr: T[]) { return [...arr].sort(() => Math.random() - 0.5); }

export default function NumberTap({ onFinish }: Props) {
  const ROUNDS = 3;
  const G = useRef({ score: 0, correct: 0, wrong: 0, maxCombo: 0, combo: 0, round: 1, done: false, startMs: Date.now() });
  const [numbers, setNumbers] = useState<number[]>(() => shuffle(Array.from({ length: GRID }, (_, i) => i + 1)));
  const [next, setNext] = useState(1);
  const [tapped, setTapped] = useState<number[]>([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [flash, setFlash] = useState<{ n: number; ok: boolean } | null>(null);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    setStartTime(Date.now());
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 500);
    return () => clearInterval(timerRef.current);
  }, [G.current.round]);

  function finish() {
    clearInterval(timerRef.current);
    G.current.done = true;
    const total = G.current.correct + G.current.wrong;
    onFinish({
      gameId: 'number-tap', gameName: 'Number Tap', domain: 'Focus',
      score: G.current.score,
      accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0,
      avgResponseMs: Math.round((Date.now() - G.current.startMs) / Math.max(1, GRID * G.current.round)),
      correct: G.current.correct, wrong: G.current.wrong,
      maxCombo: G.current.maxCombo, difficulty: 2,
      xpEarned: Math.floor(G.current.score / 5)
    });
    re();
  }

  function tapNumber(n: number) {
    if (G.current.done || tapped.includes(n)) return;
    const ok = n === next;
    setFlash({ n, ok });
    setTimeout(() => setFlash(null), 300);

    if (ok) {
      G.current.combo += 1;
      G.current.maxCombo = Math.max(G.current.maxCombo, G.current.combo);
      G.current.score += 5 * Math.min(G.current.combo, 4);
      G.current.correct += 1;
      setTapped(prev => [...prev, n]);
      if (n === GRID) {
        // Round complete
        if (G.current.round >= ROUNDS) { setTimeout(finish, 500); }
        else {
          setTimeout(() => {
            G.current.round += 1;
            setTapped([]);
            setNumbers(shuffle(Array.from({ length: GRID }, (_, i) => i + 1)));
            setNext(1);
            re();
          }, 600);
        }
      } else {
        setNext(n + 1);
      }
    } else {
      G.current.combo = 0;
      G.current.wrong += 1;
      G.current.score = Math.max(0, G.current.score - 3);
    }
    re();
  }

  const g = G.current;
  if (g.done) {
    const total = g.correct + g.wrong;
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">🔢</div>
        <h2 className="text-2xl font-black text-white">Sequence Complete!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', g.score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round(g.correct / total * 100) : 0}%`, 'text-green-400'], ['Rounds', `${ROUNDS}/${ROUNDS}`, 'text-yellow-400']].map(([l, v, c]) => (
            <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center text-sm">
        <span className="text-cyan-400 font-bold">Round {g.round}/{ROUNDS}</span>
        <div className="glass-panel px-4 py-2 rounded-lg text-center">
          <span className="text-white font-black">Next: </span>
          <span className="text-yellow-400 font-black text-xl">{next}</span>
        </div>
        <span className="text-gray-400 font-mono">{elapsed}s • {g.score}pts</span>
      </div>
      <p className="text-center text-xs text-gray-500">Tap numbers 1 → 25 in order as fast as possible</p>
      <div className="grid grid-cols-5 gap-2">
        {numbers.map((n) => {
          const done = tapped.includes(n);
          const isFlash = flash?.n === n;
          return (
            <motion.button key={n}
              onClick={() => tapNumber(n)}
              whileTap={{ scale: 0.8 }}
              disabled={done}
              className={`aspect-square rounded-xl font-black text-lg transition-all border-2 ${
                done
                  ? 'bg-green-500/20 border-green-400/30 text-green-400/50 cursor-default'
                  : isFlash
                  ? (flash!.ok ? 'bg-green-400/40 border-green-400 text-white' : 'bg-red-400/40 border-red-400 text-white')
                  : n === next
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/25'
              }`}>
              {done ? '✓' : n}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
