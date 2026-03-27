import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const COLORS = [
  { id: 'red',    bg: 'bg-red-500',    glow: '0 0 30px rgba(239,68,68,0.8)',    label: '🔴' },
  { id: 'blue',   bg: 'bg-blue-500',   glow: '0 0 30px rgba(59,130,246,0.8)',   label: '🔵' },
  { id: 'green',  bg: 'bg-green-500',  glow: '0 0 30px rgba(34,197,94,0.8)',    label: '🟢' },
  { id: 'yellow', bg: 'bg-yellow-400', glow: '0 0 30px rgba(250,204,21,0.8)',   label: '🟡' },
];

type Phase = 'start' | 'show' | 'input' | 'win' | 'lose';

export default function ColorSequence({ onFinish }: Props) {
  const [sequence, setSequence] = useState<string[]>([]);
  const [userSeq, setUserSeq] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>('start');
  const [flashId, setFlashId] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);

  const playSequence = useCallback(async (seq: string[]) => {
    setPhase('show');
    setUserSeq([]);
    await new Promise(r => setTimeout(r, 600));
    for (const id of seq) {
      setFlashId(id);
      await new Promise(r => setTimeout(r, Math.max(300, 700 - seq.length * 30)));
      setFlashId(null);
      await new Promise(r => setTimeout(r, 200));
    }
    setPhase('input');
  }, []);

  const startRound = useCallback((prevSeq: string[]) => {
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)].id;
    const newSeq = [...prevSeq, randomColor];
    setSequence(newSeq);
    setRound(newSeq.length);
    playSequence(newSeq);
  }, [playSequence]);

  const handleColorTap = (colorId: string) => {
    if (phase !== 'input') return;
    const newUserSeq = [...userSeq, colorId];
    const pos = newUserSeq.length - 1;
    setFlashId(colorId);
    setTimeout(() => setFlashId(null), 200);

    if (colorId !== sequence[pos]) {
      wrongRef.current += 1;
      setWrong(wrongRef.current);
      setPhase('lose');
      setTimeout(() => {
        onFinish({
          gameId: 'color-sequence', gameName: 'Color Sequence', domain: 'Memory',
          score, accuracy: Math.round((correctRef.current / (correctRef.current + wrongRef.current + 0.001)) * 100),
          avgResponseMs: 0, correct: correctRef.current, wrong: wrongRef.current,
          maxCombo, difficulty: Math.min(3, Math.ceil(sequence.length / 3)) as 1|2|3,
          xpEarned: Math.floor(score / 4)
        });
      }, 1500);
      return;
    }

    setUserSeq(newUserSeq);

    if (newUserSeq.length === sequence.length) {
      correctRef.current += 1;
      setCorrect(correctRef.current);
      const pts = sequence.length * 10;
      setScore(s => s + pts);
      setMaxCombo(m => Math.max(m, sequence.length));
      setPhase('show');
      setTimeout(() => startRound(sequence), 800);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Status */}
      <div className="flex justify-between w-full max-w-sm">
        <div className="text-sm"><span className="text-gray-400">Round </span><span className="text-cyan-400 font-bold">{round}</span></div>
        <div className="text-sm"><span className="text-gray-400">Score </span><span className="text-yellow-400 font-bold">{score}</span></div>
        <div className="text-sm"><span className="text-gray-400">Seq </span><span className="text-purple-400 font-bold">{sequence.length}</span></div>
      </div>

      {/* Phase banner */}
      <div className="text-center h-8">
        {phase === 'start' && <p className="text-gray-400 animate-pulse">Press Start to begin</p>}
        {phase === 'show' && <p className="text-cyan-400 font-bold animate-pulse">👁 Watch the sequence!</p>}
        {phase === 'input' && <p className="text-yellow-400 font-bold">🎯 Repeat it! ({userSeq.length}/{sequence.length})</p>}
        {phase === 'win' && <p className="text-green-400 font-bold">✓ Perfect!</p>}
        {phase === 'lose' && <p className="text-red-400 font-bold animate-pulse">✗ Wrong! Game Over</p>}
      </div>

      {/* Color grid */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
        {COLORS.map(color => {
          const isFlashing = flashId === color.id;
          return (
            <motion.button key={color.id}
              onClick={() => handleColorTap(color.id)}
              disabled={phase !== 'input'}
              animate={{ scale: isFlashing ? 1.1 : 1 }}
              whileTap={phase === 'input' ? { scale: 0.92 } : {}}
              className={`h-28 rounded-2xl font-black text-3xl transition-all ${color.bg} ${phase !== 'input' ? 'opacity-60 cursor-default' : 'cursor-pointer hover:opacity-90'}`}
              style={{ boxShadow: isFlashing ? color.glow : 'none' }}>
              {color.label}
            </motion.button>
          );
        })}
      </div>

      {/* Progress dots */}
      {sequence.length > 0 && (
        <div className="flex gap-1 flex-wrap justify-center max-w-xs">
          {sequence.map((_, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i < userSeq.length ? 'bg-cyan-400' : 'bg-white/10'}`} />
          ))}
        </div>
      )}

      {/* Start button */}
      {phase === 'start' && (
        <button onClick={() => startRound([])}
          className="px-10 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-bold rounded-xl hover:scale-105 transition-all">
          START
        </button>
      )}
    </div>
  );
}
