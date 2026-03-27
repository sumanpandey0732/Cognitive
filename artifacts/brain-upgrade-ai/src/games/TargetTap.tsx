import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

interface Target {
  id: number; x: number; y: number; size: number;
  vx: number; vy: number; value: number; color: string;
}

let tid = 0;
const COLORS = ['#00e5ff', '#a855f7', '#f97316', '#22c55e', '#eab308'];
const rnd = (a: number, b: number) => Math.random() * (b - a) + a;

function makeTarget(level: number): Target {
  const size = Math.max(40, 80 - level * 4);
  const speed = 0.5 + level * 0.3;
  return {
    id: tid++,
    x: rnd(size / 2, 100 - size / 2),
    y: rnd(size / 2, 100 - size / 2),
    size,
    vx: (Math.random() > 0.5 ? 1 : -1) * speed,
    vy: (Math.random() > 0.5 ? 1 : -1) * speed,
    value: 10 + level * 5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
}

export default function TargetTap({ onFinish }: Props) {
  const TOTAL_TAPS = 20;
  const [targets, setTargets] = useState<Target[]>([makeTarget(1)]);
  const [tapped, setTapped] = useState(0);
  const [missed, setMissed] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [level, setLevel] = useState(1);
  const [done, setDone] = useState(false);
  const [popEffect, setPopEffect] = useState<{id: number; x: number; y: number} | null>(null);
  const frameRef = useRef<number>();
  const lastTime = useRef(performance.now());
  const scoreRef = useRef(0);
  const tappedRef = useRef(0);
  const missedRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const livesRef = useRef(3);

  const endGame = () => {
    cancelAnimationFrame(frameRef.current!);
    setDone(true);
    const total = tappedRef.current + missedRef.current;
    onFinish({
      gameId: 'target-tap', gameName: 'Target Tap', domain: 'Speed',
      score: scoreRef.current, accuracy: total > 0 ? Math.round((tappedRef.current / total) * 100) : 0,
      avgResponseMs: 0, correct: tappedRef.current, wrong: missedRef.current,
      maxCombo: maxComboRef.current, difficulty: Math.min(3, level) as 1|2|3,
      xpEarned: Math.floor(scoreRef.current / 5)
    });
  };

  const tapTarget = (t: Target) => {
    setPopEffect({ id: t.id, x: t.x, y: t.y });
    setTimeout(() => setPopEffect(null), 300);
    comboRef.current += 1; maxComboRef.current = Math.max(maxComboRef.current, comboRef.current);
    const pts = t.value * Math.min(comboRef.current, 5);
    scoreRef.current += pts; tappedRef.current += 1;
    setScore(scoreRef.current); setTapped(tappedRef.current);
    setCombo(comboRef.current); setMaxCombo(maxComboRef.current);

    if (tappedRef.current >= TOTAL_TAPS) { endGame(); return; }
    if (tappedRef.current % 4 === 0) setLevel(l => l + 1);

    const newLevel = Math.floor(tappedRef.current / 4) + 1;
    setTargets(prev => [...prev.filter(x => x.id !== t.id), makeTarget(newLevel), ...(prev.length < 2 + Math.floor(newLevel / 3) ? [makeTarget(newLevel)] : [])]);
  };

  const missClick = () => {
    comboRef.current = 0; setCombo(0);
    missedRef.current += 1; setMissed(missedRef.current);
    livesRef.current -= 1; setLives(livesRef.current);
    if (livesRef.current <= 0) endGame();
  };

  useEffect(() => {
    if (done) return;
    const loop = (now: number) => {
      const dt = now - lastTime.current; lastTime.current = now;
      setTargets(prev => prev.map(t => {
        let { x, y, vx, vy } = t;
        x += vx * dt * 0.05; y += vy * dt * 0.05;
        if (x < t.size / 2 || x > 100 - t.size / 2) vx *= -1;
        if (y < t.size / 2 || y > 100 - t.size / 2) vy *= -1;
        return { ...t, x: Math.max(t.size / 2, Math.min(100 - t.size / 2, x)), y: Math.max(t.size / 2, Math.min(100 - t.size / 2, y)), vx, vy };
      }));
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current!);
  }, [done]);

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">🎯</div>
        <h2 className="text-2xl font-black text-white">Mission Complete!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', scoreRef.current, 'text-cyan-400'], ['Hits', `${tappedRef.current}/${TOTAL_TAPS}`, 'text-green-400'], ['Combo', `×${maxComboRef.current}`, 'text-yellow-400']].map(([l,v,c]) => (
            <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between text-sm items-center">
        <div className="flex gap-1">{[0,1,2].map(i => <Heart key={i} className={`w-4 h-4 ${i < lives ? 'text-red-400 fill-red-400' : 'text-gray-700'}`} />)}</div>
        <div><span className="text-gray-400">Progress: </span><span className="text-cyan-400 font-bold">{tapped}/{TOTAL_TAPS}</span></div>
        <div><span className="text-yellow-400 font-bold">{score}</span>{combo > 1 && <span className="text-orange-400 text-xs ml-1">×{combo}</span>}</div>
      </div>
      <div className="w-full h-2 bg-white/5 rounded-full">
        <motion.div className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
          animate={{ width: `${(tapped / TOTAL_TAPS) * 100}%` }} />
      </div>
      <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 cursor-crosshair"
        style={{ height: 380, background: 'rgba(0,5,20,0.9)' }}
        onClick={missClick}>
        {targets.map(t => (
          <motion.button key={t.id}
            className="absolute rounded-full border-2 flex items-center justify-center font-black cursor-pointer select-none"
            style={{
              left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%,-50%)',
              width: t.size, height: t.size,
              background: `${t.color}22`, borderColor: t.color,
              boxShadow: `0 0 ${t.size * 0.4}px ${t.color}66`,
              color: t.color, fontSize: t.size * 0.25,
            }}
            onClick={e => { e.stopPropagation(); tapTarget(t); }}
            whileTap={{ scale: 0.6 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}>
            🎯
          </motion.button>
        ))}
        {popEffect && (
          <motion.div className="absolute text-2xl pointer-events-none"
            style={{ left: `${popEffect.x}%`, top: `${popEffect.y}%`, transform: 'translate(-50%,-50%)' }}
            initial={{ scale: 0.5, opacity: 1 }} animate={{ scale: 2, opacity: 0 }} transition={{ duration: 0.3 }}>
            💥
          </motion.div>
        )}
      </div>
      <p className="text-center text-xs text-gray-500">Tap the targets • Don't miss!</p>
    </div>
  );
}
