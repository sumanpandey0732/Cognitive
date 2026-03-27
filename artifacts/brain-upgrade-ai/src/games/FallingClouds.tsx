import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Zap, TrendingUp } from 'lucide-react';
import { GameSession } from '@/context/AppContext';

interface Cloud {
  id: number; question: string; answer: number; wrongAnswers: number[];
  x: number; y: number; speed: number; type: string;
}

interface Props {
  onFinish: (session: Partial<GameSession>) => void;
}

let cloudIdCounter = 0;

function generateMathQuestion(level: number): Cloud {
  const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

  let q = '', ans = 0, type = '';

  const ops = level < 3 ? ['add', 'sub'] : level < 6 ? ['add', 'sub', 'mul'] : ['add', 'sub', 'mul', 'div', 'sq'];
  const op = ops[rnd(0, ops.length - 1)];

  if (op === 'add') {
    const a = rnd(1, 10 + level * 5), b = rnd(1, 10 + level * 5);
    q = `${a} + ${b}`; ans = a + b; type = 'addition';
  } else if (op === 'sub') {
    const b = rnd(1, 15 + level * 3), a = b + rnd(1, 20);
    q = `${a} − ${b}`; ans = a - b; type = 'subtraction';
  } else if (op === 'mul') {
    const a = rnd(2, 5 + level), b = rnd(2, 12);
    q = `${a} × ${b}`; ans = a * b; type = 'multiplication';
  } else if (op === 'div') {
    const b = rnd(2, 12), a = b * rnd(1, 10);
    q = `${a} ÷ ${b}`; ans = a / b; type = 'division';
  } else {
    const n = rnd(2, 10 + level);
    q = `${n}²`; ans = n * n; type = 'squares';
  }

  const wrongs = new Set<number>();
  const offsets = shuffle([1, 2, 3, 5, 7, 10, 11, 13]);
  offsets.forEach(o => { if (wrongs.size < 3) { wrongs.add(ans + o); wrongs.add(Math.max(0, ans - o)); } });
  const wrongArr = [...wrongs].filter(w => w !== ans).slice(0, 3);

  return {
    id: cloudIdCounter++, question: q, answer: ans,
    wrongAnswers: wrongArr, x: rnd(5, 75), y: -15,
    speed: 0.12 + level * 0.018 + Math.random() * 0.05,
    type,
  };
}

export default function FallingClouds({ onFinish }: Props) {
  const [phase, setPhase] = useState<'playing' | 'paused'>('playing');
  const [clouds, setClouds] = useState<Cloud[]>([]);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [selectedCloud, setSelectedCloud] = useState<Cloud | null>(null);
  const [feedback, setFeedback] = useState<{id: number; correct: boolean; x: number; y: number} | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const frameRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  const startTimeRef = useRef(Date.now());
  const livesRef = useRef(3);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const combRef = useRef(0);
  const maxCombRef = useRef(0);

  const spawnInterval = Math.max(1400, 2800 - level * 200);

  const endGame = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    setGameOver(true);
    const totalQ = correctRef.current + wrongRef.current;
    onFinish({
      gameId: 'falling-clouds', gameName: 'Falling Math Clouds', domain: 'Speed Math',
      score: scoreRef.current, accuracy: totalQ > 0 ? Math.round((correctRef.current / totalQ) * 100) : 0,
      avgResponseMs: 0, correct: correctRef.current, wrong: wrongRef.current,
      maxCombo: maxCombRef.current, difficulty: level, xpEarned: Math.floor(scoreRef.current / 5)
    });
  }, [level, onFinish]);

  const handleAnswerSelect = useCallback((cloud: Cloud, chosen: number) => {
    if (!selectedCloud || selectedCloud.id !== cloud.id) return;
    const isCorrect = chosen === cloud.answer;
    setFeedback({ id: cloud.id, correct: isCorrect, x: cloud.x, y: cloud.y });
    setTimeout(() => setFeedback(null), 500);
    setClouds(prev => prev.filter(c => c.id !== cloud.id));
    setSelectedCloud(null);

    if (isCorrect) {
      const newCombo = combRef.current + 1;
      combRef.current = newCombo;
      maxCombRef.current = Math.max(maxCombRef.current, newCombo);
      setCombo(newCombo);
      setMaxCombo(maxCombRef.current);
      const pts = 10 * Math.min(newCombo, 5);
      scoreRef.current += pts;
      correctRef.current += 1;
      setScore(scoreRef.current);
      setCorrect(correctRef.current);
      if (correctRef.current % 5 === 0) setLevel(l => l + 1);
    } else {
      combRef.current = 0;
      setCombo(0);
      wrongRef.current += 1;
      setWrong(wrongRef.current);
      const newLives = livesRef.current - 1;
      livesRef.current = newLives;
      setLives(newLives);
      if (newLives <= 0) endGame();
    }
  }, [selectedCloud, endGame]);

  // Game loop
  useEffect(() => {
    if (gameOver) return;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));

      // Spawn new clouds
      if (now - lastSpawnRef.current > spawnInterval) {
        lastSpawnRef.current = now;
        const maxOnScreen = Math.min(3 + Math.floor(level / 2), 5);
        setClouds(prev => {
          if (prev.length < maxOnScreen) return [...prev, generateMathQuestion(level)];
          return prev;
        });
      }

      // Move clouds down
      setClouds(prev => {
        const updated = prev.map(c => ({ ...c, y: c.y + c.speed * dt * 0.1 }));
        const passed = updated.filter(c => c.y > 105);
        if (passed.length > 0) {
          combRef.current = 0;
          setCombo(0);
          const newLives = livesRef.current - passed.length;
          livesRef.current = Math.max(0, newLives);
          setLives(livesRef.current);
          if (livesRef.current <= 0) { endGame(); return []; }
        }
        return updated.filter(c => c.y <= 105);
      });

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [gameOver, level, spawnInterval, endGame]);

  if (gameOver) {
    const total = correct + wrong;
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-center py-8">
        <div className="text-6xl mb-2">☁️</div>
        <h2 className="text-3xl font-black text-white">Storm Cleared!</h2>
        <div className="grid grid-cols-3 gap-3 mt-2">
          {[['Score', score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round((correct/total)*100) : 0}%`, 'text-green-400'], ['Max Combo', `x${maxCombo}`, 'text-yellow-400']].map(([l, v, c]) => (
            <div key={l as string} className="glass-panel p-4 rounded-xl text-center">
              <p className="text-xs text-gray-400 mb-1">{l}</p>
              <p className={`text-2xl font-black ${c}`}>{v}</p>
            </div>
          ))}
        </div>
        <p className="text-gray-400 text-sm">+{Math.floor(score / 5)} XP earned</p>
      </div>
    );
  }

  const options = selectedCloud
    ? [selectedCloud.answer, ...selectedCloud.wrongAnswers].sort(() => Math.random() - 0.5)
    : [];

  return (
    <div className="relative w-full select-none" style={{ height: '520px' }}>
      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-2 py-1 z-20">
        <div className="flex gap-1">
          {[0,1,2].map(i => (
            <Heart key={i} className={`w-5 h-5 ${i < lives ? 'text-red-400 fill-red-400' : 'text-gray-700'}`} />
          ))}
        </div>
        <div className="glass-panel px-3 py-1 rounded-full text-sm flex items-center gap-2">
          <TrendingUp className="w-3 h-3 text-cyan-400" /> <span className="font-bold text-white">{score}</span>
          {combo > 1 && <span className="text-yellow-400 font-black text-xs">×{combo}</span>}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Zap className="w-3 h-3 text-yellow-400" /> Lv.{level}
        </div>
      </div>

      {/* Sky area */}
      <div className="absolute inset-0 overflow-hidden" style={{ top: 28 }}>
        {/* Clouds */}
        {clouds.map(cloud => (
          <motion.div key={cloud.id} className="absolute cursor-pointer"
            style={{ left: `${cloud.x}%`, top: `${cloud.y}%`, transform: 'translateX(-50%)' }}
            onClick={() => setSelectedCloud(cloud)}
            whileHover={{ scale: 1.05 }}
            animate={{ scale: selectedCloud?.id === cloud.id ? 1.1 : 1 }}>
            <div className={`relative px-5 py-3 rounded-2xl text-center shadow-lg transition-all border-2 ${
              selectedCloud?.id === cloud.id
                ? 'bg-cyan-500/30 border-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.5)]'
                : 'bg-white/10 border-white/20 hover:border-cyan-500/50'
            }`}>
              {/* Cloud bumps */}
              <div className="absolute -top-2 left-1/4 w-6 h-6 bg-inherit rounded-full border-2 border-inherit" style={{ borderColor: 'inherit' }} />
              <div className="absolute -top-3 left-1/2 w-8 h-8 bg-inherit rounded-full" style={{ background: 'inherit' }} />
              <div className="absolute -top-2 right-1/4 w-5 h-5 bg-inherit rounded-full" />
              <p className="text-white font-black text-xl relative z-10">{cloud.question} = ?</p>
            </div>
            {/* Feedback flash */}
            {feedback?.id === cloud.id && (
              <div className={`absolute inset-0 rounded-2xl flex items-center justify-center text-2xl font-black ${feedback.correct ? 'text-green-400' : 'text-red-400'}`}>
                {feedback.correct ? '✓' : '✗'}
              </div>
            )}
          </motion.div>
        ))}

        {/* Ground / answer zone */}
        <div className="absolute bottom-0 left-0 right-0 pb-2 flex flex-col items-center gap-2">
          {selectedCloud ? (
            <AnimatePresence>
              <motion.div key="options" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="w-full px-4">
                <p className="text-center text-xs text-cyan-400 mb-2 font-bold tracking-widest uppercase">
                  Solving: {selectedCloud.question} = ?
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {options.map(opt => (
                    <motion.button key={opt} whileTap={{ scale: 0.92 }}
                      onClick={() => handleAnswerSelect(selectedCloud, opt)}
                      className="py-3 rounded-xl font-black text-xl bg-white/10 border border-white/20 text-white hover:bg-cyan-500/20 hover:border-cyan-400 transition-all shadow-md">
                      {opt}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <p className="text-gray-500 text-sm animate-pulse">
              {clouds.length > 0 ? '☝️ Tap a cloud to answer' : 'Clouds incoming...'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
