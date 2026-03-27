import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const EMOJIS = ['🚀','🌊','⚡','🎯','🔮','💎','🌙','🔥','🎸','🏆','🌈','🎭','🦋','🍀','🎪'];

function makeBoard(pairs: number) {
  const pool = EMOJIS.slice(0, pairs);
  return [...pool, ...pool].sort(() => Math.random() - 0.5).map((emoji, i) => ({
    id: i, emoji, flipped: false, matched: false
  }));
}

export default function MemoryCardFlip({ onFinish }: Props) {
  const ROUNDS = 3;
  const pairsPerRound = [6, 8, 10];
  const G = useRef({ score: 0, matches: 0, wrong: 0, round: 0, done: false, startMs: Date.now() });
  const [cards, setCards] = useState(() => makeBoard(pairsPerRound[0]));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [blocked, setBlocked] = useState(false);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);

  function nextRound() {
    const r = G.current.round + 1;
    if (r >= ROUNDS) {
      G.current.done = true;
      const total = G.current.matches + G.current.wrong;
      onFinish({
        gameId: 'memory-cards', gameName: 'Memory Card Flip', domain: 'Memory',
        score: G.current.score,
        accuracy: total > 0 ? Math.round(G.current.matches / total * 100) : 0,
        avgResponseMs: Math.round((Date.now() - G.current.startMs) / Math.max(1, total)),
        correct: G.current.matches, wrong: G.current.wrong,
        maxCombo: 0, difficulty: 2,
        xpEarned: Math.floor(G.current.score / 5)
      });
    } else {
      G.current.round = r;
      setCards(makeBoard(pairsPerRound[r]));
      setFlipped([]);
    }
    re();
  }

  function flip(id: number) {
    if (blocked || G.current.done) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const newFlipped = [...flipped, id];
    setCards(prev => prev.map(c => c.id === id ? { ...c, flipped: true } : c));
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setBlocked(true);
      const [a, b] = newFlipped.map(fid => cards.find(c => c.id === fid)!);
      if (a.emoji === b.emoji) {
        G.current.matches += 1;
        G.current.score += 20;
        setTimeout(() => {
          setCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, matched: true } : c));
          setFlipped([]);
          setBlocked(false);
          // Check if all matched
          setCards(prev => {
            const allDone = prev.every(c => c.matched || newFlipped.includes(c.id));
            if (allDone) { G.current.score += 50; setTimeout(nextRound, 400); }
            return prev.map(c => newFlipped.includes(c.id) ? { ...c, matched: true } : c);
          });
          re();
        }, 400);
      } else {
        G.current.wrong += 1;
        G.current.score = Math.max(0, G.current.score - 5);
        setTimeout(() => {
          setCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c));
          setFlipped([]);
          setBlocked(false);
          re();
        }, 900);
      }
    }
  }

  const g = G.current;
  const pairs = pairsPerRound[g.round] || pairsPerRound[ROUNDS - 1];
  const matchedCount = cards.filter(c => c.matched).length / 2;

  if (g.done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">🃏</div>
        <h2 className="text-2xl font-black text-white">Memory Master!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', g.score, 'text-cyan-400'], ['Matches', g.matches, 'text-green-400'], ['Misses', g.wrong, 'text-red-400']].map(([l, v, c]) => (
            <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>
          ))}
        </div>
      </div>
    );
  }

  const cols = pairs <= 6 ? 4 : pairs <= 8 ? 4 : 5;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between text-sm items-center">
        <span className="text-purple-400 font-bold">Round {g.round + 1}/{ROUNDS}</span>
        <span className="text-cyan-400 font-bold">{matchedCount}/{pairs} pairs</span>
        <span className="text-yellow-400 font-bold">{g.score}pts</span>
      </div>
      <div className="w-full h-2 bg-white/5 rounded-full">
        <motion.div className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"
          animate={{ width: `${(matchedCount / pairs) * 100}%` }} />
      </div>
      <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cards.map(card => (
          <motion.button key={card.id}
            onClick={() => flip(card.id)}
            whileTap={{ scale: 0.92 }}
            animate={{ rotateY: card.flipped || card.matched ? 0 : 180 }}
            className={`aspect-square rounded-xl text-2xl flex items-center justify-center border-2 transition-all ${
              card.matched ? 'bg-green-500/20 border-green-400/50 cursor-default' :
              card.flipped ? 'bg-white/15 border-cyan-400' :
              'bg-white/5 border-white/15 hover:border-white/30 cursor-pointer'
            }`}>
            {card.flipped || card.matched ? card.emoji : '?'}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
