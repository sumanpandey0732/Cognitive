import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

interface Bubble {
  id: number; value: number; x: number; speed: number; isAnswer: boolean;
}

let bid = 0;
const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

function makeProblem(level: number) {
  const ops = level < 4 ? ['+', '-'] : level < 8 ? ['+', '-', '×'] : ['+', '-', '×', '÷'];
  const op = ops[rnd(0, ops.length - 1)];
  let q = '', ans = 0;
  if (op === '+') { const a = rnd(1, 20 + level * 3), b = rnd(1, 20 + level * 3); q = `${a} + ${b}`; ans = a + b; }
  else if (op === '-') { const b = rnd(1, 20), a = b + rnd(1, 20); q = `${a} - ${b}`; ans = a - b; }
  else if (op === '×') { const a = rnd(2, 9), b = rnd(2, 12); q = `${a} × ${b}`; ans = a * b; }
  else { const b = rnd(2, 12), a = b * rnd(1, 10); q = `${a} ÷ ${b}`; ans = a / b; }
  return { question: q, answer: ans };
}

function generateBubbles(answer: number, count: number): Bubble[] {
  const used = new Set([answer]);
  const bubbles: number[] = [answer];
  while (bubbles.length < count) {
    const w = answer + (Math.random() > 0.5 ? 1 : -1) * rnd(1, Math.max(3, Math.floor(answer * 0.3)));
    if (w > 0 && !used.has(w)) { used.add(w); bubbles.push(w); }
  }
  return bubbles.sort(() => Math.random() - 0.5).map(v => ({
    id: bid++, value: v, x: rnd(8, 85), speed: 0.3 + Math.random() * 0.3, isAnswer: v === answer
  }));
}

export default function BubblePop({ onFinish }: Props) {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [problem, setProblem] = useState(() => makeProblem(1));
  const [bubbles, setBubbles] = useState<(Bubble & {y: number})[]>(() =>
    generateBubbles(makeProblem(1).answer, 4).map(b => ({ ...b, y: 105 }))
  );
  const [done, setDone] = useState(false);
  const [popped, setPopped] = useState<number | null>(null);
  const frameRef = useRef<number>();
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const livesRef = useRef(3);

  const newRound = useCallback((lvl: number) => {
    const p = makeProblem(lvl);
    const count = Math.min(4 + Math.floor(lvl / 3), 7);
    setProblem(p);
    setBubbles(generateBubbles(p.answer, count).map(b => ({ ...b, y: 105 })));
  }, []);

  const endGame = useCallback(() => {
    cancelAnimationFrame(frameRef.current!);
    setDone(true);
    const total = correctRef.current + wrongRef.current;
    onFinish({
      gameId: 'bubble-pop', gameName: 'Bubble Pop Math', domain: 'Speed Math',
      score: scoreRef.current, accuracy: total > 0 ? Math.round((correctRef.current / total) * 100) : 0,
      avgResponseMs: 0, correct: correctRef.current, wrong: wrongRef.current,
      maxCombo: maxComboRef.current, difficulty: Math.min(3, Math.ceil(level / 4)) as 1|2|3,
      xpEarned: Math.floor(scoreRef.current / 5)
    });
  }, [level, onFinish]);

  useEffect(() => {
    if (done) return;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = now - last; last = now;
      setBubbles(prev => {
        const updated = prev.map(b => ({ ...b, y: b.y - b.speed * dt * 0.05 }));
        const escaped = updated.filter(b => b.y < -10);
        if (escaped.some(b => b.isAnswer)) {
          comboRef.current = 0; setCombo(0);
          const newLives = livesRef.current - 1;
          livesRef.current = newLives;
          setLives(newLives);
          if (newLives <= 0) { endGame(); return []; }
          setTimeout(() => newRound(level), 200);
          return [];
        }
        return updated.filter(b => b.y >= -10);
      });
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current!);
  }, [done, level, newRound, endGame]);

  const pop = (bubble: Bubble & {y: number}) => {
    if (done) return;
    setPopped(bubble.id);
    setTimeout(() => setPopped(null), 300);

    if (bubble.isAnswer) {
      comboRef.current += 1; maxComboRef.current = Math.max(maxComboRef.current, comboRef.current);
      setCombo(comboRef.current); setMaxCombo(maxComboRef.current);
      const pts = 10 * Math.min(comboRef.current, 5);
      scoreRef.current += pts; correctRef.current += 1;
      setScore(scoreRef.current); setCorrect(correctRef.current);
      if (correctRef.current % 5 === 0) setLevel(l => { const nl = l + 1; newRound(nl); return nl; });
      else newRound(level);
    } else {
      comboRef.current = 0; setCombo(0);
      wrongRef.current += 1; setWrong(wrongRef.current);
      const nl = livesRef.current - 1; livesRef.current = nl; setLives(nl);
      if (nl <= 0) endGame();
    }
    setBubbles([]);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">🫧</div>
        <h2 className="text-2xl font-black text-white">Bubble Burst!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', scoreRef.current, 'text-cyan-400'], ['Accuracy', `${(correct + wrong) > 0 ? Math.round(correct/(correct+wrong)*100) : 0}%`, 'text-green-400'], ['Combo', `×${maxCombo}`, 'text-yellow-400']].map(([l,v,c]) => (
            <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex justify-between items-center">
        <div className="flex gap-1">{[0,1,2].map(i => <Heart key={i} className={`w-4 h-4 ${i < lives ? 'text-red-400 fill-red-400' : 'text-gray-700'}`} />)}</div>
        <div className="glass-panel px-4 py-2 rounded-xl text-center">
          <p className="text-xs text-gray-400">Solve</p>
          <p className="text-2xl font-black text-white">{problem.question} = ?</p>
        </div>
        <div className="text-right"><p className="text-xs text-gray-400">Score</p><p className="text-lg font-black text-yellow-400">{score}</p></div>
      </div>
      {combo > 1 && <div className="text-center text-xs text-yellow-400 font-bold">🔥 COMBO ×{combo}</div>}
      <div className="relative rounded-2xl overflow-hidden border border-white/10" style={{ height: 380, background: 'rgba(0,5,20,0.8)' }}>
        {bubbles.map(b => (
          <AnimatePresence key={b.id}>
            <motion.button className="absolute w-16 h-16 rounded-full font-black text-xl flex items-center justify-center cursor-pointer border-2 shadow-lg"
              style={{
                left: `${b.x}%`, bottom: `${b.y - 105}%`, transform: 'translateX(-50%)',
                background: popped === b.id ? (b.isAnswer ? 'rgba(0,255,100,0.5)' : 'rgba(255,0,0,0.5)') : 'rgba(100,200,255,0.2)',
                borderColor: 'rgba(0,229,255,0.5)',
                boxShadow: '0 0 15px rgba(0,229,255,0.3)',
              }}
              onClick={() => pop(b)}
              whileTap={{ scale: 0.7 }}
              animate={popped === b.id ? { scale: 0 } : {}}>
              {b.value}
            </motion.button>
          </AnimatePresence>
        ))}
        {bubbles.length === 0 && !done && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500 animate-pulse">Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
}
