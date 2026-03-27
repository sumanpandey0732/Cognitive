import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const EMOJIS = ['🧠','⚡','🎯','🔥','💎','🚀','🌟','🎮','🏆','🎲','🎪','🎨'];

interface Card { id: number; emoji: string; flipped: boolean; matched: boolean; }

function makeCards(pairs: number): Card[] {
  const emojis = EMOJIS.slice(0, pairs);
  const cards = [...emojis, ...emojis].map((emoji, i) => ({
    id: i, emoji, flipped: false, matched: false
  }));
  return cards.sort(() => Math.random() - 0.5);
}

export default function MemoryCardFlip({ onFinish }: Props) {
  const [cards, setCards] = useState<Card[]>(() => makeCards(8));
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);
  const [lives, setLives] = useState(5);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const startRef = useRef(Date.now());

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const flip = (idx: number) => {
    if (blocking || done) return;
    const card = cards[idx];
    if (card.flipped || card.matched || selected.length >= 2) return;

    const newSelected = [...selected, idx];
    setCards(prev => prev.map((c, i) => i === idx ? { ...c, flipped: true } : c));
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setMoves(m => m + 1);
      setBlocking(true);
      const [a, b] = newSelected;
      setTimeout(() => {
        const cardA = cards[a], cardB = cards[b];
        if (cardA.emoji === cardB.emoji) {
          setCards(prev => prev.map((c, i) => (i === a || i === b) ? { ...c, matched: true } : c));
          const newMatched = matched + 1;
          setMatched(newMatched);
          if (newMatched === 8) {
            clearInterval(timerRef.current);
            setDone(true);
            const score = Math.max(0, 2000 - moves * 30 - elapsed * 5);
            onFinish({
              gameId: 'memory-cards', gameName: 'Memory Card Flip', domain: 'Memory',
              score, accuracy: Math.round((8 / (moves + 1)) * 100),
              avgResponseMs: Math.round((Date.now() - startRef.current) / 16),
              correct: 8, wrong: moves - 7, maxCombo: 8,
              difficulty: 2, xpEarned: Math.floor(score / 20)
            });
          }
        } else {
          setCards(prev => prev.map((c, i) =>
            (i === a || i === b) && !c.matched ? { ...c, flipped: false } : c
          ));
          setLives(l => l - 1);
          if (lives <= 1) {
            clearInterval(timerRef.current);
            setDone(true);
            onFinish({
              gameId: 'memory-cards', gameName: 'Memory Card Flip', domain: 'Memory',
              score: matched * 100, accuracy: Math.round((matched / 8) * 100),
              avgResponseMs: 0, correct: matched, wrong: moves - matched,
              maxCombo: matched, difficulty: 2, xpEarned: matched * 5
            });
          }
        }
        setSelected([]);
        setBlocking(false);
      }, 700);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">{matched === 8 ? '🏆' : '🧠'}</div>
        <h2 className="text-2xl font-black text-white">{matched === 8 ? 'All Matched!' : `${matched}/8 Matched`}</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Moves', moves, 'text-cyan-400'], ['Time', `${elapsed}s`, 'text-purple-400'], ['Score', Math.max(0, matched * 250 - moves * 20), 'text-yellow-400']].map(([l,v,c]) => (
            <div key={l as string} className="glass-panel p-3 rounded-xl">
              <p className="text-xs text-gray-400">{l}</p>
              <p className={`text-xl font-black ${c}`}>{v}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">Moves: <span className="text-white font-bold">{moves}</span></span>
        <span className="text-gray-400">Pairs: <span className="text-green-400 font-bold">{matched}/8</span></span>
        <span className="text-gray-400">Lives: <span className="text-red-400 font-bold">{'❤️'.repeat(lives)}</span></span>
        <span className="text-gray-400 font-mono">{elapsed}s</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {cards.map((card, i) => (
          <motion.button key={card.id} onClick={() => flip(i)}
            whileTap={{ scale: 0.9 }}
            className="aspect-square rounded-xl text-3xl flex items-center justify-center border-2 font-bold transition-all cursor-pointer"
            style={{
              background: card.matched ? 'rgba(0,255,150,0.15)' : card.flipped ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.05)',
              borderColor: card.matched ? 'rgba(0,255,150,0.5)' : card.flipped ? 'rgba(0,229,255,0.5)' : 'rgba(255,255,255,0.1)',
            }}>
            {(card.flipped || card.matched) ? card.emoji : '?'}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
