import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
let bid = 0;

interface Bubble { id: number; value: number; isAnswer: boolean; x: number; y: number; speed: number; }
interface Problem { question: string; answer: number; }

function makeProblem(level: number): Problem {
  const ops = level < 4 ? ['+', '-'] : level < 8 ? ['+', '-', '×'] : ['+', '-', '×', '÷'];
  const op = ops[rnd(0, ops.length - 1)];
  let q = '', ans = 0;
  if (op === '+') { const a = rnd(2, 15 + level * 3), b = rnd(2, 15 + level * 3); q = `${a} + ${b}`; ans = a + b; }
  else if (op === '-') { const b = rnd(2, 20), a = b + rnd(2, 25); q = `${a} − ${b}`; ans = a - b; }
  else if (op === '×') { const a = rnd(2, 9), b = rnd(2, 9 + level); q = `${a} × ${b}`; ans = a * b; }
  else { const b = rnd(2, 9), a = b * rnd(2, 9); q = `${a} ÷ ${b}`; ans = a / b; }
  return { question: q, answer: ans };
}

function makeBubbles(answer: number, count: number): Bubble[] {
  const used = new Set([answer]);
  const vals = [answer];
  for (let i = 0; i < count - 1; i++) {
    let tries = 0;
    while (tries < 50) {
      const delta = rnd(1, Math.max(5, Math.ceil(answer * 0.3)));
      const v = Math.random() > 0.5 ? answer + delta : Math.max(1, answer - delta);
      if (!used.has(v)) { used.add(v); vals.push(v); break; }
      tries++;
    }
  }
  return vals.map(v => ({
    id: bid++, value: v, isAnswer: v === answer,
    x: rnd(10, 85), y: 110, speed: 0.025 + Math.random() * 0.015
  }));
}

export default function BubblePop({ onFinish }: Props) {
  const G = useRef({ lives: 3, score: 0, combo: 0, maxCombo: 0, correct: 0, wrong: 0, level: 1, done: false });
  const [problem, setProblem] = useState<Problem>(() => makeProblem(1));
  const [bubbles, setBubbles] = useState<Bubble[]>(() => makeBubbles(makeProblem(1).answer, 4));
  const [poppedId, setPoppedId] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  const frameRef = useRef<number>();
  const lastTime = useRef(performance.now());
  const problemRef = useRef(problem);
  const bubblesRef = useRef(bubbles);

  useEffect(() => { problemRef.current = problem; }, [problem]);
  useEffect(() => { bubblesRef.current = bubbles; }, [bubbles]);

  function startNewRound() {
    const p = makeProblem(G.current.level);
    const count = Math.min(4 + Math.floor(G.current.level / 3), 7);
    const newBubbles = makeBubbles(p.answer, count);
    setProblem(p);
    setBubbles(newBubbles);
    problemRef.current = p;
    bubblesRef.current = newBubbles;
  }

  function endGame() {
    if (G.current.done) return;
    G.current.done = true;
    cancelAnimationFrame(frameRef.current!);
    const total = G.current.correct + G.current.wrong;
    onFinish({
      gameId: 'bubble-pop', gameName: 'Bubble Pop Math', domain: 'Speed Math',
      score: G.current.score,
      accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0,
      avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong,
      maxCombo: G.current.maxCombo, difficulty: Math.min(3, Math.ceil(G.current.level / 4)) as 1 | 2 | 3,
      xpEarned: Math.floor(G.current.score / 5)
    });
    re();
  }

  useEffect(() => {
    const loop = (now: number) => {
      if (G.current.done) return;
      const dt = now - lastTime.current;
      lastTime.current = now;

      setBubbles(prev => {
        if (!prev.length) return prev;
        const moved = prev.map(b => ({ ...b, y: b.y - b.speed * dt }));
        const escaped = moved.filter(b => b.y < -15);
        if (escaped.some(b => b.isAnswer)) {
          G.current.combo = 0;
          G.current.lives -= 1;
          re();
          if (G.current.lives <= 0) { endGame(); return []; }
          setTimeout(startNewRound, 200);
          return [];
        }
        return moved.filter(b => b.y >= -15);
      });

      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current!);
  }, []);

  function popBubble(b: Bubble) {
    if (G.current.done) return;
    setPoppedId(b.id);
    setTimeout(() => setPoppedId(null), 300);

    if (b.isAnswer) {
      G.current.combo += 1;
      G.current.maxCombo = Math.max(G.current.maxCombo, G.current.combo);
      G.current.score += 10 * Math.min(G.current.combo, 5);
      G.current.correct += 1;
      if (G.current.correct % 5 === 0) G.current.level += 1;
    } else {
      G.current.combo = 0;
      G.current.wrong += 1;
      G.current.lives -= 1;
      if (G.current.lives <= 0) { endGame(); return; }
    }
    re();
    setBubbles([]);
    setTimeout(startNewRound, 300);
  }

  const g = G.current;
  if (g.done) {
    const total = g.correct + g.wrong;
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">🫧</div>
        <h2 className="text-2xl font-black text-white">Bubble Burst!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', g.score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round(g.correct / total * 100) : 0}%`, 'text-green-400'], ['Combo', `×${g.maxCombo}`, 'text-yellow-400']].map(([l, v, c]) => (
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
    <div className="flex flex-col gap-3 w-full">
      <div className="flex justify-between items-center">
        <div className="flex gap-1">{[0, 1, 2].map(i => <Heart key={i} className={`w-4 h-4 ${i < g.lives ? 'text-red-400 fill-red-400' : 'text-gray-700'}`} />)}</div>
        <div className="glass-panel px-4 py-2 rounded-xl text-center">
          <p className="text-xs text-gray-400">Solve</p>
          <p className="text-2xl font-black text-white">{problem.question} = ?</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-yellow-400">{g.score}</p>
          {g.combo > 1 && <p className="text-orange-400 text-xs font-bold">🔥×{g.combo}</p>}
        </div>
      </div>

      <div className="relative w-full rounded-2xl border border-white/10 overflow-hidden"
        style={{ height: 380, background: 'linear-gradient(180deg, #0a0520 0%, #050215 100%)' }}>
        {bubbles.map(b => {
          const isPopped = poppedId === b.id;
          const topPct = Math.max(0, Math.min(105, 110 - b.y - 15));
          return (
            <motion.button key={b.id}
              className="absolute rounded-full font-black text-xl flex items-center justify-center border-2 cursor-pointer"
              style={{
                width: 64, height: 64,
                left: `${b.x}%`, top: `${topPct}%`,
                transform: 'translate(-50%, -50%)',
                background: isPopped ? (b.isAnswer ? 'rgba(0,255,100,0.5)' : 'rgba(255,0,0,0.5)') : 'rgba(100,200,255,0.15)',
                borderColor: isPopped ? (b.isAnswer ? '#00ff64' : '#ff4444') : 'rgba(0,229,255,0.5)',
                boxShadow: '0 0 15px rgba(0,229,255,0.3)',
                color: '#fff',
              }}
              onClick={() => !isPopped && popBubble(b)}
              whileTap={{ scale: 0.6 }}
              animate={isPopped ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}>
              {b.value}
            </motion.button>
          );
        })}
        {bubbles.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500 text-sm animate-pulse">Loading next round...</p>
          </div>
        )}
      </div>
      <p className="text-center text-xs text-gray-500">Pop the bubble with the correct answer • Don't let it escape!</p>
    </div>
  );
}
