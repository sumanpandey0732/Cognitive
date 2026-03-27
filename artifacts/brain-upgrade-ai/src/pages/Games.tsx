import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Gamepad2, Zap, Trophy, Brain, Target, Clock, Layers, Activity, Cpu } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

export interface GameMeta {
  id: string; title: string; description: string;
  domain: string; icon: string; energy: number;
  difficulty: 1 | 2 | 3; xpRange: string; category: string;
  domainColor: string;
}

export const ALL_GAMES: GameMeta[] = [
  // Math & Speed
  { id: 'falling-clouds', title: 'Falling Math Clouds', description: 'Math problems fall from the sky — solve before they hit the ground!', domain: 'Speed Math', icon: '☁️', energy: 15, difficulty: 2, xpRange: '20-120', category: 'Math', domainColor: '#00e5ff' },
  { id: 'bubble-pop', title: 'Bubble Pop Math', description: 'Pop the bubble with the correct answer before it floats away!', domain: 'Speed Math', icon: '🫧', energy: 12, difficulty: 2, xpRange: '15-100', category: 'Math', domainColor: '#00e5ff' },
  { id: 'math-blaster', title: 'Math Blaster', description: 'Rapid-fire math questions with a racing timer. Think fast!', domain: 'Speed Math', icon: '🚀', energy: 10, difficulty: 2, xpRange: '15-80', category: 'Math', domainColor: '#00e5ff' },
  // Memory
  { id: 'color-sequence', title: 'Color Sequence', description: 'Simon Says with colors — watch, then repeat the pattern!', domain: 'Memory', icon: '🎨', energy: 10, difficulty: 2, xpRange: '10-100', category: 'Memory', domainColor: '#a855f7' },
  { id: 'memory-cards', title: 'Memory Card Flip', description: 'Flip cards and match all pairs using memory!', domain: 'Memory', icon: '🃏', energy: 10, difficulty: 1, xpRange: '10-60', category: 'Memory', domainColor: '#a855f7' },
  { id: 'pattern-simon', title: 'Pattern Simon', description: '4 pads flash a sequence — memorize and repeat!', domain: 'Memory', icon: '🔮', energy: 10, difficulty: 2, xpRange: '10-80', category: 'Memory', domainColor: '#a855f7' },
  // Focus & Attention
  { id: 'stroop', title: 'Stroop Challenge', description: 'The color of the text vs. what it says — your brain fights itself!', domain: 'Focus', icon: '🎨', energy: 8, difficulty: 2, xpRange: '10-80', category: 'Focus', domainColor: '#f97316' },
  { id: 'number-tap', title: 'Number Tap', description: 'Tap numbers 1→25 as fast as possible across the grid!', domain: 'Focus', icon: '🔢', energy: 8, difficulty: 1, xpRange: '10-60', category: 'Focus', domainColor: '#f97316' },
  { id: 'target-tap', title: 'Target Tap', description: 'Tap moving targets with precision. Don\'t miss!', domain: 'Speed', icon: '🎯', energy: 12, difficulty: 2, xpRange: '15-100', category: 'Speed', domainColor: '#22c55e' },
  // Logic & Language
  { id: 'speed-sort', title: 'Speed Sort', description: 'Tap numbers in ascending or descending order — fast!', domain: 'Logic', icon: '🔢', energy: 8, difficulty: 2, xpRange: '10-60', category: 'Logic', domainColor: '#3b82f6' },
  { id: 'word-scramble', title: 'Word Scramble', description: 'Unscramble the letters to reveal the hidden word!', domain: 'Verbal', icon: '📝', energy: 8, difficulty: 1, xpRange: '10-70', category: 'Verbal', domainColor: '#eab308' },
  // Multi-task
  { id: 'dual-task', title: 'Dual Task', description: 'Solve math AND recall a color sequence — simultaneously!', domain: 'Multitask', icon: '🧠', energy: 20, difficulty: 3, xpRange: '30-150', category: 'Multi-task', domainColor: '#ef4444' },
  // Reaction
  { id: 'reaction-chain', title: 'Reaction Chain', description: 'Only tap when you see the target color flash!', domain: 'Speed', icon: '⚡', energy: 10, difficulty: 2, xpRange: '15-90', category: 'Speed', domainColor: '#22c55e' },
];

const CATEGORIES = ['All', 'Math', 'Memory', 'Focus', 'Speed', 'Logic', 'Verbal', 'Multi-task'];

const DIFFICULTY_LABEL = ['', 'Easy', 'Medium', 'Hard'];
const DIFFICULTY_COLOR = ['', 'text-green-400', 'text-yellow-400', 'text-red-400'];

export default function Games() {
  const { state } = useAppContext();
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All' ? ALL_GAMES : ALL_GAMES.filter(g => g.category === filter);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-sm text-primary font-bold tracking-widest uppercase mb-1">🎮 Brain Arcade</h2>
          <h1 className="text-4xl font-display font-black text-white">MINI GAMES</h1>
          <p className="text-gray-400 mt-1">{ALL_GAMES.length} unique interactive games • All feed into your brain analytics</p>
        </div>
        <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-full border border-white/10">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-bold text-white">{state.energy}</span>
          <span className="text-gray-400 text-xs">/ 1000 energy</span>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Games Played', value: state.totalGamesPlayed, icon: '🎮', color: 'text-cyan-400' },
          { label: 'Total XP', value: state.xp + (state.level - 1) * 100, icon: '⚡', color: 'text-yellow-400' },
          { label: 'Accuracy', value: `${state.totalCorrect + state.totalWrong > 0 ? Math.round(state.totalCorrect / (state.totalCorrect + state.totalWrong) * 100) : 0}%`, icon: '🎯', color: 'text-green-400' },
          { label: 'Streak', value: `${state.streak}d`, icon: '🔥', color: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="glass-panel p-3 rounded-2xl text-center border border-white/5">
            <p className="text-lg">{s.icon}</p>
            <p className={`font-black text-lg ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${filter === cat ? 'bg-primary text-black border-primary' : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((game, i) => {
          const highScore = state.highScores[game.id] || 0;
          return (
            <motion.div key={game.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}>
              <Link href={`/play/${game.id}`}>
                <div className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-white/20 cursor-pointer h-full flex flex-col gap-3 transition-all group">
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{game.icon}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 ${DIFFICULTY_COLOR[game.difficulty]}`}>
                      {DIFFICULTY_LABEL[game.difficulty]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-white text-base leading-tight group-hover:text-cyan-300 transition-colors">{game.title}</h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{game.description}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${game.domainColor}22`, color: game.domainColor }}>
                      {game.domain}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Zap className="w-3 h-3 text-yellow-400" /> {game.energy}
                    </div>
                  </div>
                  {highScore > 0 && (
                    <div className="flex items-center gap-1 text-xs text-yellow-400 border-t border-white/5 pt-2">
                      <Trophy className="w-3 h-3" /> Best: {highScore}
                    </div>
                  )}
                  <motion.div className="w-full py-2 text-center text-xs font-bold rounded-lg bg-white/5 group-hover:bg-primary group-hover:text-black transition-all"
                    whileTap={{ scale: 0.97 }}>
                    ▶ PLAY
                  </motion.div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
