import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const COLORS = [
  { id: 'cyan',   label: '⬡', css: '#00e5ff', bg: 'rgba(0,229,255,0.2)' },
  { id: 'red',    label: '⬡', css: '#ef4444', bg: 'rgba(239,68,68,0.2)' },
  { id: 'purple', label: '⬡', css: '#a855f7', bg: 'rgba(168,85,247,0.2)' },
  { id: 'green',  label: '⬡', css: '#22c55e', bg: 'rgba(34,197,94,0.2)' },
];

type Phase = 'waiting' | 'active' | 'miss';

export default function ReactionChain({ onFinish }: Props) {
  const TOTAL = 20;
  const [target, setTarget] = useState('cyan');
  const [current, setCurrent] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('waiting');
  const [tapped, setTapped] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [lives, setLives] = useState(5);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [reactionMs, setReactionMs] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const showTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const livesRef = useRef(5);

  const endGame = () => {
    clearTimeout(timerRef.current);
    setDone(true);
    const total = correctRef.current + wrongRef.current;
    const avgMs = reactionMs.length > 0 ? Math.round(reactionMs.reduce((a,b) => a+b, 0) / reactionMs.length) : 0;
    onFinish({
      gameId: 'reaction-chain', gameName: 'Reaction Chain', domain: 'Speed',
      score: scoreRef.current, accuracy: total > 0 ? Math.round((correctRef.current / total) * 100) : 0,
      avgResponseMs: avgMs, correct: correctRef.current, wrong: wrongRef.current,
      maxCombo: maxComboRef.current, difficulty: 2, xpEarned: Math.floor(scoreRef.current / 5)
    });
  };

  const scheduleNext = () => {
    const delay = 500 + Math.random() * 1500;
    timerRef.current = setTimeout(() => {
      const col = COLORS[Math.floor(Math.random() * COLORS.length)].id;
      setCurrent(col); setPhase('active'); showTimeRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        if (col === target) {
          // Missed the target
          comboRef.current = 0; setCombo(0);
          livesRef.current -= 1; setLives(livesRef.current);
          if (livesRef.current <= 0) { endGame(); return; }
        }
        setCurrent(null); setPhase('waiting');
        scheduleNext();
      }, Math.max(600, 1200 - Math.floor(tapped / 5) * 100));
    }, delay);
  };

  useEffect(() => {
    scheduleNext();
    return () => clearTimeout(timerRef.current);
  }, []);

  const handleTap = (colorId: string) => {
    if (phase !== 'active' || !current) return;
    const ms = Date.now() - showTimeRef.current;
    clearTimeout(timerRef.current);
    const isTarget = colorId === target && current === target;
    const isMistake = current !== target;

    setTapped(t => {
      const nt = t + 1;
      if (nt >= TOTAL) { setTimeout(endGame, 400); }
      return nt;
    });

    if (isTarget) {
      comboRef.current += 1; maxComboRef.current = Math.max(maxComboRef.current, comboRef.current);
      const pts = Math.max(5, 50 - Math.floor(ms / 30)) * Math.min(comboRef.current, 3);
      scoreRef.current += pts; correctRef.current += 1;
      setScore(scoreRef.current); setCorrect(correctRef.current);
      setCombo(comboRef.current); setMaxCombo(maxComboRef.current);
      setReactionMs(r => [...r, ms]);
    } else if (isMistake) {
      comboRef.current = 0; setCombo(0); wrongRef.current += 1; setWrong(wrongRef.current);
      livesRef.current -= 1; setLives(livesRef.current);
      if (livesRef.current <= 0) { endGame(); return; }
    }
    setCurrent(null); setPhase('waiting');
    setTimeout(scheduleNext, 200);
  };

  if (done) {
    const avgMs = reactionMs.length > 0 ? Math.round(reactionMs.reduce((a,b)=>a+b,0)/reactionMs.length) : 0;
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">⚡</div>
        <h2 className="text-2xl font-black text-white">Chain Complete!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', scoreRef.current, 'text-cyan-400'], ['Avg Reaction', `${avgMs}ms`, 'text-green-400'], ['Max Combo', `×${maxComboRef.current}`, 'text-yellow-400']].map(([l,v,c]) => (
            <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>
          ))}
        </div>
      </div>
    );
  }

  const targetColor = COLORS.find(c => c.id === target)!;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
      <div className="flex justify-between w-full text-sm">
        <div className="flex gap-1">{[0,1,2,3,4].map(i => <span key={i} className={i < lives ? 'text-red-400' : 'text-gray-700'}>♥</span>)}</div>
        <span className="text-yellow-400 font-bold">{score} pts{combo > 1 && <span className="text-orange-400 ml-1">×{combo}</span>}</span>
        <span className="text-gray-400">{tapped}/{TOTAL}</span>
      </div>

      <div className="glass-panel px-6 py-3 rounded-full text-center border border-white/10">
        <p className="text-xs text-gray-400">Only tap when you see</p>
        <p className="font-black text-xl" style={{ color: targetColor.css }}>■ {target.toUpperCase()}</p>
      </div>

      <div className="relative w-48 h-48 flex items-center justify-center">
        {current ? (
          <AnimatePresence>
            <motion.div key={current}
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }}
              className="w-48 h-48 rounded-full cursor-pointer flex items-center justify-center"
              style={{
                background: COLORS.find(c => c.id === current)!.bg,
                border: `4px solid ${COLORS.find(c => c.id === current)!.css}`,
                boxShadow: `0 0 60px ${COLORS.find(c => c.id === current)!.css}88`,
              }}
              onClick={() => handleTap(current)}>
              <span className="text-5xl font-black" style={{ color: COLORS.find(c => c.id === current)!.css }}>■</span>
            </motion.div>
          </AnimatePresence>
        ) : (
          <motion.div className="w-24 h-24 rounded-full border-2 border-white/10 flex items-center justify-center"
            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <span className="text-gray-600 text-2xl">...</span>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 w-full">
        {COLORS.map(c => (
          <motion.button key={c.id} onClick={() => handleTap(c.id)}
            whileTap={{ scale: 0.85 }}
            className="py-3 rounded-xl border font-bold text-sm transition-all"
            style={{ background: c.bg, borderColor: c.css, color: c.css }}>
            {c.id.toUpperCase()}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
