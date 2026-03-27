import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

interface Cloud { id: number; eq: string; answer: number; options: number[]; x: number; y: number; speed: number; }

let cid = 0;
const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

function makeCloud(level: number): Cloud {
  const ops = level < 3 ? ['+', '-'] : level < 6 ? ['+', '-', '×'] : ['+', '-', '×', '÷'];
  const op = ops[rnd(0, ops.length - 1)];
  let eq = '', ans = 0;
  if (op === '+') { const a = rnd(2, 15 + level * 4), b = rnd(2, 15 + level * 4); eq = `${a} + ${b}`; ans = a + b; }
  else if (op === '-') { const b = rnd(2, 20), a = b + rnd(2, 20); eq = `${a} − ${b}`; ans = a - b; }
  else if (op === '×') { const a = rnd(2, 9), b = rnd(2, 9 + level); eq = `${a} × ${b}`; ans = a * b; }
  else { const b = rnd(2, 9), a = b * rnd(2, 9); eq = `${a} ÷ ${b}`; ans = a / b; }

  const wrongs = new Set<number>();
  while (wrongs.size < 3) {
    const delta = rnd(1, Math.max(5, Math.ceil(ans * 0.25)));
    wrongs.add(ans + delta);
    if (ans - delta > 0 && ans - delta !== ans) wrongs.add(ans - delta);
  }
  const opts = [...[...wrongs].slice(0, 3), ans].sort(() => Math.random() - 0.5);

  return { id: cid++, eq, answer: ans, options: opts, x: rnd(8, 72), y: -12, speed: 0.015 + level * 0.003 };
}

export default function FallingClouds({ onFinish }: Props) {
  // All mutable game state in a single ref — no stale closures
  const G = useRef({ lives: 3, score: 0, combo: 0, maxCombo: 0, correct: 0, wrong: 0, level: 1, done: false });
  const [clouds, setClouds] = useState<Cloud[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [flashId, setFlashId] = useState<{ id: number; ok: boolean } | null>(null);
  const [tick, setTick] = useState(0); // force re-render
  const re = () => setTick(t => t + 1);

  const frameRef = useRef<number>(0);
  const lastSpawnRef = useRef(0);
  const lastTime = useRef(performance.now());

  function endGame() {
    if (G.current.done) return;
    G.current.done = true;
    cancelAnimationFrame(frameRef.current);
    const total = G.current.correct + G.current.wrong;
    onFinish({
      gameId: 'falling-clouds', gameName: 'Falling Math Clouds', domain: 'Speed Math',
      score: G.current.score,
      accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0,
      avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong,
      maxCombo: G.current.maxCombo, difficulty: Math.min(3, G.current.level) as 1 | 2 | 3,
      xpEarned: Math.floor(G.current.score / 5)
    });
    re();
  }

  useEffect(() => {
    const spawnMs = () => Math.max(1200, 2600 - G.current.level * 180);

    const loop = (now: number) => {
      if (G.current.done) return;
      const dt = now - lastTime.current;
      lastTime.current = now;

      if (now - lastSpawnRef.current > spawnMs()) {
        lastSpawnRef.current = now;
        setClouds(prev => {
          const max = Math.min(2 + Math.floor(G.current.level / 2), 4);
          if (prev.length < max) return [...prev, makeCloud(G.current.level)];
          return prev;
        });
      }

      setClouds(prev => {
        const moved = prev.map(c => ({ ...c, y: c.y + c.speed * dt }));
        const fallen = moved.filter(c => c.y > 105);
        if (fallen.length) {
          G.current.combo = 0;
          G.current.lives -= fallen.length;
          if (G.current.lives <= 0) { endGame(); return []; }
          re();
        }
        return moved.filter(c => c.y <= 105);
      });

      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  function pickAnswer(cloud: Cloud, choice: number) {
    if (G.current.done) return;
    const ok = choice === cloud.answer;
    setFlashId({ id: cloud.id, ok });
    setTimeout(() => setFlashId(null), 400);
    setClouds(prev => prev.filter(c => c.id !== cloud.id));
    setSelectedId(null);

    if (ok) {
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
  }

  const g = G.current;
  if (g.done) {
    const total = g.correct + g.wrong;
    return (
      <div className="flex flex-col items-center gap-5 text-center py-8">
        <div className="text-6xl">☁️</div>
        <h2 className="text-3xl font-black text-white">Storm Cleared!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', g.score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round(g.correct / total * 100) : 0}%`, 'text-green-400'], ['Max Combo', `×${g.maxCombo}`, 'text-yellow-400']].map(([l, v, c]) => (
            <div key={l as string} className="glass-panel p-4 rounded-xl">
              <p className="text-xs text-gray-400">{l}</p>
              <p className={`text-2xl font-black ${c}`}>{v}</p>
            </div>
          ))}
        </div>
        <p className="text-gray-400 text-sm">+{Math.floor(g.score / 5)} XP earned</p>
      </div>
    );
  }

  const selCloud = clouds.find(c => c.id === selectedId);

  return (
    <div className="relative w-full select-none" style={{ height: 520 }}>
      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-3 py-2 z-20 bg-black/30">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => <Heart key={i} className={`w-5 h-5 ${i < g.lives ? 'text-red-400 fill-red-400' : 'text-gray-700'}`} />)}
        </div>
        <div className="text-white font-black text-lg">{g.score}{g.combo > 1 && <span className="text-yellow-400 text-sm ml-1">×{g.combo}</span>}</div>
        <div className="text-cyan-400 text-xs font-bold">LV.{g.level}</div>
      </div>

      {/* Sky */}
      <div className="absolute inset-0 overflow-hidden" style={{ top: 36, background: 'linear-gradient(180deg, #050520 0%, #0a0a30 100%)' }}>
        {/* Stars */}
        {[...Array(15)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{ left: `${(i * 7.3) % 100}%`, top: `${(i * 11.7) % 70}%` }} />
        ))}

        {/* Clouds */}
        {clouds.map(cloud => {
          const isSelected = cloud.id === selectedId;
          const isFlashing = flashId?.id === cloud.id;
          return (
            <motion.div key={cloud.id} className="absolute cursor-pointer"
              style={{ left: `${cloud.x}%`, top: `${cloud.y}%`, transform: 'translateX(-50%)' }}
              onClick={() => !isSelected && setSelectedId(cloud.id)}
              whileTap={{ scale: 0.95 }}>
              <div className={`relative px-5 py-3 rounded-3xl text-center border-2 transition-all shadow-xl ${
                isFlashing
                  ? (flashId!.ok ? 'bg-green-500/40 border-green-400' : 'bg-red-500/40 border-red-400')
                  : isSelected
                  ? 'bg-cyan-500/30 border-cyan-400 shadow-[0_0_25px_rgba(0,229,255,0.6)]'
                  : 'bg-white/15 border-white/30 hover:border-cyan-400/60'
              }`}>
                {/* Cloud bumps */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white/10 border-2 border-white/20" />
                <div className="absolute -top-2 left-1/4 w-5 h-5 rounded-full bg-white/10 border border-white/15" />
                <div className="absolute -top-2 right-1/4 w-6 h-6 rounded-full bg-white/10 border border-white/15" />
                <p className="text-white font-black text-xl relative z-10 leading-none">
                  {cloud.eq} = <span className={isSelected ? 'text-cyan-300' : 'text-yellow-300'}>?</span>
                </p>
              </div>
              {isFlashing && (
                <div className={`absolute inset-0 flex items-center justify-center text-3xl font-black ${flashId!.ok ? 'text-green-400' : 'text-red-400'}`}>
                  {flashId!.ok ? '✓' : '✗'}
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Answer Zone */}
        <div className="absolute bottom-0 left-0 right-0 pb-3 px-3">
          {selCloud ? (
            <AnimatePresence mode="wait">
              <motion.div key={selCloud.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-center text-xs text-cyan-400 font-bold tracking-widest uppercase mb-2">
                  Solving: {selCloud.eq} = ?
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {selCloud.options.map(opt => (
                    <motion.button key={opt}
                      onClick={() => pickAnswer(selCloud, opt)}
                      whileTap={{ scale: 0.88 }}
                      className="py-3 rounded-xl font-black text-xl bg-white/10 border border-white/25 text-white hover:bg-cyan-500/30 hover:border-cyan-400 transition-all">
                      {opt}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <p className="text-center text-gray-500 text-sm animate-pulse">
              {clouds.length > 0 ? '☝️ Tap a cloud to select it, then choose the answer' : '☁️ Clouds incoming...'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
