import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const COLORS = [
  { name: 'RED', hex: '#ef4444', label: '🔴' },
  { name: 'BLUE', hex: '#3b82f6', label: '🔵' },
  { name: 'GREEN', hex: '#22c55e', label: '🟢' },
  { name: 'YELLOW', hex: '#eab308', label: '🟡' },
  { name: 'PURPLE', hex: '#a855f7', label: '🟣' },
];

function rndColor() { return COLORS[Math.floor(Math.random() * COLORS.length)]; }

type Phase = 'showing' | 'input' | 'result';

export default function ColorSequence({ onFinish }: Props) {
  const G = useRef({ score: 0, correct: 0, wrong: 0, maxCombo: 0, combo: 0, round: 0, done: false });
  const [sequence, setSequence] = useState<string[]>([]);
  const [input, setInput] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [phase, setPhase] = useState<Phase>('showing');
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  function startRound(roundNum: number) {
    G.current.round = roundNum;
    const len = 2 + Math.floor(roundNum / 2);
    const seq = Array.from({ length: Math.min(len, 10) }, () => rndColor().name);
    setSequence(seq);
    setInput([]);
    setPhase('showing');
    setFlash(null);

    // Show sequence one by one
    const delay = Math.max(400, 800 - roundNum * 40);
    seq.forEach((_, i) => {
      setTimeout(() => setActiveIdx(i), i * delay + 200);
      setTimeout(() => setActiveIdx(-1), i * delay + delay - 100);
    });
    setTimeout(() => {
      setActiveIdx(-1);
      setPhase('input');
    }, seq.length * delay + 400);
  }

  useEffect(() => { startRound(1); }, []);

  function finish() {
    G.current.done = true;
    const total = G.current.correct + G.current.wrong;
    onFinish({
      gameId: 'color-sequence', gameName: 'Color Sequence', domain: 'Memory',
      score: G.current.score,
      accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0,
      avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong,
      maxCombo: G.current.maxCombo, difficulty: 2,
      xpEarned: Math.floor(G.current.score / 5)
    });
    re();
  }

  function handleInput(colorName: string) {
    if (phase !== 'input' || G.current.done) return;
    const idx = input.length;
    const newInput = [...input, colorName];
    setInput(newInput);

    if (colorName !== sequence[idx]) {
      G.current.combo = 0;
      G.current.wrong += 1;
      setFlash('bad');
      re();
      if (G.current.round >= 3 || G.current.wrong >= 3) {
        setTimeout(finish, 600);
      } else {
        setTimeout(() => startRound(G.current.round + 1), 800);
      }
      return;
    }

    if (newInput.length === sequence.length) {
      G.current.combo += 1;
      G.current.maxCombo = Math.max(G.current.maxCombo, G.current.combo);
      G.current.score += 20 * sequence.length * Math.min(G.current.combo, 3);
      G.current.correct += sequence.length;
      setFlash('ok');
      re();
      if (G.current.round >= 8) { setTimeout(finish, 600); }
      else { setTimeout(() => startRound(G.current.round + 1), 900); }
    }
  }

  const g = G.current;
  if (g.done) {
    const total = g.correct + g.wrong;
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">🎨</div>
        <h2 className="text-2xl font-black text-white">Memory Complete!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', g.score, 'text-cyan-400'], ['Correct', g.correct, 'text-green-400'], ['Max Round', g.round, 'text-purple-400']].map(([l, v, c]) => (
            <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="flex justify-between w-full text-sm">
        <span className="text-purple-400 font-bold">Round {g.round} • Length: {sequence.length}</span>
        <span className="text-yellow-400 font-bold">{g.score}pts</span>
      </div>

      {/* Sequence display */}
      <div className={`w-full glass-panel p-6 rounded-2xl text-center border-2 min-h-24 flex flex-col items-center justify-center transition-all ${
        flash === 'ok' ? 'border-green-400 bg-green-500/10' : flash === 'bad' ? 'border-red-400 bg-red-500/10' : 'border-white/10'
      }`}>
        {phase === 'showing' ? (
          <div className="flex gap-3 flex-wrap justify-center">
            {sequence.map((name, i) => {
              const c = COLORS.find(c => c.name === name)!;
              return (
                <motion.div key={i}
                  animate={{ scale: activeIdx === i ? 1.5 : 0.8, opacity: activeIdx === i ? 1 : 0.3 }}
                  className="w-14 h-14 rounded-full border-4 flex items-center justify-center font-black"
                  style={{ background: `${c.hex}33`, borderColor: activeIdx === i ? c.hex : `${c.hex}44`, boxShadow: activeIdx === i ? `0 0 30px ${c.hex}` : 'none' }}>
                  {activeIdx === i ? c.label : '•'}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-cyan-400 font-bold">Repeat the sequence! ({input.length}/{sequence.length})</p>
            <div className="flex gap-2 flex-wrap justify-center">
              {sequence.map((name, i) => {
                const c = COLORS.find(c => c.name === name)!;
                const chosen = input[i];
                return (
                  <div key={i} className="w-10 h-10 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: chosen ? (chosen === name ? c.hex : '#ef4444') : '#ffffff22', background: chosen ? `${c.hex}33` : 'transparent' }}>
                    {chosen ? (chosen === name ? '✓' : '✗') : '?'}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Color buttons */}
      <div className="grid grid-cols-5 gap-2 w-full">
        {COLORS.map(c => (
          <motion.button key={c.name}
            onClick={() => handleInput(c.name)}
            whileTap={{ scale: 0.8 }}
            disabled={phase !== 'input'}
            className="py-5 rounded-xl font-black text-sm border-2 transition-all disabled:opacity-30"
            style={{ background: `${c.hex}22`, borderColor: `${c.hex}55`, color: c.hex }}>
            {c.label}<br />{c.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
