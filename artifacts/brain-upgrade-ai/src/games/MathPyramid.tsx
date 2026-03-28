import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameSession } from '@/context/AppContext';
interface Props { onFinish: (s: Partial<GameSession>) => void; }
const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
// A math pyramid: each cell = sum of two below it
function makePyramid() {
  // Bottom row of 3 known
  const b = [rnd(1, 10), rnd(1, 10), rnd(1, 10)];
  const m = [b[0] + b[1], b[1] + b[2]];
  const top = m[0] + m[1];
  // Blank out 3 cells randomly
  const allCells = [...b, ...m, top];
  const labels = ['b0','b1','b2','m0','m1','top'];
  const blanked = new Set<number>();
  while (blanked.size < 3) blanked.add(rnd(0, 5));
  const display = allCells.map((v, i) => blanked.has(i) ? null : v);
  return { cells: display, correct: allCells, blanked };
}
export default function MathPyramid({ onFinish }: Props) {
  const ROUNDS = 8;
  const G = useRef({ score: 0, correct: 0, wrong: 0, done: false });
  const [round, setRound] = useState(0);
  const [puzzle, setPuzzle] = useState(() => makePyramid());
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  function finish() { G.current.done = true; onFinish({ gameId: 'math-pyramid', gameName: 'Math Pyramid', domain: 'Logic', score: G.current.score, accuracy: G.current.correct + G.current.wrong > 0 ? Math.round(G.current.correct / (G.current.correct + G.current.wrong) * 100) : 0, avgResponseMs: 0, correct: G.current.correct, wrong: G.current.wrong, maxCombo: 0, difficulty: 2, xpEarned: Math.floor(G.current.score / 5) }); re(); }
  function submit() {
    let allCorrect = true;
    puzzle.blanked.forEach(i => {
      const typed = parseInt(inputs[i] || '');
      if (typed === puzzle.correct[i]) G.current.correct += 1;
      else { G.current.wrong += 1; allCorrect = false; }
    });
    if (allCorrect) G.current.score += 40;
    else G.current.score += Math.max(0, [...puzzle.blanked].filter(i => parseInt(inputs[i] || '') === puzzle.correct[i]).length * 10);
    setChecked(true); re();
    const next = round + 1;
    setTimeout(() => { if (next >= ROUNDS) finish(); else { setRound(next); setPuzzle(makePyramid()); setInputs({}); setChecked(false); } }, 1200);
  }
  const g = G.current;
  if (g.done) { return <div className="flex flex-col items-center gap-4 text-center py-6"><div className="text-5xl">🔺</div><h2 className="text-2xl font-black text-white">Pyramid Built!</h2><div className="grid grid-cols-3 gap-3">{[['Score', g.score, 'text-cyan-400'], ['Correct', g.correct, 'text-green-400'], ['Wrong', g.wrong, 'text-red-400']].map(([l, v, c]) => <div key={l as string} className="glass-panel p-3 rounded-xl"><p className="text-xs text-gray-400">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>)}</div></div>; }
  const cells = puzzle.cells;
  const rows = [[cells[6]], [cells[3], cells[4]], [cells[0], cells[1], cells[2]]];
  const correctRows = [[puzzle.correct[6]], [puzzle.correct[3], puzzle.correct[4]], [puzzle.correct[0], puzzle.correct[1], puzzle.correct[2]]];
  const idxMap = [[6], [3, 4], [0, 1, 2]];
  function renderCell(val: number | null, idx: number) {
    const isBlank = puzzle.blanked.has(idx);
    const isCorrectFill = checked && isBlank && parseInt(inputs[idx] || '') === puzzle.correct[idx];
    const isWrongFill = checked && isBlank && parseInt(inputs[idx] || '') !== puzzle.correct[idx];
    return (
      <div key={idx} className={`relative w-16 h-14 rounded-xl border-2 flex items-center justify-center font-black text-lg transition-all ${
        isCorrectFill ? 'bg-green-500/20 border-green-400 text-green-400' :
        isWrongFill ? 'bg-red-500/20 border-red-400' :
        !isBlank ? 'bg-white/15 border-white/30 text-white' :
        'bg-cyan-500/10 border-cyan-400 border-dashed'
      }`}>
        {!isBlank ? val : isCorrectFill ? puzzle.correct[idx] : isWrongFill ? <><span className="text-red-400 text-sm">{inputs[idx] || '?'}</span><span className="absolute -top-5 text-xs text-green-400">{puzzle.correct[idx]}</span></> : (
          <input type="number" value={inputs[idx] || ''} onChange={e => setInputs(prev => ({ ...prev, [idx]: e.target.value }))}
            className="w-12 bg-transparent text-cyan-300 text-center font-black text-lg focus:outline-none" placeholder="?" />
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex justify-between w-full text-sm"><span className="text-gray-400">Round {round + 1}/{ROUNDS}</span><span className="text-yellow-400 font-bold">{g.score}pts</span></div>
      <p className="text-xs text-gray-400 text-center">Each block = sum of the two below it. Fill in the blanks!</p>
      <div className="flex flex-col items-center gap-2">
        {rows.map((row, ri) => (
          <div key={ri} className="flex gap-2">{row.map((_, ci) => renderCell(correctRows[ri][ci], idxMap[ri][ci]))}</div>
        ))}
      </div>
      {!checked && <motion.button onClick={submit} whileTap={{ scale: 0.95 }} className="px-8 py-3 rounded-xl font-black bg-cyan-500 text-black hover:bg-cyan-400 transition-all">CHECK ANSWERS</motion.button>}
    </div>
  );
}
