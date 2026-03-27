import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const TOTAL_ROUNDS = 8;

function genRound(difficulty: number) {
  const count = 4 + Math.min(difficulty, 4);
  const max = 20 + difficulty * 15;
  const set = new Set<number>();
  while (set.size < count) set.add(Math.floor(Math.random() * max) + 1);
  const arr = [...set];
  const ascending = Math.random() > 0.5;
  const target = [...arr].sort((a, b) => ascending ? a - b : b - a);
  return { numbers: arr.sort(() => Math.random() - 0.5), target, ascending, count };
}

export default function SpeedSort({ onFinish }: Props) {
  const [round, setRound] = useState(0);
  const [data, setData] = useState(() => genRound(1));
  const [selected, setSelected] = useState<number[]>([]);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [score, setScore] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [flash, setFlash] = useState<'none' | 'ok' | 'bad'>('none');
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const startRef = useRef(Date.now());
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const scoreRef = useRef(0);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const tap = (num: number) => {
    if (selected.includes(num) || flash !== 'none') return;
    const newSel = [...selected, num];
    setSelected(newSel);
    const idx = newSel.length - 1;

    if (num !== data.target[idx]) {
      setFlash('bad');
      wrongRef.current += 1; setWrong(wrongRef.current);
      setTimeout(() => { setSelected([]); setFlash('none'); }, 500);
      return;
    }

    if (newSel.length === data.target.length) {
      setFlash('ok');
      const pts = Math.max(10, 60 - elapsed);
      scoreRef.current += pts; correctRef.current += 1;
      setScore(scoreRef.current); setCorrect(correctRef.current);
      setTimeout(() => {
        setFlash('none');
        setSelected([]);
        const nextRound = round + 1;
        if (nextRound >= TOTAL_ROUNDS) {
          clearInterval(timerRef.current);
          setDone(true);
          onFinish({
            gameId: 'speed-sort', gameName: 'Speed Sort', domain: 'Logic',
            score: scoreRef.current,
            accuracy: Math.round((correctRef.current / TOTAL_ROUNDS) * 100),
            avgResponseMs: Math.round((Date.now() - startRef.current) / TOTAL_ROUNDS),
            correct: correctRef.current, wrong: wrongRef.current,
            maxCombo: correctRef.current, difficulty: 2,
            xpEarned: Math.floor(scoreRef.current / 5)
          });
          return;
        }
        setRound(nextRound);
        setData(genRound(nextRound + 1));
      }, 600);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">🔢</div>
        <h2 className="text-2xl font-black text-white">Sort Complete!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', scoreRef.current, 'text-cyan-400'], ['Correct', `${correctRef.current}/${TOTAL_ROUNDS}`, 'text-green-400'], ['Time', `${elapsed}s`, 'text-yellow-400']].map(([l, v, c]) => (
            <div key={l as string} className="glass-panel p-3 rounded-xl">
              <p className="text-xs text-gray-400">{l}</p>
              <p className={`text-xl font-black ${c}`}>{v}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-sm mx-auto">
      <div className="flex justify-between w-full text-sm">
        <span className="text-gray-400">Round <span className="text-cyan-400 font-bold">{round + 1}/{TOTAL_ROUNDS}</span></span>
        <span className="text-yellow-400 font-bold">{scoreRef.current} pts</span>
        <span className="text-gray-400 font-mono">{elapsed}s</span>
      </div>

      <div className={`w-full glass-panel p-5 rounded-2xl text-center border-2 transition-all ${flash === 'ok' ? 'border-green-400 bg-green-500/10' : flash === 'bad' ? 'border-red-400 bg-red-500/10' : 'border-white/10'}`}>
        <p className="text-xs text-gray-400 mb-1 uppercase tracking-widest">
          Tap {data.ascending ? 'SMALLEST → BIGGEST ↑' : 'BIGGEST → SMALLEST ↓'}
        </p>
        <p className="text-xs text-gray-500 mt-1">({selected.length}/{data.count} selected)</p>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {data.numbers.map(num => {
          const isSel = selected.includes(num);
          const selIdx = selected.indexOf(num);
          return (
            <motion.button key={num} onClick={() => tap(num)}
              whileTap={{ scale: 0.85 }} disabled={isSel}
              className="w-16 h-16 rounded-xl font-black text-xl border-2 transition-all relative"
              style={{
                background: isSel ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.05)',
                borderColor: isSel ? '#00e5ff' : 'rgba(255,255,255,0.1)',
                color: isSel ? '#00e5ff' : '#fff',
                opacity: isSel ? 0.4 : 1,
              }}>
              {num}
              {isSel && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-cyan-500 text-black text-xs font-black flex items-center justify-center">
                  {selIdx + 1}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="w-full h-1 bg-white/5 rounded-full">
        <motion.div className="h-1 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
          animate={{ width: `${(selected.length / data.count) * 100}%` }} />
      </div>
    </div>
  );
}
