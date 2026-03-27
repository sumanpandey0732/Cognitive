import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

function genQ(level: number) {
  const ops = level < 3 ? ['+', '-'] : level < 6 ? ['+', '-', '×'] : ['+', '-', '×', '÷', 'sq'];
  const op = ops[rnd(0, ops.length - 1)];
  let q = '', ans = 0;
  if (op === '+') { const a = rnd(10, 20 + level * 10), b = rnd(10, 20 + level * 10); q = `${a} + ${b}`; ans = a + b; }
  else if (op === '-') { const b = rnd(5, 50); const a = b + rnd(5, 50); q = `${a} − ${b}`; ans = a - b; }
  else if (op === '×') { const a = rnd(3, 12), b = rnd(3, 12); q = `${a} × ${b}`; ans = a * b; }
  else if (op === '÷') { const b = rnd(2, 12); const a = b * rnd(1, 12); q = `${a} ÷ ${b}`; ans = a / b; }
  else { const n = rnd(2, 15); q = `${n}²`; ans = n * n; }
  const used = new Set([ans]);
  const wrongs: number[] = [];
  while (wrongs.length < 3) { const w = ans + (Math.random() > 0.5 ? 1 : -1) * rnd(1, Math.max(5, Math.floor(ans * 0.2))); if (!used.has(w) && w > 0) { used.add(w); wrongs.push(w); } }
  return { question: q, answer: ans, options: [ans, ...wrongs].sort(() => Math.random() - 0.5) };
}

export default function MathBlaster({ onFinish }: Props) {
  const TOTAL = 15;
  const [q, setQ] = useState(() => genQ(1));
  const [qNum, setQNum] = useState(1);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(8);
  const [flash, setFlash] = useState<'none'|'ok'|'bad'>('none');
  const [done, setDone] = useState(false);
  const [startMs] = useState(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const livesRef = useRef(3);

  const level = Math.min(8, Math.floor((qNum - 1) / 3) + 1);
  const maxTime = Math.max(4, 8 - Math.floor(level / 2));

  const finish = () => {
    clearInterval(timerRef.current);
    setDone(true);
    const total = correctRef.current + wrongRef.current;
    onFinish({
      gameId: 'math-blaster', gameName: 'Math Blaster', domain: 'Speed Math',
      score: scoreRef.current,
      accuracy: total > 0 ? Math.round((correctRef.current / total) * 100) : 0,
      avgResponseMs: Math.round((Date.now() - startMs) / Math.max(1, total)),
      correct: correctRef.current, wrong: wrongRef.current,
      maxCombo: maxComboRef.current, difficulty: Math.min(3, level) as 1|2|3,
      xpEarned: Math.floor(scoreRef.current / 5)
    });
  };

  const advance = (isCorrect: boolean) => {
    clearInterval(timerRef.current);
    if (isCorrect) {
      comboRef.current += 1; maxComboRef.current = Math.max(maxComboRef.current, comboRef.current);
      scoreRef.current += 10 * Math.min(comboRef.current, 5); correctRef.current += 1;
      setScore(scoreRef.current); setCorrect(correctRef.current);
      setCombo(comboRef.current); setMaxCombo(maxComboRef.current);
      setFlash('ok');
    } else {
      comboRef.current = 0; wrongRef.current += 1;
      livesRef.current -= 1; setWrong(wrongRef.current); setCombo(0);
      setLives(livesRef.current); setFlash('bad');
    }
    if (qNum >= TOTAL || livesRef.current <= 0) { setTimeout(finish, 400); return; }
    setTimeout(() => {
      setFlash('none'); setQ(genQ(level + 1)); setQNum(n => n + 1); setTimeLeft(maxTime);
    }, 400);
  };

  useEffect(() => {
    if (done) return;
    setTimeLeft(maxTime);
    timerRef.current = setInterval(() => setTimeLeft(t => { if (t <= 1) { advance(false); return 0; } return t - 1; }), 1000);
    return () => clearInterval(timerRef.current);
  }, [qNum, done]);

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">🚀</div>
        <h2 className="text-2xl font-black text-white">Math Blaster Done!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', scoreRef.current, 'text-cyan-400'], ['Accuracy', `${(correctRef.current + wrongRef.current) > 0 ? Math.round(correctRef.current/(correctRef.current+wrongRef.current)*100) : 0}%`, 'text-green-400'], ['Max Combo', `×${maxComboRef.current}`, 'text-yellow-400']].map(([l,v,c]) => (
            <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
      <div className="flex justify-between w-full text-sm items-center">
        <div className="flex gap-1">{[0,1,2].map(i => <Heart key={i} className={`w-4 h-4 ${i < lives ? 'text-red-400 fill-red-400' : 'text-gray-700'}`} />)}</div>
        <span className="text-gray-400">Q{qNum}/{TOTAL}</span>
        <span className="text-yellow-400 font-bold">{score} pts{combo > 1 && <span className="text-orange-400 text-xs ml-1">×{combo}</span>}</span>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full">
        <motion.div className={`h-1.5 rounded-full transition-all ${timeLeft <= 2 ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-500 to-purple-500'}`}
          animate={{ width: `${(timeLeft / maxTime) * 100}%` }} />
      </div>
      <motion.div key={qNum}
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className={`w-full glass-panel p-8 rounded-2xl text-center border-2 transition-all ${flash === 'ok' ? 'border-green-400 bg-green-500/10' : flash === 'bad' ? 'border-red-400 bg-red-500/10' : 'border-white/10'}`}>
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">Solve Fast!</p>
        <p className="text-5xl font-black text-white mb-1">{q.question}</p>
        <p className={`text-sm font-mono font-bold ${timeLeft <= 2 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>{timeLeft}s</p>
      </motion.div>
      <div className="grid grid-cols-2 gap-3 w-full">
        {q.options.map(opt => (
          <motion.button key={opt} onClick={() => advance(opt === q.answer)}
            whileTap={{ scale: 0.9 }}
            className="py-4 rounded-xl font-black text-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-cyan-500/50 transition-all">
            {opt}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
