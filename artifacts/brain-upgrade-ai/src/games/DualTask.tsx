import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const COLORS = ['🔴 RED', '🔵 BLUE', '🟢 GREEN', '🟡 YELLOW'];
const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

function makeMath() {
  const ops = ['+', '-', '×'];
  const op = ops[rnd(0, 2)];
  let q = '', ans = 0;
  if (op === '+') { const a = rnd(5, 30), b = rnd(5, 30); q = `${a} + ${b}`; ans = a + b; }
  else if (op === '-') { const b = rnd(5, 20), a = b + rnd(5, 20); q = `${a} − ${b}`; ans = a - b; }
  else { const a = rnd(2, 9), b = rnd(2, 9); q = `${a} × ${b}`; ans = a * b; }
  const wrongs = new Set<number>();
  while (wrongs.size < 3) {
    const d = rnd(1, Math.max(4, Math.ceil(ans * 0.2)));
    wrongs.add(ans + (Math.random() > 0.5 ? d : -d));
  }
  return { q, ans, opts: [...[...wrongs].slice(0, 3), ans].sort(() => Math.random() - 0.5) };
}

export default function DualTask({ onFinish }: Props) {
  const ROUNDS = 8;
  const G = useRef({ score: 0, correct: 0, wrong: 0, round: 0, done: false });
  const [math, setMath] = useState(() => makeMath());
  const [colorTarget] = useState(() => COLORS[rnd(0, 3)]);
  const [colorsShown, setColorsShown] = useState<string[]>([]);
  const [mathAnswered, setMathAnswered] = useState<boolean | null>(null);
  const [colorAnswered, setColorAnswered] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<'showing' | 'answering'>('showing');
  const [showIdx, setShowIdx] = useState(0);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);

  const colorTargetRef = useRef(colorTarget);
  const SHOW_COUNT = 4;

  useEffect(() => {
    // Show colors one by one
    const colors = Array.from({ length: SHOW_COUNT }, () => COLORS[rnd(0, 3)]);
    // Guarantee the target appears once
    colors[rnd(0, SHOW_COUNT - 1)] = colorTargetRef.current;
    setColorsShown(colors);

    let i = 0;
    const showTimer = setInterval(() => {
      setShowIdx(i);
      i++;
      if (i >= SHOW_COUNT) {
        clearInterval(showTimer);
        setTimeout(() => setPhase('answering'), 600);
      }
    }, 700);
    return () => clearInterval(showTimer);
  }, [G.current.round]);

  function finish() {
    G.current.done = true;
    const total = G.current.correct + G.current.wrong;
    onFinish({
      gameId: 'dual-task', gameName: 'Dual Task', domain: 'Multitask',
      score: G.current.score,
      accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0,
      avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong,
      maxCombo: 0, difficulty: 3,
      xpEarned: Math.floor(G.current.score / 5)
    });
    re();
  }

  function answerMath(choice: number) {
    if (mathAnswered !== null) return;
    const ok = choice === math.ans;
    setMathAnswered(ok);
    if (ok) G.current.score += 15; else G.current.wrong += 1;
    re();
    maybeNext(ok, colorAnswered);
  }

  function answerColor(choice: string) {
    if (colorAnswered !== null) return;
    const ok = choice === colorTargetRef.current;
    setColorAnswered(ok);
    if (ok) G.current.score += 15; else G.current.wrong += 1;
    re();
    maybeNext(mathAnswered, ok);
  }

  function maybeNext(mOk: boolean | null, cOk: boolean | null) {
    if (mOk === null || cOk === null) return;
    if (mOk && cOk) G.current.correct += 1;
    const next = G.current.round + 1;
    if (next >= ROUNDS) { setTimeout(finish, 600); }
    else {
      setTimeout(() => {
        G.current.round = next;
        setMath(makeMath());
        const colors = Array.from({ length: SHOW_COUNT }, () => COLORS[rnd(0, 3)]);
        colors[rnd(0, SHOW_COUNT - 1)] = colorTargetRef.current;
        setColorsShown(colors);
        setMathAnswered(null);
        setColorAnswered(null);
        setPhase('showing');
        setShowIdx(0);
        re();
      }, 700);
    }
  }

  const g = G.current;
  if (g.done) {
    const total = g.correct + g.wrong;
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">🧠</div>
        <h2 className="text-2xl font-black text-white">Dual Task Complete!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', g.score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round(g.correct / total * 100) : 0}%`, 'text-green-400'], ['Rounds', `${ROUNDS}/${ROUNDS}`, 'text-purple-400']].map(([l, v, c]) => (
            <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Round {g.round + 1}/{ROUNDS}</span>
        <span className="text-yellow-400 font-bold">{g.score}pts</span>
      </div>

      {/* Color task */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3 text-center">
          TASK 1 — Find color: <span className="text-yellow-400 font-bold">{colorTargetRef.current}</span>
        </p>
        {phase === 'showing' ? (
          <div className="flex justify-center gap-3 h-14 items-center">
            <motion.div key={showIdx}
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.2, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
              className="glass-panel px-5 py-3 rounded-xl font-black text-xl text-white border border-white/20">
              {colorsShown[showIdx] || '...'}
            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {COLORS.map(c => (
              <motion.button key={c} whileTap={{ scale: 0.88 }}
                onClick={() => answerColor(c)}
                disabled={colorAnswered !== null}
                className={`py-2 rounded-lg font-bold text-sm border transition-all ${
                  colorAnswered !== null
                    ? c === colorTargetRef.current ? 'border-green-400 bg-green-500/20 text-green-400' : 'border-white/5 bg-white/5 text-gray-500'
                    : 'border-white/15 bg-white/5 text-white hover:border-purple-400 hover:bg-purple-500/15'
                }`}>
                {c} {colorAnswered !== null && c === colorTargetRef.current && '✓'}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Math task */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3 text-center">TASK 2 — Solve: <span className="text-cyan-400 font-bold">{math.q} = ?</span></p>
        <div className="grid grid-cols-4 gap-2">
          {math.opts.map(opt => (
            <motion.button key={opt} whileTap={{ scale: 0.85 }}
              onClick={() => answerMath(opt)}
              disabled={mathAnswered !== null}
              className={`py-3 rounded-lg font-black text-lg border transition-all ${
                mathAnswered !== null
                  ? opt === math.ans ? 'border-green-400 bg-green-500/20 text-green-400' : 'border-white/5 bg-white/5 text-gray-500'
                  : 'border-white/15 bg-white/5 text-white hover:border-cyan-400 hover:bg-cyan-500/15'
              }`}>
              {opt}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
