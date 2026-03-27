import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const WORDS = [
  'BRAIN','LOGIC','FOCUS','SPEED','POWER','SHARP','SMART','QUICK','THINK','LEARN',
  'CYBER','NEURO','FLASH','STORM','BLAZE','SWIFT','VORTEX','MATRIX','NEURAL','PULSE',
  'ADAPT','SOLVE','FORGE','ELITE','NEXUS','PRISM','ZENITH','VECTOR','HELIX','APEX',
  'CRISP','PHASE','QUARTZ','SYNAPSE','CORTEX','PLASMA','CIPHER','SPECTRUM','GRAVITY','PHANTOM',
];

function scramble(word: string) {
  let s = word;
  while (s === word) s = word.split('').sort(() => Math.random() - 0.5).join('');
  return s;
}

export default function WordScramble({ onFinish }: Props) {
  const TOTAL = 12;
  const G = useRef({ score: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, done: false });
  const [pool] = useState(() => [...WORDS].sort(() => Math.random() - 0.5).slice(0, TOTAL));
  const [qIdx, setQIdx] = useState(0);
  const [scrambled, setScrambled] = useState(() => scramble(pool[0]));
  const [input, setInput] = useState('');
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [hint, setHint] = useState(false);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  const inputRef = useRef<HTMLInputElement>(null);

  const word = pool[qIdx];

  function finish() {
    G.current.done = true;
    const total = G.current.correct + G.current.wrong;
    onFinish({
      gameId: 'word-scramble', gameName: 'Word Scramble', domain: 'Verbal',
      score: G.current.score,
      accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0,
      avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong,
      maxCombo: G.current.maxCombo, difficulty: 2,
      xpEarned: Math.floor(G.current.score / 5)
    });
    re();
  }

  function check() {
    if (!input.trim()) return;
    const ok = input.trim().toUpperCase() === word;
    if (ok) {
      G.current.combo += 1;
      G.current.maxCombo = Math.max(G.current.maxCombo, G.current.combo);
      G.current.score += 15 * Math.min(G.current.combo, 4) + (hint ? 0 : 5);
      G.current.correct += 1;
      setFlash('ok');
    } else {
      G.current.combo = 0;
      G.current.wrong += 1;
      setFlash('bad');
    }
    re();
    setTimeout(() => {
      const next = qIdx + 1;
      if (next >= TOTAL) finish();
      else {
        setQIdx(next);
        setScrambled(scramble(pool[next]));
        setInput('');
        setFlash(null);
        setHint(false);
        inputRef.current?.focus();
      }
    }, ok ? 500 : 800);
  }

  function skip() {
    G.current.wrong += 1; G.current.combo = 0; re();
    const next = qIdx + 1;
    if (next >= TOTAL) finish();
    else {
      setQIdx(next); setScrambled(scramble(pool[next])); setInput(''); setFlash(null); setHint(false);
    }
  }

  const g = G.current;
  if (g.done) {
    const total = g.correct + g.wrong;
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">📝</div>
        <h2 className="text-2xl font-black text-white">Scramble Done!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', g.score, 'text-cyan-400'], ['Solved', `${g.correct}/${TOTAL}`, 'text-green-400'], ['Combo', `×${g.maxCombo}`, 'text-yellow-400']].map(([l, v, c]) => (
            <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
      <div className="flex justify-between w-full text-sm">
        <span className="text-gray-400">{qIdx + 1}/{TOTAL}</span>
        <span className="text-yellow-400 font-bold">{g.score}pts{g.combo > 1 ? ` • 🔥×${g.combo}` : ''}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={qIdx} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
          className={`w-full glass-panel p-8 rounded-2xl text-center border-2 transition-all ${
            flash === 'ok' ? 'border-green-400 bg-green-500/10' : flash === 'bad' ? 'border-red-400 bg-red-500/10' : 'border-white/10'
          }`}>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Unscramble this word</p>
          <div className="flex gap-2 justify-center flex-wrap mb-3">
            {scrambled.split('').map((l, i) => (
              <span key={i} className="w-10 h-10 flex items-center justify-center rounded-lg bg-cyan-500/15 border border-cyan-400/30 font-black text-2xl text-cyan-300">
                {l}
              </span>
            ))}
          </div>
          {hint && <p className="text-xs text-yellow-400">Hint: {word.length} letters, starts with <b>{word[0]}</b></p>}
          {flash === 'ok' && <p className="text-green-400 font-black text-lg mt-1">✓ {word}!</p>}
          {flash === 'bad' && <p className="text-red-400 font-black text-sm mt-1">✗ The word was: {word}</p>}
        </motion.div>
      </AnimatePresence>

      <input ref={inputRef}
        value={input} onChange={e => setInput(e.target.value.toUpperCase())}
        onKeyDown={e => e.key === 'Enter' && check()}
        className="w-full px-5 py-4 rounded-xl bg-white/8 border border-white/20 text-white font-black text-xl text-center uppercase tracking-widest placeholder-gray-600 focus:outline-none focus:border-cyan-400 transition-colors"
        placeholder="TYPE YOUR ANSWER..."
        maxLength={20}
        autoFocus
      />

      <div className="flex gap-3 w-full">
        <motion.button onClick={check} whileTap={{ scale: 0.95 }}
          className="flex-1 py-3 rounded-xl font-black bg-cyan-500 text-black text-sm hover:bg-cyan-400 transition-all">
          ✓ CHECK
        </motion.button>
        <motion.button onClick={() => setHint(true)} whileTap={{ scale: 0.95 }} disabled={hint}
          className="px-4 py-3 rounded-xl font-black bg-white/8 border border-white/15 text-yellow-400 text-sm hover:bg-yellow-500/20 transition-all disabled:opacity-30">
          💡 HINT
        </motion.button>
        <motion.button onClick={skip} whileTap={{ scale: 0.95 }}
          className="px-4 py-3 rounded-xl font-black bg-white/8 border border-white/15 text-gray-400 text-sm hover:text-white transition-all">
          SKIP →
        </motion.button>
      </div>
    </div>
  );
}
