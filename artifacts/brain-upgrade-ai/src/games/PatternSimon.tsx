import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const PADS = [
  { id: 0, color: '#ef4444', glow: 'rgba(239,68,68,0.8)',   bg: 'rgba(239,68,68,0.2)'  },
  { id: 1, color: '#3b82f6', glow: 'rgba(59,130,246,0.8)',  bg: 'rgba(59,130,246,0.2)' },
  { id: 2, color: '#22c55e', glow: 'rgba(34,197,94,0.8)',   bg: 'rgba(34,197,94,0.2)'  },
  { id: 3, color: '#eab308', glow: 'rgba(234,179,8,0.8)',   bg: 'rgba(234,179,8,0.2)'  },
];

type Phase = 'idle' | 'showing' | 'input' | 'lost';

export default function PatternSimon({ onFinish }: Props) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSeq, setUserSeq] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [activePad, setActivePad] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [lost, setLost] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);

  const flashPad = async (padId: number, duration: number) => {
    setActivePad(padId);
    await new Promise(r => setTimeout(r, duration));
    setActivePad(null);
    await new Promise(r => setTimeout(r, 120));
  };

  const showSequence = useCallback(async (seq: number[]) => {
    setPhase('showing');
    setUserSeq([]);
    await new Promise(r => setTimeout(r, 500));
    const speed = Math.max(250, 700 - seq.length * 40);
    for (const padId of seq) {
      await flashPad(padId, speed);
    }
    setPhase('input');
  }, []);

  const addRound = useCallback((prevSeq: number[]) => {
    const newPad = Math.floor(Math.random() * 4);
    const newSeq = [...prevSeq, newPad];
    setSequence(newSeq);
    setRound(newSeq.length);
    showSequence(newSeq);
  }, [showSequence]);

  const tapPad = (padId: number) => {
    if (phase !== 'input') return;
    setActivePad(padId);
    setTimeout(() => setActivePad(null), 200);

    const pos = userSeq.length;
    const newUserSeq = [...userSeq, padId];

    if (padId !== sequence[pos]) {
      setWrong(w => w + 1);
      setPhase('lost');
      setLost(true);
      setTimeout(() => {
        onFinish({
          gameId: 'pattern-simon', gameName: 'Pattern Simon', domain: 'Memory',
          score, accuracy: Math.round((correct / (correct + 1)) * 100),
          avgResponseMs: 0, correct, wrong: wrong + 1,
          maxCombo: correct, difficulty: Math.min(3, Math.ceil(sequence.length / 4)) as 1|2|3,
          xpEarned: Math.floor(score / 4)
        });
      }, 1500);
      return;
    }

    setUserSeq(newUserSeq);
    if (newUserSeq.length === sequence.length) {
      const pts = sequence.length * 15;
      setScore(s => s + pts);
      setCorrect(c => c + 1);
      setPhase('showing');
      setTimeout(() => addRound(sequence), 800);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex justify-between w-full max-w-xs text-sm">
        <span className="text-gray-400">Round <span className="text-cyan-400 font-bold">{round}</span></span>
        <span className="text-gray-400">Score <span className="text-yellow-400 font-bold">{score}</span></span>
      </div>

      <div className="text-center h-8">
        {phase === 'idle' && <p className="text-gray-400 animate-pulse">Press Start</p>}
        {phase === 'showing' && <p className="text-cyan-400 font-bold animate-pulse">👁 Watch carefully...</p>}
        {phase === 'input' && <p className="text-yellow-400 font-bold">🎮 Repeat! ({userSeq.length}/{sequence.length})</p>}
        {phase === 'lost' && <p className="text-red-400 font-bold animate-pulse">✗ Wrong! Game over</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {PADS.map(pad => (
          <motion.button key={pad.id} onClick={() => tapPad(pad.id)}
            disabled={phase !== 'input'}
            animate={{ scale: activePad === pad.id ? 1.08 : 1 }}
            whileTap={phase === 'input' ? { scale: 0.92 } : {}}
            className="h-28 rounded-2xl border-2 transition-colors cursor-pointer disabled:cursor-default"
            style={{
              background: activePad === pad.id ? `${pad.color}60` : pad.bg,
              borderColor: activePad === pad.id ? pad.color : `${pad.color}40`,
              boxShadow: activePad === pad.id ? `0 0 30px ${pad.glow}` : 'none',
            }} />
        ))}
      </div>

      <div className="flex gap-1 flex-wrap justify-center max-w-xs">
        {sequence.map((_, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < userSeq.length ? 'bg-cyan-400' : 'bg-white/10'}`} />
        ))}
      </div>

      {phase === 'idle' && (
        <button onClick={() => addRound([])}
          className="px-10 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-bold rounded-xl hover:scale-105 transition-all">
          START
        </button>
      )}
    </div>
  );
}
