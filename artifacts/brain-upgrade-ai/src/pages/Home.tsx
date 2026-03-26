import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Zap, Brain, Flame, ArrowRight, Activity, Target } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

export default function Home() {
  const { state } = useAppContext();
  
  // Dummy heatmap data
  const heatmapData = Array.from({ length: 35 }).map(() => Math.floor(Math.random() * 4));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
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
        
        {/* Main Brain Score Card */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="lg:col-span-2 glass-panel p-8 rounded-3xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Brain className="w-64 h-64 text-primary" />
          </div>
          
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[300px]">
            <div>
              <p className="text-muted-foreground uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Global Brain Score
              </p>
              <div className="text-8xl md:text-9xl font-display font-black text-white animate-pulse-score">
                {state.brainScore}
              </div>
            </div>
            
            <div className="mt-8">
              <Link href="/train">
                <button className="px-8 py-4 bg-primary text-primary-foreground font-bold font-display tracking-widest rounded-xl hover:bg-white transition-all box-glow-cyan-strong flex items-center gap-3 group/btn">
                  QUICK START
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Right Side Stats */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-sm text-muted-foreground font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" />
              Today's Missions
            </h3>
            <div className="space-y-4">
              {state.missions.length > 0 ? state.missions.slice(0, 3).map(m => (
                <div key={m.id} className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-bold text-white/90">{m.title}</span>
                    <span className="text-accent text-xs">+{m.xpReward} XP</span>
                  </div>
                  <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-accent h-full shadow-[0_0_10px_rgba(138,43,226,0.8)]"
                      style={{ width: `${(m.progress / m.target) * 100}%` }}
                    />
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No active missions. Check Missions tab.</p>
              )}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-sm text-muted-foreground font-bold uppercase tracking-widest mb-4">Activity Heatmap</h3>
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {heatmapData.map((val, i) => (
                <div 
                  key={i} 
                  className={`aspect-square rounded-sm ${
                    val === 0 ? 'bg-white/5' : 
                    val === 1 ? 'bg-primary/30' : 
                    val === 2 ? 'bg-primary/60' : 'bg-primary shadow-[0_0_5px_rgba(0,255,255,0.5)]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
