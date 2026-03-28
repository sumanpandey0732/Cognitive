import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSession } from '@/context/AppContext';
interface Props { onFinish: (s: Partial<GameSession>) => void; }
const WORD_POOL = ['apple','ocean','brave','cloud','dream','eagle','flame','ghost','heart','ivory','jewel','knife','lemon','mango','night','orbit','peace','quest','river','solar','tiger','ultra','vivid','world','xenon','yacht','zeal','amber','blaze','cedar','dagger','elder','frost','grace','haven','input','joker','karma','laser','magic','noble','ozone','pearl','quartz','realm','storm','tropic','urban','vapor','wheat','xray','young','zenith'];
export default function WordMemory({ onFinish }: Props) {
  const ROUNDS = 6;
  const G = useRef({ score: 0, correct: 0, wrong: 0, maxSpan: 0, done: false });
  const [phase, setPhase] = useState<'showing' | 'test'>('showing');
  const [shownWords, setShownWords] = useState<string[]>([]);
  const [testWords, setTestWords] = useState<{word: string; shown: boolean}[]>([]);
  const [answered, setAnswered] = useState<Set<number>>(new Set());
  const [round, setRound] = useState(0);
  const [showIdx, setShowIdx] = useState(-1);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  function startRound(r: number) {
    const count = Math.min(4 + r, 9);
    const shuffled = [...WORD_POOL].sort(() => Math.random() - 0.5);
    const shown = shuffled.slice(0, count);
    const hidden = shuffled.slice(count, count + count);
    const test = [...shown, ...hidden].sort(() => Math.random() - 0.5).map(w => ({ word: w, shown: shown.includes(w) }));
    setShownWords(shown); setTestWords(test); setAnswered(new Set()); setPhase('showing'); setShowIdx(0); setRound(r);
    const speed = Math.max(700, 1200 - r * 60);
    shown.forEach((_, i) => { setTimeout(() => setShowIdx(i), i * speed + 200); setTimeout(() => setShowIdx(-1), i * speed + speed - 100); });
    setTimeout(() => { setShowIdx(-1); setPhase('test'); }, shown.length * speed + 600);
  }
  useEffect(() => { startRound(0); }, []);
  function finish() { G.current.done = true; const total = G.current.correct + G.current.wrong; onFinish({ gameId: 'word-memory', gameName: 'Word Memory', domain: 'Memory', score: G.current.score, accuracy: total > 0 ? Math.round(G.current.correct / total * 100) : 0, avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong, maxCombo: G.current.maxSpan, difficulty: 2, xpEarned: Math.floor(G.current.score / 5) }); re(); }
  function answer(idx: number, choice: 'yes' | 'no') {
    if (answered.has(idx)) return;
    const correct = choice === 'yes' ? testWords[idx].shown : !testWords[idx].shown;
    const newAns = new Set(answered); newAns.add(idx); setAnswered(newAns);
    if (correct) { G.current.score += 10; G.current.correct += 1; } else { G.current.wrong += 1; }
    re();
    if (newAns.size >= testWords.length) {
      G.current.maxSpan = Math.max(G.current.maxSpan, shownWords.length);
      const next = round + 1;
      setTimeout(() => { if (next >= ROUNDS) finish(); else startRound(next); }, 600);
    }
  }
  const g = G.current;
  if (g.done) { const total = g.correct + g.wrong; return <div className="flex flex-col items-center gap-4 text-center py-6"><div className="text-5xl">📚</div><h2 className="text-2xl font-black text-white">Word Memory Done!</h2><div className="grid grid-cols-3 gap-3">{[['Score', g.score, 'text-cyan-400'], ['Accuracy', `${total > 0 ? Math.round(g.correct / total * 100) : 0}%`, 'text-green-400'], ['Max Span', g.maxSpan, 'text-purple-400']].map(([l, v, c]) => <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>)}</div></div>; }
  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between text-sm"><span className="text-gray-400">Round {round + 1}/{ROUNDS}</span><span className="text-yellow-400 font-bold">{g.score}pts • {answered.size}/{testWords.length} answered</span></div>
      {phase === 'showing' ? (
        <div className="glass-panel p-8 rounded-2xl border border-white/10 min-h-44 flex flex-col items-center justify-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Memorize these words!</p>
          <AnimatePresence mode="wait">
            {showIdx >= 0 && <motion.div key={showIdx} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.3, opacity: 0 }}
              className="text-4xl font-black text-purple-300 uppercase tracking-widest" style={{ textShadow: '0 0 25px rgba(168,85,247,0.8)' }}>{shownWords[showIdx]}</motion.div>}
          </AnimatePresence>
          <p className="text-xs text-gray-500 mt-4">{showIdx + 1}/{shownWords.length}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-center text-sm text-cyan-400 font-bold">Did you see this word? YES or NO</p>
          {testWords.map((tw, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              className={`flex items-center justify-between glass-panel px-4 py-2 rounded-xl border transition-all ${answered.has(i) ? (testWords[i].shown === (answered.has(i)) ? 'border-white/5' : 'border-white/5') : 'border-white/10'}`}>
              <span className={`font-bold uppercase tracking-wider ${answered.has(i) ? (tw.shown ? 'text-green-400' : 'text-gray-400') : 'text-white'}`}>{tw.word}</span>
              <div className="flex gap-2">
                {['yes','no'].map(choice => (
                  <motion.button key={choice} onClick={() => answer(i, choice as 'yes'|'no')} whileTap={{ scale: 0.85 }}
                    disabled={answered.has(i)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition-all disabled:opacity-40 ${choice === 'yes' ? 'bg-green-500/20 border border-green-400 text-green-400 hover:bg-green-500/40' : 'bg-red-500/20 border border-red-400 text-red-400 hover:bg-red-500/40'}`}>
                    {choice.toUpperCase()}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
