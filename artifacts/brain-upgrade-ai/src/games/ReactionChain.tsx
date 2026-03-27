import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const COLORS = [
  { name: 'RED', hex: '#ef4444', bg: 'rgba(239,68,68,0.25)' },
  { name: 'BLUE', hex: '#3b82f6', bg: 'rgba(59,130,246,0.25)' },
  { name: 'GREEN', hex: '#22c55e', bg: 'rgba(34,197,94,0.25)' },
  { name: 'YELLOW', hex: '#eab308', bg: 'rgba(234,179,8,0.25)' },
  { name: 'PURPLE', hex: '#a855f7', bg: 'rgba(168,85,247,0.25)' },
];

export default function ReactionChain({ onFinish }: Props) {
  const ROUNDS = 20;
  const G = useRef({ score: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, done: false, startMs: Date.now() });
  const [targetColor, setTargetColor] = useState('GREEN');
  const [current, setCurrent] = useState(() => COLORS[Math.floor(Math.random() * COLORS.length)]);
  const [answered, setAnswered] = useState(false);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [round, setRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(4);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  function nextRound(r: number) {
    const next = COLORS[Math.floor(Math.random() * COLORS.length)];
    setCurrent(next);
    setAnswered(false);
    setFlash(null);
    setTimeLeft(4);
    setRound(r);

    // Change target every 7 rounds
    if (r % 7 === 0 && r > 0) {
      const newTarget = COLORS.filter(c => c.name !== targetColor)[Math.floor(Math.random() * (COLORS.length - 1))].name;
      setTargetColor(newTarget);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleInput(false, 'timeout', next, targetColor); return 0; }
        return t - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    nextRound(0);
    return () => clearInterval(timerRef.current);
  }, []);

  function finish() {
    clearInterval(timerRef.current);
    G.current.done = true;
    const total = G.current.correct + G.current.wrong;
    onFinish({
      gameId: 'reaction-chain', gameName: 'Reaction Chain', domain: 'Speed',
      score: G.current.score,
      accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0,
      avgResponseMs: Math.round((Date.now() - G.current.startMs) / Math.max(1, total)),
      correct: G.current.correct, wrong: G.current.wrong,
      maxCombo: G.current.maxCombo, difficulty: 2,
      xpEarned: Math.floor(G.current.score / 5)
    });
    re();
  }

  function handleInput(tapped: boolean, source: 'tap' | 'hold' | 'timeout', colorOverride?: typeof current, targetOverride?: string) {
    if (answered && source !== 'timeout') return;
    clearInterval(timerRef.current);
    setAnswered(true);

    const c = colorOverride || current;
    const t = targetOverride || targetColor;
    const isTarget = c.name === t;
    const shouldTap = isTarget;
    const correct = tapped ? shouldTap : !shouldTap;

    if (correct) {
      G.current.combo += 1;
      G.current.maxCombo = Math.max(G.current.maxCombo, G.current.combo);
      G.current.score += 10 * Math.min(G.current.combo, 5);
      G.current.correct += 1;
      setFlash('ok');
    } else {
      G.current.combo = 0;
      G.current.wrong += 1;
      setFlash('bad');
    }
    re();

    const next = round + 1;
    if (next >= ROUNDS) { setTimeout(finish, 500); }
    else { setTimeout(() => nextRound(next), 500); }
  }

  const g = G.current;
  if (g.done) {
    const total = g.correct + g.wrong;
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">⚡</div>
        <h2 className="text-2xl font-black text-white">Chain Complete!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', g.score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round(g.correct / total * 100) : 0}%`, 'text-green-400'], ['Combo', `×${g.maxCombo}`, 'text-yellow-400']].map(([l, v, c]) => (
            <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>
          ))}
        </div>
      </div>
    );
  }

  const tc = COLORS.find(c => c.name === targetColor)!;

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="flex justify-between w-full text-sm items-center">
        <span className="text-gray-400">{round + 1}/{ROUNDS}</span>
        <div className="glass-panel px-4 py-2 rounded-xl border" style={{ borderColor: tc.hex }}>
          <span className="text-xs text-gray-400 mr-2">TAP ONLY:</span>
          <span className="font-black text-sm" style={{ color: tc.hex }}>{tc.name}</span>
        </div>
        <span className="text-yellow-400 font-bold">{g.score}pts{g.combo > 1 ? ` ×${g.combo}` : ''}</span>
      </div>

      <div className="w-full h-2 bg-white/5 rounded-full">
        <motion.div className="h-2 rounded-full" style={{ background: tc.hex }}
          animate={{ width: `${(timeLeft / 4) * 100}%` }} transition={{ duration: 0.3 }} />
      </div>

      <motion.div key={round}
        initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className={`w-full aspect-video rounded-3xl flex flex-col items-center justify-center border-4 cursor-pointer transition-all ${
          flash === 'ok' ? 'border-green-400' : flash === 'bad' ? 'border-red-400' : ''
        }`}
        style={{
          background: flash === 'ok' ? 'rgba(34,197,94,0.2)' : flash === 'bad' ? 'rgba(239,68,68,0.2)' : current.bg,
          borderColor: flash ? undefined : current.hex,
          boxShadow: flash === 'ok' ? '0 0 40px rgba(34,197,94,0.5)' : flash === 'bad' ? '0 0 40px rgba(239,68,68,0.5)' : `0 0 30px ${current.hex}55`,
        }}
        onClick={() => handleInput(true, 'tap')}>
        <span className="text-7xl font-black" style={{ color: current.hex, textShadow: `0 0 40px ${current.hex}` }}>
          {current.name}
        </span>
        <span className="text-white/50 text-sm mt-2">
          {flash === 'ok' ? '✓ Correct!' : flash === 'bad' ? '✗ Wrong!' : current.name === targetColor ? '👆 TAP NOW!' : '🚫 DON\'T TAP'}
        </span>
      </motion.div>

      <p className="text-center text-gray-500 text-sm">
        Tap the color block when it shows <span style={{ color: tc.hex }} className="font-bold">{targetColor}</span>. Hold your finger for others.
      </p>
    </div>
  );
}
