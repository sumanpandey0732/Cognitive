import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameSession } from '@/context/AppContext';
interface Props { onFinish: (s: Partial<GameSession>) => void; }
const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
const PROMPTS = [
  'brain','speed','focus','logic','memory','power','think','learn','sharp','quick',
  'cyber','neuro','flash','storm','blaze','swift','solve','forge','elite','nexus',
  '7 + 8 = 15','9 × 6 = 54','100 - 37 = 63','8 × 7 = 56','45 + 36 = 81',
  'REACT FAST','TYPE IT NOW','SPEED RUNS','MIND BLAZE','NEURAL NET',
];
export default function TypingBlitz({ onFinish }: Props) {
  const TIME = 45;
  const G = useRef({ score: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, done: false });
  const [prompt, setPrompt] = useState('');
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIME);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  function nextPrompt() { setPrompt(PROMPTS[rnd(0, PROMPTS.length - 1)]); setInput(''); setFlash(null); }
  useEffect(() => {
    nextPrompt(); inputRef.current?.focus();
    timerRef.current = setInterval(() => setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); finish(); return 0; } return t - 1; }), 1000);
    return () => clearInterval(timerRef.current);
  }, []);
  function finish() { clearInterval(timerRef.current); G.current.done = true; const total = G.current.correct + G.current.wrong; onFinish({ gameId: 'typing-blitz', gameName: 'Typing Blitz', domain: 'Speed', score: G.current.score, accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0, avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong, maxCombo: G.current.maxCombo, difficulty: 2, xpEarned: Math.floor(G.current.score / 5) }); re(); }
  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInput(val);
    if (val.toLowerCase() === prompt.toLowerCase()) {
      G.current.combo += 1; G.current.maxCombo = Math.max(G.current.maxCombo, G.current.combo);
      G.current.score += 10 * Math.min(G.current.combo, 5) + Math.ceil(prompt.length * 1.5); G.current.correct += 1;
      setFlash('ok'); re(); setTimeout(nextPrompt, 150);
    } else if (val.length > 0 && !prompt.toLowerCase().startsWith(val.toLowerCase())) {
      G.current.wrong += 1; G.current.combo = 0; setFlash('bad'); re();
    }
  }
  const g = G.current;
  if (g.done) { return <div className="flex flex-col items-center gap-4 text-center py-6"><div className="text-5xl">⌨️</div><h2 className="text-2xl font-black text-white">Blitz Done!</h2><div className="grid grid-cols-3 gap-3">{[['Score', g.score, 'text-cyan-400'], ['Typed', g.correct, 'text-green-400'], ['WPM', Math.round(g.correct / (TIME / 60)), 'text-yellow-400']].map(([l, v, c]) => <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>)}</div></div>; }
  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <span className="text-green-400 font-bold">✓{g.correct}</span>
        <span className={`font-mono font-black text-3xl ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>{timeLeft}s</span>
        <span className="text-yellow-400 font-bold">{g.score}pts{g.combo > 1 ? ` 🔥×${g.combo}` : ''}</span>
      </div>
      <div className="w-full h-2 bg-white/5 rounded-full"><motion.div className={`h-2 rounded-full ${timeLeft <= 10 ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-500 to-purple-500'}`} style={{ width: `${(timeLeft / TIME) * 100}%` }} /></div>
      <div className={`glass-panel p-6 rounded-2xl border-2 text-center transition-all ${flash === 'ok' ? 'border-green-400 bg-green-500/10' : flash === 'bad' ? 'border-red-400 bg-red-500/10' : 'border-white/10'}`}>
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Type exactly:</p>
        <div className="text-3xl font-black text-white font-mono tracking-wider">{prompt.split('').map((char, i) => {
          const typed = input[i];
          const color = !typed ? 'text-gray-400' : typed.toLowerCase() === char.toLowerCase() ? 'text-green-400' : 'text-red-400';
          return <span key={i} className={color}>{char}</span>;
        })}</div>
      </div>
      <input ref={inputRef} value={input} onChange={handleInput} className="w-full px-5 py-4 rounded-xl bg-white/8 border border-white/20 text-white font-mono text-xl text-center focus:outline-none focus:border-cyan-400 transition-colors" placeholder="start typing..." autoFocus autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} />
      <p className="text-center text-xs text-gray-500">Type it exactly — spaces & caps count!</p>
    </div>
  );
}
