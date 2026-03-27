import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameSession } from '@/context/AppContext';

interface Props { onFinish: (s: Partial<GameSession>) => void; }

const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

function genMath() {
  const ops = ['+', '-', '×'];
  const op = ops[rnd(0, 2)];
  let a: number, b: number, ans: number;
  if (op === '+') { a = rnd(5, 50); b = rnd(5, 50); ans = a + b; }
  else if (op === '-') { b = rnd(1, 30); a = rnd(b, 60); ans = a - b; }
  else { a = rnd(2, 12); b = rnd(2, 12); ans = a * b; }
  const wrongs = new Set<number>();
  [1,2,3,5].forEach(o => { wrongs.add(ans + o); wrongs.add(Math.max(0, ans - o)); });
  const opts = [...wrongs].filter(w => w !== ans).slice(0, 3);
  return { question: `${a} ${op} ${b} = ?`, answer: ans, options: [ans, ...opts].sort(() => Math.random() - 0.5) };
}

const COLORS = ['🔴','🔵','🟢','🟡','🟣'];
function genColorSeq(len: number) {
  return Array.from({ length: len }, () => COLORS[rnd(0, COLORS.length - 1)]);
}

export default function DualTask({ onFinish }: Props) {
  const ROUNDS = 8;
  const [round, setRound] = useState(0);
  const [math, setMath] = useState(genMath);
  const [colorSeq] = useState(() => genColorSeq(3));
  const [colorInput, setColorInput] = useState<string[]>([]);
  const [mathDone, setMathDone] = useState(false);
  const [colorDone, setColorDone] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'show-color' | 'play'>('show-color');
  const [showSeq, setShowSeq] = useState(true);
  const [timeLeft, setTimeLeft] = useState(15);
  const [feedback, setFeedback] = useState<{math: boolean|null; color: boolean|null}>({ math: null, color: null });
  const [done, setDone] = useState(false);
  const [currentColorSeq, setCurrentColorSeq] = useState(colorSeq);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const t = setTimeout(() => { setShowSeq(false); setPhase('play'); }, 2500);
    return () => clearTimeout(t);
  }, [round]);

  useEffect(() => {
    if (phase !== 'play' || done) return;
    setTimeLeft(15);
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) { clearInterval(timerRef.current); advanceRound(false, false); return 0; }
      return t - 1;
    }), 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, done]);

  const advanceRound = (mathOk: boolean, colorOk: boolean) => {
    clearInterval(timerRef.current);
    const pts = (mathOk ? 15 : 0) + (colorOk ? 15 : 0) + (mathOk && colorOk ? 20 : 0);
    setScore(s => s + pts);
    setFeedback({ math: mathOk, color: colorOk });
    if (mathOk || colorOk) setCorrect(c => c + 1);
    if (!mathOk || !colorOk) setWrong(w => w + 1);

    setTimeout(() => {
      setFeedback({ math: null, color: null });
      if (round + 1 >= ROUNDS) {
        setDone(true);
        onFinish({
          gameId: 'dual-task', gameName: 'Dual Task', domain: 'Multitask',
          score: score + pts, accuracy: Math.round(((correct + (mathOk || colorOk ? 1 : 0)) / ROUNDS) * 100),
          avgResponseMs: 0, correct: correct + (mathOk || colorOk ? 1 : 0), wrong: wrong + (!mathOk || !colorOk ? 1 : 0),
          maxCombo: correct, difficulty: 3, xpEarned: Math.floor((score + pts) / 5)
        });
        return;
      }
      const newSeq = genColorSeq(3 + Math.floor((round + 1) / 3));
      setCurrentColorSeq(newSeq); setColorInput([]); setMath(genMath());
      setMathDone(false); setColorDone(false); setShowSeq(true); setPhase('show-color');
      setRound(r => r + 1);
    }, 1000);
  };

  const pickMath = (opt: number) => {
    if (mathDone) return;
    setMathDone(true);
    const ok = opt === math.answer;
    if (colorDone) advanceRound(ok, colorInput.join('') === currentColorSeq.join(''));
  };

  const pickColor = (c: string) => {
    if (colorDone) return;
    const newInput = [...colorInput, c];
    setColorInput(newInput);
    if (newInput.length === currentColorSeq.length) {
      setColorDone(true);
      const ok = newInput.join('') === currentColorSeq.join('');
      if (mathDone) advanceRound(math.answer === (mathDone ? math.answer : -1), ok);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="text-5xl">🧠⚡</div>
        <h2 className="text-2xl font-black text-white">Dual Task Complete!</h2>
        <div className="grid grid-cols-3 gap-3">
          {[['Score', score, 'text-cyan-400'], ['Rounds', `${correct}/${ROUNDS}`, 'text-green-400'], ['Difficulty', '🔥🔥🔥', 'text-orange-400']].map(([l,v,c]) => (
            <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">Round <span className="text-cyan-400 font-bold">{round + 1}/{ROUNDS}</span></span>
        <span className={`font-mono font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-yellow-400'}`}>{timeLeft}s</span>
        <span className="text-yellow-400 font-bold">{score} pts</span>
      </div>

      {showSeq ? (
        <div className="glass-panel p-6 rounded-2xl text-center">
          <p className="text-xs text-gray-400 mb-3 uppercase tracking-widest">Memorize this sequence!</p>
          <div className="flex justify-center gap-2 text-3xl">
            {currentColorSeq.map((c, i) => <span key={i}>{c}</span>)}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {/* Math task */}
          <div className={`glass-panel p-4 rounded-2xl border-2 transition-colors ${feedback.math === true ? 'border-green-400' : feedback.math === false ? 'border-red-400' : mathDone ? 'border-cyan-500/50 opacity-60' : 'border-cyan-500/30'}`}>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Task 1: Math</p>
            <p className="text-xl font-black text-white text-center mb-3">{math.question}</p>
            <div className="grid grid-cols-4 gap-2">
              {math.options.map(opt => (
                <button key={opt} onClick={() => pickMath(opt)} disabled={mathDone}
                  className="py-2 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 disabled:opacity-40 transition-all text-sm">
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Color task */}
          <div className={`glass-panel p-4 rounded-2xl border-2 transition-colors ${feedback.color === true ? 'border-green-400' : feedback.color === false ? 'border-red-400' : colorDone ? 'border-purple-500/50 opacity-60' : 'border-purple-500/30'}`}>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Task 2: Recall Color Sequence ({colorInput.length}/{currentColorSeq.length})</p>
            <div className="flex gap-2 justify-center mb-3 text-2xl h-8">
              {colorInput.map((c, i) => <span key={i}>{c}</span>)}
              {Array.from({ length: currentColorSeq.length - colorInput.length }).map((_, i) => (
                <span key={i} className="text-gray-700">○</span>
              ))}
            </div>
            <div className="flex gap-3 justify-center flex-wrap">
              {['🔴','🔵','🟢','🟡','🟣'].map(c => (
                <button key={c} onClick={() => pickColor(c)} disabled={colorDone}
                  className="text-2xl w-12 h-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 transition-all">
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
