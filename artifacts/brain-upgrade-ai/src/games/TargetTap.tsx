import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const COLORS = ['#00e5ff', '#a855f7', '#f97316', '#22c55e', '#eab308', '#ef4444'];
let tid2 = 0;

interface Target { id: number; x: number; y: number; size: number; vx: number; vy: number; color: string; points: number; }

function makeTarget(level: number): Target {
  const size = Math.max(44, 80 - level * 4);
  const speed = 0.06 + level * 0.025;
  const angle = Math.random() * Math.PI * 2;
  return {
    id: tid2++, color: COLORS[Math.floor(Math.random() * COLORS.length)],
    x: 15 + Math.random() * 70, y: 15 + Math.random() * 70,
    size, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    points: 10 + level * 5,
  };
}

export default function TargetTap({ onFinish }: Props) {
  const TOTAL = 20;
  const G = useRef({ lives: 3, score: 0, combo: 0, maxCombo: 0, hits: 0, misses: 0, level: 1, done: false });
  const [targets, setTargets] = useState<Target[]>([makeTarget(1)]);
  const [pops, setPops] = useState<{ id: number; x: number; y: number }[]>([]);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  const frameRef = useRef<number>();
  const lastTime = useRef(performance.now());

  function endGame() {
    if (G.current.done) return;
    G.current.done = true;
    cancelAnimationFrame(frameRef.current!);
    const total = G.current.hits + G.current.misses;
    onFinish({
      gameId: 'target-tap', gameName: 'Target Tap', domain: 'Speed',
      score: G.current.score,
      accuracy: total > 0 ? Math.round(G.current.hits / total * 100) : 0,
      avgResponseMs: 0, correct: G.current.hits, wrong: G.current.misses,
      maxCombo: G.current.maxCombo, difficulty: Math.min(3, G.current.level) as 1 | 2 | 3,
      xpEarned: Math.floor(G.current.score / 5)
    });
    re();
  }

  useEffect(() => {
    const loop = (now: number) => {
      if (G.current.done) return;
      const dt = now - lastTime.current;
      lastTime.current = now;
      setTargets(prev => prev.map(t => {
        let { x, y, vx, vy } = t;
        x += vx * dt; y += vy * dt;
        if (x < t.size / 2 / 10) { x = t.size / 2 / 10; vx = Math.abs(vx); }
        if (x > 100 - t.size / 2 / 10) { x = 100 - t.size / 2 / 10; vx = -Math.abs(vx); }
        if (y < t.size / 2 / 10) { y = t.size / 2 / 10; vy = Math.abs(vy); }
        if (y > 100 - t.size / 2 / 10) { y = 100 - t.size / 2 / 10; vy = -Math.abs(vy); }
        return { ...t, x, y, vx, vy };
      }));
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current!);
  }, []);

  function hitTarget(t: Target) {
    if (G.current.done) return;
    setPops(p => [...p, { id: t.id, x: t.x, y: t.y }]);
    setTimeout(() => setPops(p => p.filter(x => x.id !== t.id)), 400);

    G.current.combo += 1;
    G.current.maxCombo = Math.max(G.current.maxCombo, G.current.combo);
    G.current.score += t.points * Math.min(G.current.combo, 5);
    G.current.hits += 1;
    if (G.current.hits % 4 === 0) G.current.level += 1;
    re();

    if (G.current.hits >= TOTAL) { endGame(); return; }

    const lvl = G.current.level;
    setTargets(prev => {
      const remaining = prev.filter(x => x.id !== t.id);
      const desired = Math.min(1 + Math.floor(lvl / 3), 3);
      const toAdd = desired - remaining.length + 1;
      const newOnes = Array.from({ length: Math.max(1, toAdd) }, () => makeTarget(lvl));
      return [...remaining, ...newOnes];
    });
  }

  function missClick() {
    if (G.current.done) return;
    G.current.combo = 0;
    G.current.misses += 1;
    G.current.lives -= 1;
    re();
    if (G.current.lives <= 0) endGame();
  }

  const g = G.current;
  if (g.done) {
    const total = g.hits + g.misses;
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">🎯</div>
        <h2 className="text-2xl font-black text-white">Mission Complete!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', g.score, 'text-cyan-400'], ['Hits', `${g.hits}/${TOTAL}`, 'text-green-400'], ['Combo', `×${g.maxCombo}`, 'text-yellow-400']].map(([l, v, c]) => (
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
    <div className="flex flex-col gap-3">
      <div className="flex justify-between text-sm items-center">
        <div className="flex gap-1">{[0,1,2].map(i => <Heart key={i} className={`w-4 h-4 ${i < g.lives ? 'text-red-400 fill-red-400' : 'text-gray-700'}`} />)}</div>
        <span className="text-cyan-400 font-bold">{g.hits}/{TOTAL}</span>
        <span className="text-yellow-400 font-bold">{g.score}{g.combo > 1 && <span className="text-orange-400 text-xs ml-1">×{g.combo}</span>}</span>
      </div>
      <div className="w-full h-2 bg-white/5 rounded-full">
        <motion.div className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
          animate={{ width: `${(g.hits / TOTAL) * 100}%` }} />
      </div>
      <div className="relative w-full rounded-2xl border border-white/10 cursor-crosshair overflow-hidden"
        style={{ height: 380, background: 'rgba(0,5,20,0.95)' }}
        onClick={missClick}>
        {targets.map(t => (
          <motion.button key={t.id}
            className="absolute rounded-full flex items-center justify-center font-black text-2xl cursor-pointer border-2"
            style={{
              left: `${t.x}%`, top: `${t.y}%`,
              width: t.size, height: t.size,
              transform: 'translate(-50%,-50%)',
              background: `${t.color}22`, borderColor: t.color,
              boxShadow: `0 0 ${t.size * 0.5}px ${t.color}55`,
            }}
            onClick={e => { e.stopPropagation(); hitTarget(t); }}
            whileTap={{ scale: 0.5 }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 0.9 }}>
            🎯
          </motion.button>
        ))}
        {pops.map(p => (
          <motion.div key={p.id} className="absolute pointer-events-none text-2xl"
            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%,-50%)' }}
            initial={{ scale: 0.5, opacity: 1 }} animate={{ scale: 2.5, opacity: 0 }} transition={{ duration: 0.4 }}>
            💥
          </motion.div>
        ))}
      </div>
      <p className="text-center text-xs text-gray-500">Click targets • Avoid background clicks</p>
    </div>
  );
}
