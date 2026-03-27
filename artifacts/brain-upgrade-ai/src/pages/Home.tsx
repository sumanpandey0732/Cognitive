import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Zap, Brain, Flame, ArrowRight, Activity, Target, Trophy, TrendingUp } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { ALL_GAMES } from './Games';

const FEATURED_GAMES = ['falling-clouds', 'color-sequence', 'stroop', 'bubble-pop'];

export default function Home() {
  const { state } = useAppContext();

  const totalAccuracy = state.totalCorrect + state.totalWrong > 0
    ? Math.round(state.totalCorrect / (state.totalCorrect + state.totalWrong) * 100) : 0;

  const featured = ALL_GAMES.filter(g => FEATURED_GAMES.includes(g.id));
  const recentGames = state.gameSessions?.slice(0, 4) || [];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-xl text-primary font-display tracking-widest font-bold text-glow-cyan uppercase mb-1">SYSTEM ONLINE</h2>
          <h1 className="text-4xl md:text-5xl font-display font-black text-foreground">DASHBOARD</h1>
        </div>
        <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-full border-accent/30">
          <Flame className="w-5 h-5 text-orange-500 drop-shadow-[0_0_8px_rgba(255,165,0,0.8)]" />
          <span className="font-bold text-lg">{state.streak} Day</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Brain Score Card */}
        <motion.div whileHover={{ scale: 1.01 }}
          className="lg:col-span-2 glass-panel p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Brain className="w-64 h-64 text-primary" />
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[260px]">
            <div>
              <p className="text-muted-foreground uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Global Brain Score
              </p>
              <div className="text-8xl md:text-9xl font-display font-black text-white animate-pulse-score">
                {state.brainScore}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              {[
                { label: 'Games', value: state.totalGamesPlayed, color: 'text-cyan-400' },
                { label: 'Accuracy', value: `${totalAccuracy}%`, color: totalAccuracy >= 70 ? 'text-green-400' : 'text-orange-400' },
                { label: 'Level', value: state.level, color: 'text-purple-400' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <Link href="/games">
                <button className="px-8 py-3 bg-primary text-primary-foreground font-bold font-display tracking-widest rounded-xl hover:bg-white transition-all box-glow-cyan-strong flex items-center gap-3 group/btn">
                  🎮 PLAY GAMES <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="/train">
                <button className="px-8 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all border border-white/20">
                  MCQ TRAIN
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Energy */}
          <div className="glass-panel p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="font-bold text-white text-sm">Daily Energy</span>
              </div>
              <span className="text-yellow-400 font-bold">{state.energy} / 1000</span>
            </div>
            <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden">
              <motion.div className="h-3 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                animate={{ width: `${(state.energy / 1000) * 100}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-2">Resets daily at midnight ♻</p>
          </div>

          {/* Stats */}
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
              <TrendingUp className="w-3 h-3" /> Brain Stats
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Memory', val: state.stats.memory, color: '#a855f7' },
                { label: 'Logic', val: state.stats.logic, color: '#3b82f6' },
                { label: 'Speed', val: state.stats.speed, color: '#22c55e' },
                { label: 'Focus', val: state.stats.focus, color: '#f97316' },
                { label: 'Math IQ', val: state.stats.mathIQ, color: '#00e5ff' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-12">{s.label}</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div className="h-1.5 rounded-full"
                      initial={{ width: 0 }} animate={{ width: `${s.val}%` }}
                      style={{ background: s.color }} />
                  </div>
                  <span className="text-xs font-bold w-6" style={{ color: s.color }}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Missions */}
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
              <Target className="w-3 h-3 text-accent" /> Missions
            </h3>
            {state.missions.slice(0, 2).map(m => (
              <div key={m.id} className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/80 font-bold">{m.title}</span>
                  <span className="text-accent">+{m.xpReward}xp</span>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                  <div className="bg-accent h-full" style={{ width: `${(m.progress / m.target) * 100}%` }} />
                </div>
              </div>
            ))}
            {state.missions.length === 0 && <p className="text-xs text-gray-500">Check Missions tab for daily goals!</p>}
          </div>
        </div>
      </div>

      {/* Featured Games */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-white">🎮 Featured Games</h2>
          <Link href="/games">
            <span className="text-cyan-400 text-sm hover:underline cursor-pointer flex items-center gap-1">All 13 games <ArrowRight className="w-3 h-3" /></span>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featured.map((game, i) => {
            const hi = state.highScores[game.id] || 0;
            return (
              <motion.div key={game.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }} whileHover={{ scale: 1.03 }}>
                <Link href={`/play/${game.id}`}>
                  <div className="glass-panel p-4 rounded-2xl border border-white/5 hover:border-cyan-500/30 cursor-pointer group transition-all">
                    <div className="text-3xl mb-2">{game.icon}</div>
                    <h3 className="font-black text-white text-sm group-hover:text-cyan-300 transition-colors">{game.title}</h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{game.description}</p>
                    {hi > 0 && (
                      <div className="flex items-center gap-1 text-xs text-yellow-400 mt-2">
                        <Trophy className="w-3 h-3" /> {hi}
                      </div>
                    )}
                    <div className="mt-3 w-full py-1.5 text-center text-xs font-bold rounded-lg bg-white/5 group-hover:bg-primary group-hover:text-black transition-all">
                      ▶ Play
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Recent sessions */}
      {recentGames.length > 0 && (
        <div>
          <h2 className="text-xl font-black text-white mb-4">📊 Recent Sessions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentGames.map((s, i) => (
              <div key={i} className="glass-panel p-4 rounded-2xl border border-white/5">
                <p className="text-sm font-bold text-white">{s.gameName}</p>
                <div className="flex gap-4 mt-2">
                  <div><p className="text-lg font-black text-cyan-400">{s.score}</p><p className="text-xs text-gray-400">Score</p></div>
                  <div><p className={`text-lg font-black ${s.accuracy >= 70 ? 'text-green-400' : 'text-orange-400'}`}>{s.accuracy}%</p><p className="text-xs text-gray-400">Acc</p></div>
                  <div><p className="text-lg font-black text-yellow-400">+{s.xpEarned}</p><p className="text-xs text-gray-400">XP</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
