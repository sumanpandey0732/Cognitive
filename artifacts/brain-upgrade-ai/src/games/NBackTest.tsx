import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const LETTERS = 'BCDFGHJKLMNPQRSTVWXYZ'.split('');

export default function NBackTest({ onFinish }: Props) {
  const N = 1; // 1-back
  const TOTAL = 20;
  const G = useRef({ score: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, done: false });
  const [history, setHistory] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const [phase, setPhase] = useState<'showing' | 'respond' | 'feedback'>('showing');
  const [answered, setAnswered] = useState(false);
  const [isMatch, setIsMatch] = useState(false);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [step, setStep] = useState(0);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  const histRef = useRef<string[]>([]);
  const stepRef = useRef(0);

  function nextStep(s: number, hist: string[]) {
    if (G.current.done) return;
    stepRef.current = s;
    histRef.current = hist;

    const newLetter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    // 40% chance it's a match
    const forceMatch = s >= N && Math.random() < 0.4;
    const letter = forceMatch ? hist[hist.length - N] : newLetter;
    const match = s >= N && hist[hist.length - N] === letter;

    setCurrent(letter);
    setIsMatch(match);
    setStep(s);
    setHistory([...hist, letter]);
    histRef.current = [...hist, letter];
    setPhase('showing');
    setAnswered(false);
    setFlash(null);
    re();

    setTimeout(() => setPhase('respond'), 800);
  }

  useEffect(() => { nextStep(0, []); }, []);

  function handleResponse(tapped: boolean) {
    if (phase !== 'respond' || answered) return;
    setAnswered(true);
    const s = stepRef.current;
    const hist = histRef.current;
    const match = s >= N && hist[s - N] === hist[s];
    const ok = tapped === match;

    if (ok) {
      G.current.combo += 1; G.current.maxCombo = Math.max(G.current.maxCombo, G.current.combo);
      G.current.score += 10 * Math.min(G.current.combo, 5); G.current.correct += 1;
      setFlash('ok');
    } else {
      G.current.combo = 0; G.current.wrong += 1; setFlash('bad');
    }
    re();
    const next = s + 1;
    if (next >= TOTAL) setTimeout(() => finish(), 600);
    else setTimeout(() => nextStep(next, hist), 700);
  }

  function finish() {
    G.current.done = true;
    const total = G.current.correct + G.current.wrong;
    onFinish({
      gameId: 'nback-test', gameName: '1-Back Test', domain: 'Memory',
      score: G.current.score,
      accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0,
      avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong,
      maxCombo: G.current.maxCombo, difficulty: 2,
      xpEarned: Math.floor(G.current.score / 5)
    });
    re();
  }

  const g = G.current;
  if (g.done) {
    const total = g.correct + g.wrong;
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">🔁</div>
        <h2 className="text-2xl font-black text-white">N-Back Complete!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', g.score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round(g.correct / total * 100) : 0}%`, 'text-green-400'], ['Combo', `×${g.maxCombo}`, 'text-yellow-400']].map(([l, v, c]) => (
            <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
      <div className="flex justify-between w-full text-sm">
        <span className="text-gray-400">{step + 1}/{TOTAL}</span>
        <span className="text-purple-400 font-bold text-center">1-Back: Tap if same as 1 step ago</span>
        <span className="text-yellow-400 font-bold">{g.score}pts</span>
      </div>

      {/* History trail */}
      <div className="flex gap-2 justify-center h-8 items-center">
        {history.slice(-5).map((l, i, arr) => (
          <span key={i} className={`font-black text-lg transition-all ${i === arr.length - 1 ? 'text-white text-2xl' : 'text-gray-600 text-sm'}`}>{l}</span>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className={`w-40 h-40 rounded-3xl flex items-center justify-center border-4 transition-all ${
            flash === 'ok' ? 'border-green-400 bg-green-500/20' : flash === 'bad' ? 'border-red-400 bg-red-500/20' :
            phase === 'showing' ? 'border-cyan-400 bg-cyan-500/15 shadow-[0_0_30px_rgba(0,229,255,0.4)]' : 'border-white/20 bg-white/5'
          }`}>
          <span className="text-7xl font-black text-white">{current}</span>
        </motion.div>
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-4 w-full">
        <motion.button onClick={() => handleResponse(true)} whileTap={{ scale: 0.85 }}
          disabled={phase !== 'respond' || answered}
          className="py-6 rounded-xl font-black text-xl bg-green-500/20 border-2 border-green-400 text-green-400 hover:bg-green-500/30 transition-all disabled:opacity-30">
          ✓ SAME
        </motion.button>
        <motion.button onClick={() => handleResponse(false)} whileTap={{ scale: 0.85 }}
          disabled={phase !== 'respond' || answered}
          className="py-6 rounded-xl font-black text-xl bg-red-500/20 border-2 border-red-400 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-30">
          ✗ DIFFERENT
        </motion.button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        {step < N ? `Watch the first ${N} letter(s)` : `Was the letter the same as ${N} step(s) ago?`}
      </p>
    </div>
  );
}
