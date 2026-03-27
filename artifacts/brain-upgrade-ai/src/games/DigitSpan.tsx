import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

export default function DigitSpan({ onFinish }: Props) {
  const ROUNDS = 8;
  const G = useRef({ score: 0, correct: 0, wrong: 0, maxSpan: 0, done: false });
  const [phase, setPhase] = useState<'showing' | 'input' | 'result'>('showing');
  const [sequence, setSequence] = useState<number[]>([]);
  const [showIdx, setShowIdx] = useState(-1);
  const [input, setInput] = useState('');
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [round, setRound] = useState(0);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  const inputRef = useRef<HTMLInputElement>(null);

  function genSequence(length: number) {
    return Array.from({ length }, () => Math.floor(Math.random() * 9) + 1);
  }

  function startRound(r: number) {
    const len = 3 + Math.floor(r / 2);
    const seq = genSequence(Math.min(len, 9));
    setSequence(seq);
    setInput('');
    setFlash(null);
    setShowIdx(-1);
    setPhase('showing');

    // Show digits one by one
    let i = 0;
    const speed = Math.max(500, 900 - r * 50);
    const show = setInterval(() => {
      setShowIdx(i);
      i++;
      if (i >= seq.length) {
        clearInterval(show);
        setTimeout(() => {
          setShowIdx(-1);
          setPhase('input');
          setTimeout(() => inputRef.current?.focus(), 100);
        }, speed);
      }
    }, speed);
  }

  useEffect(() => { startRound(0); }, []);

  function finish() {
    G.current.done = true;
    const total = G.current.correct + G.current.wrong;
    onFinish({
      gameId: 'digit-span', gameName: 'Digit Span', domain: 'Memory',
      score: G.current.score,
      accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0,
      avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong,
      maxCombo: G.current.maxSpan, difficulty: 2,
      xpEarned: Math.floor(G.current.score / 5)
    });
    re();
  }

  function submit() {
    const typed = input.trim().replace(/\s+/g, '');
    const correct = sequence.join('');
    const ok = typed === correct;
    setFlash(ok ? 'ok' : 'bad');
    if (ok) {
      G.current.score += 15 * sequence.length;
      G.current.correct += 1;
      G.current.maxSpan = Math.max(G.current.maxSpan, sequence.length);
    } else {
      G.current.wrong += 1;
    }
    re();
    const next = round + 1;
    setTimeout(() => {
      if (next >= ROUNDS) finish();
      else { setRound(next); startRound(next); }
    }, 800);
  }

  const g = G.current;
  if (g.done) {
    const total = g.correct + g.wrong;
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">🧠</div>
        <h2 className="text-2xl font-black text-white">Memory Span Done!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', g.score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round(g.correct / total * 100) : 0}%`, 'text-green-400'], ['Max Span', g.maxSpan, 'text-purple-400']].map(([l, v, c]) => (
            <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
      <div className="flex justify-between w-full text-sm">
        <span className="text-gray-400">Round {round + 1}/{ROUNDS}</span>
        <span className="text-yellow-400 font-bold">{g.score}pts • Span: {sequence.length}</span>
      </div>

      <div className={`w-full glass-panel p-8 rounded-2xl text-center border-2 min-h-36 flex flex-col items-center justify-center transition-all ${
        flash === 'ok' ? 'border-green-400 bg-green-500/10' : flash === 'bad' ? 'border-red-400 bg-red-500/10' : 'border-white/10'
      }`}>
        {phase === 'showing' && showIdx >= 0 && (
          <>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Memorize! ({showIdx + 1}/{sequence.length})</p>
            <AnimatePresence mode="wait">
              <motion.div key={showIdx} initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }}
                className="text-8xl font-black text-cyan-300" style={{ textShadow: '0 0 30px rgba(0,229,255,0.8)' }}>
                {sequence[showIdx]}
              </motion.div>
            </AnimatePresence>
          </>
        )}
        {phase === 'showing' && showIdx < 0 && (
          <p className="text-2xl text-gray-500 animate-pulse">Get ready...</p>
        )}
        {phase === 'input' && (
          <div className="w-full">
            <p className="text-sm text-cyan-400 font-bold mb-4">Type all digits in order:</p>
            <div className="flex justify-center gap-2 flex-wrap mb-3">
              {sequence.map((_, i) => (
                <div key={i} className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center font-black text-lg ${
                  i < input.length ? 'border-cyan-400 text-cyan-300 bg-cyan-500/20' : 'border-white/20 text-transparent'
                }`}>{input[i] || '_'}</div>
              ))}
            </div>
          </div>
        )}
        {flash === 'ok' && <p className="text-green-400 font-black text-lg">✓ Correct: {sequence.join(' ')}</p>}
        {flash === 'bad' && <p className="text-red-400 font-black text-sm">✗ Answer was: {sequence.join(' ')}</p>}
      </div>

      {phase === 'input' && !flash && (
        <div className="w-full space-y-3">
          <input ref={inputRef} value={input}
            onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= sequence.length) setInput(v); }}
            onKeyDown={e => e.key === 'Enter' && submit()}
            className="w-full px-5 py-4 rounded-xl bg-white/8 border border-white/20 text-white font-black text-3xl text-center tracking-widest focus:outline-none focus:border-cyan-400"
            placeholder="_ _ _ _" autoFocus
          />
          <motion.button onClick={submit} whileTap={{ scale: 0.95 }}
            className="w-full py-3 rounded-xl font-black bg-cyan-500 text-black hover:bg-cyan-400 transition-all">
            SUBMIT →
          </motion.button>
        </div>
      )}
    </div>
  );
}
