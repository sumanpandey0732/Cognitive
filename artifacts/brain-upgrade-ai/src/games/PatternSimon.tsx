import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const PADS = [
  { id: 0, color: '#22c55e', label: '🟢' },
  { id: 1, color: '#ef4444', label: '🔴' },
  { id: 2, color: '#eab308', label: '🟡' },
  { id: 3, color: '#3b82f6', label: '🔵' },
];

type Phase = 'showing' | 'input' | 'win' | 'lose';

export default function PatternSimon({ onFinish }: Props) {
  const G = useRef({ score: 0, correct: 0, wrong: 0, maxRound: 0, done: false });
  const [sequence, setSequence] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('showing');
  const [round, setRound] = useState(0);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  const blockRef = useRef(false);

  function flashPad(id: number, duration: number): Promise<void> {
    return new Promise(res => {
      setActiveId(id);
      setTimeout(() => { setActiveId(null); setTimeout(res, 80); }, duration);
    });
  }

  async function showSequence(seq: number[], roundNum: number) {
    blockRef.current = true;
    const speed = Math.max(300, 700 - roundNum * 40);
    for (const id of seq) {
      await flashPad(id, speed);
      await new Promise(r => setTimeout(r, 100));
    }
    blockRef.current = false;
    setPhase('input');
    setUserInput([]);
  }

  function startRound(seq: number[]) {
    setPhase('showing');
    setUserInput([]);
    setTimeout(() => showSequence(seq, seq.length), 500);
  }

  useEffect(() => {
    const seq = [Math.floor(Math.random() * 4)];
    setSequence(seq);
    setRound(1);
    G.current.maxRound = 1;
    startRound(seq);
  }, []);

  function finish(won: boolean) {
    G.current.done = true;
    const total = G.current.correct + G.current.wrong;
    onFinish({
      gameId: 'pattern-simon', gameName: 'Pattern Simon', domain: 'Memory',
      score: G.current.score,
      accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0,
      avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong,
      maxCombo: G.current.maxRound, difficulty: 2,
      xpEarned: Math.floor(G.current.score / 5)
    });
    re();
  }

  function handlePad(id: number) {
    if (phase !== 'input' || blockRef.current || G.current.done) return;
    setActiveId(id);
    setTimeout(() => setActiveId(null), 150);

    const idx = userInput.length;
    const newInput = [...userInput, id];

    if (id !== sequence[idx]) {
      G.current.wrong += 1;
      G.current.score = Math.max(0, G.current.score - 10);
      setPhase('lose');
      re();
      setTimeout(() => finish(false), 800);
      return;
    }

    G.current.correct += 1;
    G.current.score += 10 * sequence.length;

    if (newInput.length === sequence.length) {
      G.current.maxRound = Math.max(G.current.maxRound, round + 1);
      if (round >= 10) {
        setPhase('win');
        setTimeout(() => finish(true), 600);
      } else {
        const newSeq = [...sequence, Math.floor(Math.random() * 4)];
        setSequence(newSeq);
        setRound(r => r + 1);
        setUserInput([]);
        re();
        setTimeout(() => startRound(newSeq), 600);
      }
    } else {
      setUserInput(newInput);
    }
  }

  const g = G.current;
  if (g.done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">🔮</div>
        <h2 className="text-2xl font-black text-white">Simon Says Done!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', g.score, 'text-cyan-400'], ['Best Round', g.maxRound, 'text-purple-400'], ['Correct', g.correct, 'text-green-400']].map(([l, v, c]) => (
            <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex justify-between w-full text-sm">
        <span className="text-purple-400 font-bold">Round {round} • Length: {sequence.length}</span>
        <span className="text-yellow-400 font-bold">{g.score}pts</span>
      </div>

      <div className={`glass-panel px-6 py-3 rounded-full text-center border transition-all ${
        phase === 'showing' ? 'border-yellow-400 text-yellow-400' :
        phase === 'input' ? 'border-cyan-400 text-cyan-400' :
        phase === 'win' ? 'border-green-400 text-green-400' : 'border-red-400 text-red-400'
      }`}>
        <span className="font-bold text-sm uppercase tracking-widest">
          {phase === 'showing' ? '👁 Watch carefully...' :
           phase === 'input' ? `👆 Your turn! (${userInput.length}/${sequence.length})` :
           phase === 'win' ? '🏆 Perfect!' : '❌ Wrong!'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
        {PADS.map(pad => (
          <motion.button key={pad.id}
            onClick={() => handlePad(pad.id)}
            whileTap={{ scale: 0.88 }}
            className="aspect-square rounded-3xl text-4xl flex items-center justify-center border-2 transition-all"
            style={{
              background: activeId === pad.id ? `${pad.color}55` : `${pad.color}18`,
              borderColor: activeId === pad.id ? pad.color : `${pad.color}44`,
              boxShadow: activeId === pad.id ? `0 0 40px ${pad.color}` : 'none',
            }}
            animate={{ scale: activeId === pad.id ? 1.1 : 1 }}>
            {pad.label}
          </motion.button>
        ))}
      </div>

      <div className="flex gap-2">
        {sequence.map((id, i) => {
          const pad = PADS[id];
          const done = i < userInput.length;
          const wrong = done && userInput[i] !== id;
          return (
            <div key={i} className="w-3 h-3 rounded-full border"
              style={{
                background: wrong ? '#ef444488' : done ? pad.color : 'transparent',
                borderColor: pad.color,
              }} />
          );
        })}
      </div>
    </div>
  );
}
