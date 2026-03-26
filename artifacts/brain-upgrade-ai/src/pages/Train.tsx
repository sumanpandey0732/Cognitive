import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { TRAIN_MODES } from '@/games/gameEngine';
import { Lock, TrendingUp, Zap } from 'lucide-react';

const GRADIENT_MAP: Record<string, string> = {
  '#00e5ff': 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30',
  '#a855f7': 'from-purple-500/20 to-purple-500/5 border-purple-500/30',
  '#facc15': 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30',
  '#22d3ee': 'from-blue-400/20 to-blue-400/5 border-blue-400/30',
  '#f97316': 'from-orange-500/20 to-orange-500/5 border-orange-500/30',
  '#84cc16': 'from-lime-500/20 to-lime-500/5 border-lime-500/30',
  '#ec4899': 'from-pink-500/20 to-pink-500/5 border-pink-500/30',
  '#ef4444': 'from-red-500/20 to-red-500/5 border-red-500/30',
};

export default function Train() {
  const { state } = useAppContext();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-display font-black text-white uppercase tracking-widest">
            Training Lab
          </h1>
          <p className="text-gray-400 mt-2">8 modules · 100+ unique question types · fully randomized</p>
        </div>
        <div className="glass-panel px-4 py-2 rounded-xl text-right">
          <p className="text-xs text-gray-400">Energy</p>
          <p className="text-xl font-bold text-yellow-400">{state.energy}⚡</p>
        </div>
      </header>

      {/* Stats summary */}
      <div className="grid grid-cols-5 gap-2">
        {Object.entries(state.stats).map(([key, val]) => (
          <div key={key} className="glass-panel p-3 rounded-xl text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{key}</p>
            <p className="text-lg font-black text-white">{val}</p>
            <div className="w-full bg-white/5 rounded-full h-1 mt-1">
              <div className="h-1 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all" style={{ width: `${val}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Mode grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {TRAIN_MODES.map((mode, i) => {
          const locked = mode.premium && !state.isPremium;
          const gradientClass = GRADIENT_MAP[mode.color] || 'from-white/10 to-white/5 border-white/20';
          const statVal = state.stats[mode.statKey];

          return (
            <motion.div key={mode.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Link href={locked ? '/profile' : `/challenge?mode=${mode.id}`}>
                <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className={`relative h-full rounded-2xl border bg-gradient-to-b p-5 cursor-pointer transition-all duration-300 overflow-hidden group ${gradientClass} ${locked ? 'opacity-60 grayscale' : 'hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]'}`}>

                  {/* Glow background on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `radial-gradient(circle at 50% 50%, ${mode.color}15, transparent 70%)` }} />

                  {/* Lock badge */}
                  {locked && (
                    <div className="absolute top-3 right-3 bg-red-500/20 text-red-400 border border-red-500/40 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> PRO
                    </div>
                  )}

                  {/* Type badge */}
                  {!locked && (
                    <div className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-bold border"
                      style={{ color: mode.color, borderColor: `${mode.color}50`, background: `${mode.color}15` }}>
                      {mode.badge}
                    </div>
                  )}

                  {/* Icon */}
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    {mode.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-black text-white mb-1 uppercase tracking-wide">{mode.title}</h3>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">{mode.description}</p>

                  {/* Stat bar */}
                  <div className="mt-auto">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500 uppercase tracking-wider">{mode.statKey}</span>
                      <span style={{ color: mode.color }} className="font-bold">{statVal}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5">
                      <motion.div className="h-1.5 rounded-full transition-all" initial={{ width: 0 }}
                        animate={{ width: `${statVal}%` }} transition={{ delay: i * 0.1 + 0.5, duration: 0.8 }}
                        style={{ background: `linear-gradient(to right, ${mode.color}, ${mode.color}aa)` }} />
                    </div>
                  </div>

                  {/* Play button */}
                  <div className="mt-4 py-2.5 text-center rounded-xl font-bold text-sm uppercase tracking-widest transition-all"
                    style={{ background: locked ? 'rgba(255,255,255,0.05)' : `${mode.color}20`, color: locked ? '#6b7280' : mode.color, border: `1px solid ${locked ? 'rgba(255,255,255,0.1)' : `${mode.color}40`}` }}>
                    {locked ? '🔒 Unlock' : '▶ Play Now'}
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Info strip */}
      <div className="glass-panel p-5 rounded-2xl flex flex-wrap gap-6 items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-yellow-400" />
          <div>
            <p className="text-sm font-bold text-white">100+ Question Types</p>
            <p className="text-xs text-gray-400">Every session is completely unique — no repeats</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-sm font-bold text-white">Adaptive Difficulty</p>
            <p className="text-xs text-gray-400">Questions scale with your performance level</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl">🧠</span>
          <div>
            <p className="text-sm font-bold text-white">Track 5 Brain Stats</p>
            <p className="text-xs text-gray-400">Speed · Memory · Logic · Focus · MathIQ</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
