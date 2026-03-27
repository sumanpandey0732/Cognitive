import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const GRID_SIZE = 25;

function makeGrid() {
  return Array.from({ length: GRID_SIZE }, (_, i) => ({
    num: i + 1,
    x: Math.random() * 80 + 5,
    y: Math.random() * 80 + 5,
  }));
}

export default function NumberTap({ onFinish }: Props) {
  const [grid, setGrid] = useState(makeGrid);
  const [next, setNext] = useState(1);
  const [errors, setErrors] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [flash, setFlash] = useState<{ num: number; ok: boolean } | null>(null);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const tap = (num: number) => {
    if (done) return;
    if (num === next) {
      setFlash({ num, ok: true });
      setTimeout(() => setFlash(null), 300);
      const newNext = next + 1;
      setNext(newNext);
      setGrid(prev => prev.filter(p => p.num !== num));
      if (newNext > GRID_SIZE) {
        clearInterval(timerRef.current);
        setDone(true);
        onFinish({
          gameId: 'number-tap', gameName: 'Number Tap', domain: 'Focus',
          score: Math.max(0, 5000 - elapsed * 20 - errors * 100),
          accuracy: Math.round((GRID_SIZE / (GRID_SIZE + errors)) * 100),
          avgResponseMs: Math.round((Date.now() - startTime) / GRID_SIZE),
          correct: GRID_SIZE, wrong: errors, maxCombo: GRID_SIZE - errors,
          difficulty: 2, xpEarned: Math.max(10, 50 - errors * 3)
        });
      }
    } else {
      setFlash({ num, ok: false });
      setTimeout(() => setFlash(null), 300);
      setErrors(e => e + 1);
    }
  };

  const progress = ((next - 1) / GRID_SIZE) * 100;

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-8">
        <div className="text-5xl">🎯</div>
        <h2 className="text-2xl font-black text-white">Complete!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Time', `${elapsed}s`, 'text-cyan-400'], ['Errors', errors, 'text-red-400'], ['Score', Math.max(0, 5000 - elapsed * 20 - errors * 100), 'text-yellow-400']].map(([l, v, c]) => (
            <div key={l as string} className="glass-panel p-4 rounded-xl">
              <p className="text-xs text-gray-400">{l}</p>
              <p className={`text-2xl font-black ${c}`}>{v}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-400">
          Tap: <span className="text-cyan-400 font-black text-xl">{next}</span>
        </div>
        <div className="text-sm font-mono text-yellow-400">{elapsed}s</div>
        <div className="text-sm text-red-400">Errors: {errors}</div>
      </div>
      <div className="w-full bg-white/5 h-2 rounded-full">
        <motion.div className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
          animate={{ width: `${progress}%` }} />
      </div>
      <div
        className="relative w-full rounded-2xl overflow-hidden border border-white/10"
        style={{ height: 400, background: 'rgba(0,0,0,0.4)' }}>
        {grid.map(({ num, x, y }) => {
          const isFlashing = flash?.num === num;
          const isNext = num === next;
          return (
            <motion.button
              key={num}
              className="absolute w-12 h-12 rounded-full font-black text-base flex items-center justify-center cursor-pointer select-none border-2"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%,-50%)',
                background: isFlashing
                  ? (flash!.ok ? 'rgba(0,255,100,0.3)' : 'rgba(255,0,0,0.3)')
                  : isNext ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.05)',
                borderColor: isNext ? '#00e5ff' : 'rgba(255,255,255,0.1)',
                boxShadow: isNext ? '0 0 15px rgba(0,229,255,0.5)' : 'none',
                color: isFlashing ? (flash!.ok ? '#00ff64' : '#ff4444') : '#fff',
              }}
              onClick={() => tap(num)}
              whileTap={{ scale: 0.85 }}
              animate={isFlashing ? { scale: flash!.ok ? [1.3, 1] : [0.8, 1] } : {}}>
              {num}
            </motion.button>
          );
        })}
      </div>
      <p className="text-center text-xs text-gray-500">Tap numbers 1→25 in order as fast as possible</p>
    </div>
  );
}
