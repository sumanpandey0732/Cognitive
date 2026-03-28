import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameSession } from '@/context/AppContext';
interface Props { onFinish: (s: Partial<GameSession>) => void; }
export default function ReactionTest({ onFinish }: Props) {
  const ROUNDS = 10;
  const G = useRef({ score: 0, correct: 0, wrong: 0, totalMs: 0, best: Infinity, done: false });
  const [phase, setPhase] = useState<'waiting' | 'ready' | 'go' | 'result' | 'early'>('waiting');
  const [reactionMs, setReactionMs] = useState(0);
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  const goTime = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  function startRound(r: number) {
    setPhase('ready'); setRound(r);
    const delay = 1500 + Math.random() * 3000;
    timeoutRef.current = setTimeout(() => { goTime.current = Date.now(); setPhase('go'); }, delay);
  }
  useEffect(() => { setTimeout(() => startRound(0), 500); return () => clearTimeout(timeoutRef.current); }, []);
  function finish(allTimes: number[]) {
    G.current.done = true;
    const avg = allTimes.length ? Math.round(allTimes.reduce((a, b) => a + b, 0) / allTimes.length) : 0;
    onFinish({ gameId: 'reaction-test', gameName: 'Reaction Test', domain: 'Speed', score: G.current.score, accuracy: Math.round(G.current.correct / (G.current.correct + G.current.wrong) * 100) || 0, avgResponseMs: avg, correct: G.current.correct, wrong: G.current.wrong, maxCombo: Math.round(G.current.best), difficulty: 1, xpEarned: Math.floor(G.current.score / 5) });
    re();
  }
  function handleClick() {
    if (phase === 'go') {
      const ms = Date.now() - goTime.current;
      G.current.correct += 1; G.current.best = Math.min(G.current.best, ms); G.current.totalMs += ms;
      const pts = ms < 200 ? 50 : ms < 300 ? 35 : ms < 500 ? 20 : 10;
      G.current.score += pts; setReactionMs(ms);
      const newTimes = [...times, ms]; setTimes(newTimes); setPhase('result');
      const next = round + 1;
      if (next >= ROUNDS) { setTimeout(() => finish(newTimes), 800); }
      else { setTimeout(() => startRound(next), 900); }
    } else if (phase === 'ready') {
      clearTimeout(timeoutRef.current); G.current.wrong += 1; setPhase('early');
      setTimeout(() => startRound(round), 1200);
    }
  }
  const g = G.current;
  const avgMs = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  if (g.done) { return <div className="flex flex-col items-center gap-4 text-center py-6"><div className="text-5xl">⚡</div><h2 className="text-2xl font-black text-white">Reaction Test Done!</h2><div className="grid grid-cols-3 gap-3">{[['Score', g.score, 'text-cyan-400'], ['Avg', `${avgMs}ms`, 'text-green-400'], ['Best', `${g.best === Infinity ? '—' : g.best}ms`, 'text-yellow-400']].map(([l, v, c]) => <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>)}</div></div>; }
  const bgColor = phase === 'ready' ? 'bg-red-900/30 border-red-500' : phase === 'go' ? 'bg-green-500/30 border-green-400' : phase === 'early' ? 'bg-orange-500/20 border-orange-400' : 'bg-white/5 border-white/10';
  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between text-sm"><span className="text-gray-400">{round + 1}/{ROUNDS}</span><span className="text-yellow-400 font-bold">{g.score}pts</span></div>
      <motion.div onClick={handleClick} whileTap={{ scale: 0.96 }}
        className={`w-full rounded-3xl flex flex-col items-center justify-center cursor-pointer border-4 transition-all select-none ${bgColor}`}
        style={{ height: 320 }}>
        {phase === 'waiting' && <p className="text-2xl text-gray-400">Get ready...</p>}
        {phase === 'ready' && <><p className="text-red-300 font-black text-3xl">⚠️ Wait for GREEN</p><p className="text-red-400/70 text-sm mt-2">Don't tap yet!</p></>}
        {phase === 'go' && <><p className="text-green-300 font-black text-5xl animate-pulse">TAP!</p><p className="text-green-400/80 text-lg mt-2">NOW NOW NOW!</p></>}
        {phase === 'result' && <><p className="text-cyan-300 font-black text-4xl">{reactionMs}ms</p><p className="text-gray-400 mt-1">{reactionMs < 200 ? '🚀 Superhuman!' : reactionMs < 300 ? '⚡ Excellent!' : reactionMs < 500 ? '✓ Good' : '🐢 Keep training'}</p></>}
        {phase === 'early' && <><p className="text-orange-300 font-black text-3xl">Too Early!</p><p className="text-orange-400/70 text-sm mt-2">Wait for green!</p></>}
      </motion.div>
      {times.length > 0 && <div className="flex gap-2 flex-wrap justify-center">{times.map((t, i) => <span key={i} className={`text-xs font-bold px-2 py-1 rounded ${t < 300 ? 'text-green-400 bg-green-500/10' : t < 500 ? 'text-yellow-400 bg-yellow-500/10' : 'text-red-400 bg-red-500/10'}`}>{t}ms</span>)}</div>}
    </div>
  );
}
