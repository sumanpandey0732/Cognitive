import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSession } from '@/context/AppContext';
interface Props { onFinish: (s: Partial<GameSession>) => void; }
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export default function LetterMemory({ onFinish }: Props) {
  const ROUNDS = 8;
  const G = useRef({ score: 0, correct: 0, wrong: 0, maxLen: 0, done: false });
  const [phase, setPhase] = useState<'showing' | 'input'>('showing');
  const [seq, setSeq] = useState<string[]>([]);
  const [showIdx, setShowIdx] = useState(-1);
  const [input, setInput] = useState('');
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [round, setRound] = useState(0);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  const inputRef = useRef<HTMLInputElement>(null);
  function startRound(r: number) {
    const len = 3 + Math.floor(r / 1.5);
    const s = Array.from({ length: Math.min(len, 10) }, () => ALPHABET[Math.floor(Math.random() * 26)]);
    setSeq(s); setInput(''); setFlash(null); setPhase('showing'); setShowIdx(-1);
    const speed = Math.max(450, 850 - r * 45);
    s.forEach((_, i) => { setTimeout(() => setShowIdx(i), i * speed + 200); setTimeout(() => setShowIdx(-1), i * speed + speed - 80); });
    setTimeout(() => { setShowIdx(-1); setPhase('input'); setTimeout(() => inputRef.current?.focus(), 100); }, s.length * speed + 500);
  }
  useEffect(() => { startRound(0); }, []);
  function finish() { G.current.done = true; const total = G.current.correct + G.current.wrong; onFinish({ gameId: 'letter-memory', gameName: 'Letter Memory', domain: 'Memory', score: G.current.score, accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0, avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong, maxCombo: G.current.maxLen, difficulty: 2, xpEarned: Math.floor(G.current.score / 5) }); re(); }
  function submit() {
    const typed = input.trim().toUpperCase().split('').filter(c => ALPHABET.includes(c));
    let correct = 0;
    seq.forEach((l, i) => { if (typed[i] === l) correct++; });
    const ok = typed.join('') === seq.join('');
    if (ok) { G.current.score += 15 * seq.length; G.current.maxLen = Math.max(G.current.maxLen, seq.length); G.current.correct += seq.length; setFlash('ok'); }
    else { G.current.score += correct * 5; G.current.correct += correct; G.current.wrong += seq.length - correct; setFlash('bad'); }
    re();
    const next = round + 1;
    setTimeout(() => { if (next >= ROUNDS) finish(); else { setRound(next); startRound(next); } }, 900);
  }
  const g = G.current;
  if (g.done) { const total = g.correct + g.wrong; return <div className="flex flex-col items-center gap-4 text-center py-6"><div className="text-5xl">🔤</div><h2 className="text-2xl font-black text-white">Letter Master!</h2><div className="grid grid-cols-3 gap-3">{[['Score', g.score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round(g.correct / total * 100) : 0}%`, 'text-green-400'], ['Max Len', g.maxLen, 'text-purple-400']].map(([l, v, c]) => <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>)}</div></div>; }
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
      <div className="flex justify-between w-full text-sm"><span className="text-gray-400">Round {round + 1}/{ROUNDS}</span><span className="text-yellow-400 font-bold">{g.score}pts • Span: {seq.length}</span></div>
      <div className={`w-full glass-panel p-8 rounded-2xl border-2 min-h-36 flex flex-col items-center justify-center text-center transition-all ${flash === 'ok' ? 'border-green-400 bg-green-500/10' : flash === 'bad' ? 'border-red-400 bg-red-500/10' : 'border-white/10'}`}>
        {phase === 'showing' && showIdx >= 0 ? (
          <AnimatePresence mode="wait">
            <motion.div key={showIdx} initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }}
              className="text-8xl font-black text-purple-300" style={{ textShadow: '0 0 30px rgba(168,85,247,0.8)' }}>{seq[showIdx]}</motion.div>
          </AnimatePresence>
        ) : phase === 'showing' ? <p className="text-2xl text-gray-500 animate-pulse">Ready...</p>
        : <>
          <p className="text-sm text-purple-400 font-bold mb-3">Type the letters you saw in order:</p>
          <div className="flex gap-1 flex-wrap justify-center">{seq.map((l, i) => <span key={i} className={`w-8 h-8 rounded font-black flex items-center justify-center ${i < input.length ? (input[i]?.toUpperCase() === l ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400') : 'bg-white/5 text-gray-600'}`}>{i < input.length ? input[i].toUpperCase() : '_'}</span>)}</div>
        </>}
        {flash && <p className={`font-black text-sm mt-2 ${flash === 'ok' ? 'text-green-400' : 'text-red-400'}`}>{flash === 'ok' ? '✓ Perfect!' : `✗ Answer: ${seq.join(' ')}`}</p>}
      </div>
      {phase === 'input' && !flash && (
        <div className="w-full space-y-3">
          <input ref={inputRef} value={input} onChange={e => { const v = e.target.value.toUpperCase().replace(/[^A-Z]/g, ''); if (v.length <= seq.length) setInput(v); }} onKeyDown={e => e.key === 'Enter' && submit()} className="w-full px-5 py-4 rounded-xl bg-white/8 border border-white/20 text-white font-black text-3xl text-center tracking-widest focus:outline-none focus:border-purple-400 uppercase" placeholder="TYPE LETTERS..." autoFocus />
          <motion.button onClick={submit} whileTap={{ scale: 0.95 }} className="w-full py-3 rounded-xl font-black bg-purple-500 text-white hover:bg-purple-400 transition-all">SUBMIT →</motion.button>
        </div>
      )}
    </div>
  );
}
