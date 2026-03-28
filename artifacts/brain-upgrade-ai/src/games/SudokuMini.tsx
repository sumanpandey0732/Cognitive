import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameSession } from '@/context/AppContext';
interface Props { onFinish: (s: Partial<GameSession>) => void; }
// Pre-made 4x4 sudoku puzzles [puzzle, solution]
const PUZZLES: [number[], number[]][] = [
  [[1,0,3,0, 0,3,0,2, 3,0,0,1, 0,1,0,3],[1,2,3,4, 4,3,1,2, 3,4,2,1, 2,1,4,3]],
  [[0,2,0,4, 4,0,2,0, 0,1,0,3, 3,0,1,0],[1,2,3,4, 4,3,2,1, 2,1,4,3, 3,4,1,2]],
  [[2,0,0,4, 0,4,2,0, 0,2,4,0, 4,0,0,2],[2,1,3,4, 3,4,2,1, 1,2,4,3, 4,3,1,2]],
  [[0,0,2,0, 2,0,0,4, 0,4,0,0, 0,0,4,0],[4,1,2,3, 2,3,1,4, 3,4,2,1, 1,2,4,3]],
  [[4,0,0,2, 0,1,0,0, 0,0,3,0, 1,0,0,4],[4,3,1,2, 2,1,4,3, 3,4,2,1, 1,2,3,4]],
  [[0,3,0,0, 4,0,0,3, 1,0,0,4, 0,0,2,0],[2,3,4,1, 4,2,1,3, 1,3,2,4, 3,4,2,1]],
];
export default function SudokuMini({ onFinish }: Props) {
  const G = useRef({ score: 0, done: false, startMs: Date.now() });
  const [[puzzle, solution]] = useState(() => PUZZLES[Math.floor(Math.random() * PUZZLES.length)]);
  const [grid, setGrid] = useState<number[]>([...puzzle]);
  const [selected, setSelected] = useState<number | null>(null);
  const [errors, setErrors] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState(0);
  const [solved, setSolved] = useState(false);
  const [tick, setTick] = useState(0);
  const re = () => setTick(t => t + 1);
  function checkSolved(g: number[]) { return g.every((v, i) => v === solution[i]); }
  function fillCell(val: number) {
    if (selected === null || puzzle[selected] !== 0 || solved) return;
    const newGrid = [...grid]; newGrid[selected] = val;
    const newErrors = new Set(errors);
    if (val !== solution[selected]) { newErrors.add(selected); setWrong(w => w + 1); G.current.score = Math.max(0, G.current.score - 20); }
    else { newErrors.delete(selected); G.current.score += 30; }
    setGrid(newGrid); setErrors(newErrors); re();
    if (checkSolved(newGrid)) {
      setSolved(true);
      const timeBonus = Math.max(0, 300 - Math.floor((Date.now() - G.current.startMs) / 1000)) * 2;
      G.current.score += timeBonus;
      setTimeout(() => { G.current.done = true; const blanks = puzzle.filter(x => x === 0).length; onFinish({ gameId: 'sudoku-mini', gameName: 'Sudoku Mini', domain: 'Logic', score: G.current.score, accuracy: Math.round((blanks - wrong) / blanks * 100), avgResponseMs: Math.round((Date.now() - G.current.startMs) / blanks), correct: blanks - wrong, wrong, maxCombo: 0, difficulty: 3, xpEarned: Math.floor(G.current.score / 5) }); re(); }, 800);
    }
  }
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex justify-between w-full text-sm">
        <span className="text-red-400 font-bold">Errors: {wrong}</span>
        <span className="text-purple-400 font-bold text-center">Fill the 4×4 Sudoku (1–4, no repeats)</span>
        <span className="text-yellow-400 font-bold">{G.current.score}pts</span>
      </div>
      {solved && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="glass-panel px-6 py-3 rounded-xl border border-green-400 text-green-400 font-black text-lg">🏆 Solved!</motion.div>}
      <div className="grid grid-cols-4 gap-1.5 bg-white/10 p-2 rounded-2xl border border-white/20" style={{ gridTemplateRows: 'repeat(4, 1fr)' }}>
        {grid.map((val, i) => {
          const isFixed = puzzle[i] !== 0;
          const isSelected = selected === i;
          const hasError = errors.has(i);
          return (
            <motion.button key={i} onClick={() => !isFixed && setSelected(i)} whileTap={{ scale: 0.9 }}
              className={`w-16 h-16 rounded-xl font-black text-2xl flex items-center justify-center transition-all border-2 ${
                isFixed ? 'bg-white/10 border-white/10 text-white cursor-default' :
                hasError ? 'bg-red-500/20 border-red-400 text-red-400' :
                val > 0 ? 'bg-green-500/10 border-green-400/30 text-green-400' :
                isSelected ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.4)]' :
                'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
              } ${(i % 4 === 1 || i % 4 === 2) && Math.floor(i / 4) < 2 ? 'rounded-none' : ''}`}>
              {val || (isSelected ? '?' : '')}
            </motion.button>
          );
        })}
      </div>
      <div className="flex gap-3">{[1, 2, 3, 4].map(n => (
        <motion.button key={n} onClick={() => fillCell(n)} whileTap={{ scale: 0.85 }}
          className="w-14 h-14 rounded-xl font-black text-xl bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 hover:bg-cyan-500/40 transition-all">
          {n}
        </motion.button>
      ))}</div>
      <p className="text-xs text-gray-500">Each row, column & 2×2 box must have 1-4 exactly once</p>
    </div>
  );
}
