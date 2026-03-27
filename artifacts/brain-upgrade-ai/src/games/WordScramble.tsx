import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const WORD_BANK: { word: string; hint: string }[] = [
  { word: 'BRAIN', hint: 'Organ in your head' },
  { word: 'LOGIC', hint: 'Systematic reasoning' },
  { word: 'FOCUS', hint: 'Concentration' },
  { word: 'SPEED', hint: 'Rate of motion' },
  { word: 'MEMORY', hint: 'Ability to recall' },
  { word: 'SMART', hint: 'Intelligent' },
  { word: 'THINK', hint: 'Use your mind' },
  { word: 'SOLVE', hint: 'Find the answer' },
  { word: 'LEARN', hint: 'Acquire knowledge' },
  { word: 'SHARP', hint: 'Quick and clever' },
  { word: 'PUZZLE', hint: 'A problem to solve' },
  { word: 'POWER', hint: 'Strength or ability' },
  { word: 'RAPID', hint: 'Very fast' },
  { word: 'ALERT', hint: 'Aware and attentive' },
  { word: 'NERVE', hint: 'Part of the nervous system' },
  { word: 'GRASP', hint: 'To understand' },
  { word: 'RECALL', hint: 'To remember' },
  { word: 'GENIUS', hint: 'Exceptional intellect' },
  { word: 'MENTAL', hint: 'Relating to the mind' },
  { word: 'SWIFT', hint: 'Moving quickly' },
  { word: 'DEDUCE', hint: 'Arrive at a conclusion' },
  { word: 'NEURAL', hint: 'Of the nervous system' },
  { word: 'REFLEX', hint: 'Automatic response' },
  { word: 'SYNAPSE', hint: 'Brain connection point' },
  { word: 'CORTEX', hint: 'Outer brain layer' },
];

function scramble(word: string) {
  const arr = word.split('');
  let scrambled: string[];
  do {
    scrambled = arr.sort(() => Math.random() - 0.5);
  } while (scrambled.join('') === word);
  return scrambled.join('');
}

export default function WordScramble({ onFinish }: Props) {
  const TOTAL = 10;
  const [used] = useState<Set<number>>(new Set());
  const [idx] = useState(() => {
    const arr = Array.from({ length: WORD_BANK.length }, (_, i) => i).sort(() => Math.random() - 0.5);
    return { list: arr, pos: 0 };
  });
  const getNext = () => {
    const pos = idx.pos++;
    return WORD_BANK[idx.list[pos % WORD_BANK.length]];
  };
  const [current, setCurrent] = useState(getNext);
  const [scrambled, setScrambled] = useState(() => scramble(current.word));
  const [input, setInput] = useState('');
  const [q, setQ] = useState(1);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [flash, setFlash] = useState<'none'|'ok'|'bad'>('none');
  const [hint, setHint] = useState(false);
  const [done, setDone] = useState(false);
  const [startMs] = useState(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  const advance = (isCorrect: boolean) => {
    setFlash(isCorrect ? 'ok' : 'bad');
    setTimeout(() => {
      setFlash('none');
      if (q >= TOTAL) {
        setDone(true);
        const total = isCorrect ? correct + 1 : correct;
        const w = isCorrect ? wrong : wrong + 1;
        onFinish({
          gameId: 'word-scramble', gameName: 'Word Scramble', domain: 'Verbal',
          score: isCorrect ? score + (isCorrect ? 20 + (hint ? 0 : 10) * Math.min(combo + 1, 5) : 0) : score,
          accuracy: Math.round((total / TOTAL) * 100),
          avgResponseMs: Math.round((Date.now() - startMs) / TOTAL),
          correct: total, wrong: w, maxCombo,
          difficulty: 2, xpEarned: Math.floor(total * 5)
        });
        return;
      }
      const nxt = getNext();
      setCurrent(nxt); setScrambled(scramble(nxt.word));
      setInput(''); setHint(false); setQ(n => n + 1);
      inputRef.current?.focus();
    }, 500);
  };

  const submit = () => {
    const guess = input.trim().toUpperCase();
    if (guess === current.word) {
      const nc = combo + 1; const nmc = Math.max(maxCombo, nc);
      setCombo(nc); setMaxCombo(nmc);
      const pts = 20 + (hint ? 0 : 10) * Math.min(nc, 5);
      setScore(s => s + pts); setCorrect(c => c + 1);
      advance(true);
    } else {
      setCombo(0); setWrong(w => w + 1);
      advance(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">📝</div>
        <h2 className="text-2xl font-black text-white">Scramble Complete!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', score, 'text-cyan-400'], ['Accuracy', `${Math.round(correct/TOTAL*100)}%`, 'text-green-400'], ['Max Combo', `×${maxCombo}`, 'text-yellow-400']].map(([l,v,c]) => (
            <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
      <div className="flex justify-between w-full text-sm">
        <span className="text-gray-400">Q{q}/{TOTAL}</span>
        <span className="text-yellow-400 font-bold">{score} pts</span>
        {combo > 1 && <span className="text-orange-400 font-black">🔥×{combo}</span>}
      </div>
      <div className={`w-full glass-panel p-6 rounded-2xl text-center transition-all ${flash === 'ok' ? 'border-green-400 bg-green-500/10' : flash === 'bad' ? 'border-red-400 bg-red-500/10' : ''}`}>
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Unscramble</p>
        <p className="text-4xl font-black text-white tracking-[0.3em] mb-4">
          {scrambled.split('').map((l, i) => (
            <span key={i} className="inline-block mx-0.5 text-cyan-300">{l}</span>
          ))}
        </p>
        {hint && <p className="text-sm text-purple-300 italic">💡 {current.hint}</p>}
      </div>
      <input ref={inputRef} value={input} onChange={e => setInput(e.target.value.toUpperCase())}
        onKeyDown={e => e.key === 'Enter' && submit()}
        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-center text-2xl font-mono font-black text-white tracking-widest focus:outline-none focus:border-cyan-500 uppercase"
        placeholder="TYPE HERE" autoFocus maxLength={12} />
      <div className="flex gap-3 w-full">
        <button onClick={() => setHint(true)} disabled={hint}
          className="flex-1 py-2 bg-white/5 text-gray-400 border border-white/10 rounded-xl text-sm hover:bg-white/10 disabled:opacity-30 transition-all">
          💡 Hint (-pts)
        </button>
        <button onClick={submit}
          className="flex-1 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-bold rounded-xl hover:scale-105 transition-all">
          SUBMIT ↵
        </button>
      </div>
      <div className="w-full bg-white/5 h-1 rounded-full">
        <div className="h-1 rounded-full bg-cyan-500 transition-all" style={{ width: `${(q / TOTAL) * 100}%` }} />
      </div>
    </div>
  );
}
