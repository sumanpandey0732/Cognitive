import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const COLORS = [
  { name: 'RED',    hex: '#ef4444' },
  { name: 'BLUE',   hex: '#3b82f6' },
  { name: 'GREEN',  hex: '#22c55e' },
  { name: 'YELLOW', hex: '#eab308' },
  { name: 'PURPLE', hex: '#a855f7' },
  { name: 'CYAN',   hex: '#06b6d4' },
];

function genRound(qNum: number) {
  const word = COLORS[Math.floor(Math.random() * COLORS.length)];
  let ink = COLORS[Math.floor(Math.random() * COLORS.length)];
  while (ink.name === word.name) ink = COLORS[Math.floor(Math.random() * COLORS.length)];
  // Alternate question type: sometimes ask for word, sometimes for ink color
  const askInk = Math.random() > 0.35;
  return { word, ink, askInk };
}

export default function StroopChallenge({ onFinish }: Props) {
  const TOTAL = 20;
  const G = useRef({ score: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, lives: 5, done: false, startMs: Date.now() });
  const [qNum, setQNum] = useState(0);
  const [round, setRound] = useState(() => genRound(0));
  const [timeLeft, setTimeLeft] = useState(7);
  const [flash, setFlash] = useState<'none' | 'ok' | 'bad'>('none');
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const maxTime = Math.max(3, 7 - Math.floor(qNum / 5));

  function nextRound(n: number) {
    if (G.current.done) return;
    setRound(genRound(n));
    setTimeLeft(Math.max(3, 7 - Math.floor(n / 5)));
    setQNum(n);
    setFlash('none');
  }

  useEffect(() => {
    if (G.current.done) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleAnswer(null);
          return 0;
        }
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
      gameId: 'stroop', gameName: 'Stroop Challenge', domain: 'Focus',
      score: G.current.score,
      accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0,
      avgResponseMs: Math.round((Date.now() - G.current.startMs) / Math.max(1, total)),
      correct: G.current.correct, wrong: G.current.wrong,
      maxCombo: G.current.maxCombo, difficulty: 2,
      xpEarned: Math.floor(G.current.score / 5)
    });
    re();
  }

  function handleAnswer(chosen: string | null) {
    clearInterval(timerRef.current);
    const correct = round.askInk ? round.ink.name : round.word.name;
    const ok = chosen === correct;

    if (ok) {
      G.current.combo += 1;
      G.current.maxCombo = Math.max(G.current.maxCombo, G.current.combo);
      G.current.score += 10 * Math.min(G.current.combo, 5);
      G.current.correct += 1;
      setFlash('ok');
    } else {
      G.current.combo = 0;
      G.current.wrong += 1;
      G.current.lives -= 1;
      setFlash('bad');
    }
    re();

    const next = qNum + 1;
    if (next >= TOTAL || G.current.lives <= 0) {
      setTimeout(finish, 400);
    } else {
      setTimeout(() => nextRound(next), 500);
    }
  }

  const g = G.current;
  if (g.done) {
    const total = g.correct + g.wrong;
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">🎨</div>
        <h2 className="text-2xl font-black text-white">Stroop Complete!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', g.score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round(g.correct / total * 100) : 0}%`, 'text-green-400'], ['Max Combo', `×${g.maxCombo}`, 'text-yellow-400']].map(([l, v, c]) => (
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
      <div className="flex justify-between w-full items-center">
        <div className="flex gap-1">{[0,1,2,3,4].map(i => <span key={i} className={i < g.lives ? 'text-red-400 text-lg' : 'text-gray-700 text-lg'}>♥</span>)}</div>
        <span className="text-yellow-400 font-bold text-sm">{qNum}/{TOTAL} • {g.score}pts</span>
        <span className={`font-mono font-bold ${timeLeft <= 2 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>{timeLeft}s</span>
      </div>

      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div className={`h-1.5 rounded-full ${timeLeft <= 2 ? 'bg-red-500' : 'bg-cyan-500'}`}
          animate={{ width: `${(timeLeft / maxTime) * 100}%` }} transition={{ duration: 0.2 }} />
      </div>

      <div className={`w-full glass-panel p-7 rounded-2xl text-center border-2 transition-all ${
        flash === 'ok' ? 'border-green-400 bg-green-500/10' : flash === 'bad' ? 'border-red-400 bg-red-500/10' : 'border-white/10'}`}>
        <p className="text-xs text-gray-400 mb-4 uppercase tracking-widest font-bold">
          {round.askInk ? '🎨 What COLOR is this text written in?' : '📖 What does this text SAY?'}
        </p>
        <p className="text-5xl font-black tracking-widest"
          style={{ color: round.ink.hex, textShadow: `0 0 25px ${round.ink.hex}88` }}>
          {round.word.name}
        </p>
        {g.combo > 1 && <p className="text-yellow-400 text-xs font-bold mt-3">🔥 ×{g.combo} Combo!</p>}
      </div>

      <div className="grid grid-cols-3 gap-2 w-full">
        {COLORS.map(c => (
          <motion.button key={c.name}
            onClick={() => handleAnswer(c.name)}
            whileTap={{ scale: 0.88 }}
            className="py-3 rounded-xl font-bold text-sm border transition-all"
            style={{ background: `${c.hex}18`, borderColor: `${c.hex}44`, color: c.hex }}>
            {c.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
