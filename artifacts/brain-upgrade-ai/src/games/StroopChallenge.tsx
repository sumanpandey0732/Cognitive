import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const COLORS = [
  { name: 'RED',    css: '#ef4444' },
  { name: 'BLUE',   css: '#3b82f6' },
  { name: 'GREEN',  css: '#22c55e' },
  { name: 'YELLOW', css: '#eab308' },
  { name: 'PURPLE', css: '#a855f7' },
  { name: 'CYAN',   css: '#06b6d4' },
];

function genRound(difficulty: number) {
  const word = COLORS[Math.floor(Math.random() * COLORS.length)];
  let ink = COLORS[Math.floor(Math.random() * COLORS.length)];
  // Higher difficulty: always make word ≠ ink color
  if (difficulty > 1) while (ink.name === word.name) ink = COLORS[Math.floor(Math.random() * COLORS.length)];
  const question = difficulty === 1
    ? Math.random() > 0.5 ? 'ink' : 'word'
    : Math.random() > 0.3 ? 'ink' : 'word';
  return { word, ink, question };
}

export default function StroopChallenge({ onFinish }: Props) {
  const TOTAL = 20;
  const [round, setRound] = useState<ReturnType<typeof genRound>>(genRound(1));
  const [q, setQ] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [timeLeft, setTimeLeft] = useState(8);
  const [flash, setFlash] = useState<'none'|'ok'|'bad'>('none');
  const [done, setDone] = useState(false);
  const [startMs] = useState(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const level = Math.min(3, Math.floor(q / 7) + 1);

  useEffect(() => {
    if (done) return;
    setTimeLeft(Math.max(4, 8 - Math.floor(q / 5)));
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          handleAnswer(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [q, done]);

  const finish = (c: number, w: number, co: number, mc: number, sc: number) => {
    clearInterval(timerRef.current);
    setDone(true);
    const total = c + w;
    onFinish({
      gameId: 'stroop', gameName: 'Stroop Challenge', domain: 'Focus',
      score: sc, accuracy: total > 0 ? Math.round((c / total) * 100) : 0,
      avgResponseMs: Math.round((Date.now() - startMs) / Math.max(1, total)),
      correct: c, wrong: w, maxCombo: mc, difficulty: level as 1|2|3,
      xpEarned: Math.floor(sc / 5)
    });
  };

  const handleAnswer = (chosenName: string | null) => {
    clearInterval(timerRef.current);
    const correct_name = round.question === 'ink' ? round.ink.name : round.word.name;
    const isCorrect = chosenName === correct_name;

    if (isCorrect) {
      setFlash('ok');
      setCorrect(c => {
        const nc = c + 1;
        setCombo(co => {
          const nco = co + 1; const nmc = Math.max(maxCombo, nco);
          setMaxCombo(nmc);
          setScore(s => s + 10 * Math.min(nco, 5));
          if (nc >= TOTAL || q + 1 >= TOTAL) finish(nc, wrong, nco, nmc, score + 10 * Math.min(nco, 5));
          else { setTimeout(() => { setRound(genRound(level)); setQ(qq => qq + 1); setFlash('none'); }, 300); }
          return nco;
        });
        return nc;
      });
    } else {
      setFlash('bad');
      setWrong(w => {
        const nw = w + 1;
        setCombo(0);
        setLives(l => {
          const nl = l - 1;
          if (nl <= 0) finish(correct, nw, 0, maxCombo, score);
          else setTimeout(() => { setRound(genRound(level)); setQ(qq => qq + 1); setFlash('none'); }, 400);
          return nl;
        });
        return nw;
      });
    }
  };

  if (done) {
    const total = correct + wrong;
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">🎨</div>
        <h2 className="text-2xl font-black text-white">Stroop Complete!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round(correct/total*100) : 0}%`, 'text-green-400'], ['Max Combo', `×${maxCombo}`, 'text-yellow-400']].map(([l,v,c]) => (
            <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>
          ))}
        </div>
      </div>
    );
  }

  const timeMax = Math.max(4, 8 - Math.floor(q / 5));

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      <div className="flex justify-between w-full text-sm">
        <div className="flex gap-1">{[0,1,2,3,4].map(i => <span key={i} className={i < lives ? 'text-red-400' : 'text-gray-700'}>♥</span>)}</div>
        <span className="text-yellow-400 font-bold">{q}/{TOTAL}</span>
        <span className={`font-mono font-bold ${timeLeft <= 2 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>{timeLeft}s</span>
      </div>
      <div className="w-full h-1 bg-white/5 rounded-full">
        <motion.div className={`h-1 rounded-full transition-all ${timeLeft <= 2 ? 'bg-red-500' : 'bg-cyan-500'}`}
          animate={{ width: `${(timeLeft / timeMax) * 100}%` }} />
      </div>
      <div className="text-center glass-panel p-6 rounded-2xl w-full">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">
          {round.question === 'ink' ? 'What COLOR is the text written in?' : 'What does the text SAY?'}
        </p>
        <p className="text-5xl font-black tracking-widest" style={{ color: round.ink.css, textShadow: `0 0 20px ${round.ink.css}` }}>
          {round.word.name}
        </p>
        {combo > 1 && <p className="text-yellow-400 text-xs font-bold mt-2">🔥 ×{combo} Combo</p>}
      </div>
      <div className="grid grid-cols-3 gap-2 w-full">
        {COLORS.map(c => (
          <motion.button key={c.name} onClick={() => handleAnswer(c.name)} whileTap={{ scale: 0.9 }}
            className="py-3 rounded-xl font-bold text-sm border border-white/10 hover:border-white/30 transition-all"
            style={{ background: `${c.css}22`, color: c.css, boxShadow: flash === 'ok' ? `0 0 15px ${c.css}44` : 'none' }}>
            {c.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
