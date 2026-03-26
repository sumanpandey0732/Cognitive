import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { aiService } from '@/services/aiService';
import { useMutation } from '@tanstack/react-query';
import { Bot, CheckCircle2, Loader2 } from 'lucide-react';

export default function Missions() {
  const { state, updateMissions } = useAppContext();
  
  const generateMutation = useMutation({
    mutationFn: () => aiService.generateMissions(state.stats),
    onSuccess: (newMissions) => {
      updateMissions(newMissions);
    }
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display font-black text-foreground">DAILY MISSIONS</h1>
          <p className="text-muted-foreground mt-2">Complete objectives for massive XP gains.</p>
        </div>
        <button 
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg flex items-center gap-2 text-sm font-bold transition-all disabled:opacity-50"
        >
          {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
          AI Generate
        </button>
      </header>

      <div className="space-y-4">
        {state.missions.length === 0 && !generateMutation.isPending && (
          <div className="text-center py-20 glass-panel rounded-3xl">
            <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No Active Missions</h3>
            <p className="text-muted-foreground mb-6">Let the AI generate personalized objectives based on your current cognitive stats.</p>
            <button 
              onClick={() => generateMutation.mutate()}
              className="px-6 py-3 bg-primary text-black font-bold rounded-lg box-glow-cyan"
            >
              Generate Protocol
            </button>
          </div>
        )}

        {state.missions.map((mission, i) => (
          <motion.div 
            key={mission.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`glass-panel p-6 rounded-2xl border ${mission.completed ? 'border-green-500/50 bg-green-500/5' : 'border-white/10'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold text-accent uppercase tracking-wider mb-1 block">
                  {mission.category} Module
                </span>
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  {mission.title}
                  {mission.completed && <CheckCircle2 className="w-5 h-5 text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]" />}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{mission.description}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-display font-bold text-primary">+{mission.xpReward}</span>
                <span className="text-xs text-primary block">XP</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs font-bold mb-2 text-muted-foreground">
                <span>Progress</span>
                <span>{mission.progress} / {mission.target}</span>
              </div>
              <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${mission.completed ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]' : 'bg-primary shadow-[0_0_10px_rgba(0,255,255,0.8)]'}`}
                  style={{ width: `${(mission.progress / mission.target) * 100}%` }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
