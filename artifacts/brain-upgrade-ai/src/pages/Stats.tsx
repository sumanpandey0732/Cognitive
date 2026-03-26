import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext, BrainStats } from '@/context/AppContext';

function CircularProgress({ value, label, colorClass }: { value: number, label: string, colorClass: string }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4 glass-panel rounded-2xl relative overflow-hidden group">
      <div className="relative w-24 h-24 mb-3">
        <svg className="w-full h-full transform -rotate-90">
          <circle 
            cx="48" cy="48" r="40" 
            stroke="rgba(255,255,255,0.05)" 
            strokeWidth="6" 
            fill="none" 
          />
          <motion.circle 
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            cx="48" cy="48" r="40" 
            stroke="currentColor" 
            strokeWidth="6" 
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            className={`${colorClass} drop-shadow-[0_0_8px_currentColor]`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-xl font-bold font-display">{value}</span>
        </div>
      </div>
      <span className="text-xs tracking-wider text-muted-foreground font-bold uppercase">{label}</span>
    </div>
  );
}

export default function Stats() {
  const { state } = useAppContext();
  
  const avgStats = Object.values(state.stats).reduce((a, b) => a + b, 0) / 5;
  const brainAge = Math.max(18, Math.floor(30 - ((avgStats - 50) / 5)));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <header>
        <h1 className="text-4xl font-display font-black text-foreground">NEURAL METRICS</h1>
        <p className="text-muted-foreground mt-2">Analysis of your cognitive capabilities.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Brain Age Card */}
        <div className="md:col-span-1 glass-panel p-8 rounded-3xl flex flex-col items-center justify-center text-center">
          <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mb-4">Calculated Brain Age</p>
          <div className="text-8xl font-display font-black text-glow-violet text-accent mb-2">
            {brainAge}
          </div>
          <p className="text-sm text-muted-foreground">Biological Optimization: <span className="text-green-400">Active</span></p>
        </div>

        {/* Stats Grid */}
        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
          <CircularProgress value={state.stats.speed} label="Speed" colorClass="text-primary" />
          <CircularProgress value={state.stats.memory} label="Memory" colorClass="text-accent" />
          <CircularProgress value={state.stats.logic} label="Logic" colorClass="text-blue-400" />
          <CircularProgress value={state.stats.focus} label="Focus" colorClass="text-green-400" />
          <CircularProgress value={state.stats.mathIQ} label="Math IQ" colorClass="text-pink-400" />
          
          <div className="flex flex-col items-center justify-center p-4 glass-panel rounded-2xl border border-primary/20 bg-primary/5">
            <span className="text-3xl font-display font-bold text-primary mb-1">{state.level}</span>
            <span className="text-xs tracking-wider text-muted-foreground font-bold uppercase">Current Level</span>
          </div>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-3xl mt-8">
        <h3 className="text-xl font-display font-bold mb-6 text-white">Recent Neural Activity</h3>
        <div className="space-y-4">
          {state.history.slice(0, 5).map((entry, i) => (
            <div key={entry.id} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-primary box-glow-cyan" />
                <div>
                  <p className="font-bold text-white capitalize">{entry.category} Module</p>
                  <p className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">{entry.score} PTS</p>
                <p className="text-xs text-muted-foreground">{Math.round(entry.accuracy)}% ACC</p>
              </div>
            </div>
          ))}
          {state.history.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No training data found. Initiate a sequence to begin tracking.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
