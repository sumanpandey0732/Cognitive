import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { LayoutGrid, Zap, Brain, MousePointerClick, Layers, Bot } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

const MODES = [
  { id: 'logic', title: 'Logic Mode', desc: 'Pattern puzzles & sequences', icon: LayoutGrid, color: 'text-primary' },
  { id: 'speed', title: 'Speed Mode', desc: 'Rapid math & quick decisions', icon: Zap, color: 'text-yellow-400' },
  { id: 'memory', title: 'Memory Mode', desc: 'Number & sequence recall', icon: Brain, color: 'text-accent' },
  { id: 'reaction', title: 'Reaction', desc: 'Millisecond tap measurement', icon: MousePointerClick, color: 'text-green-400' },
  { id: 'cognitive', title: 'Cognitive Load', desc: 'Multi-tasking challenges', icon: Layers, color: 'text-pink-400', premium: true },
  { id: 'decision', title: 'AI Decision', desc: 'Real-life AI simulations', icon: Bot, color: 'text-blue-400', premium: true },
];

export default function Train() {
  const { state } = useAppContext();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <header>
        <h1 className="text-4xl font-display font-black text-foreground">TRAINING LAB</h1>
        <p className="text-muted-foreground mt-2">Select a module to upgrade your neural pathways.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MODES.map((mode, i) => {
          const locked = mode.premium && !state.isPremium;
          return (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={locked ? '/profile' : `/challenge?mode=${mode.id}`}>
                <div className={`h-full glass-panel p-6 rounded-3xl cursor-pointer relative overflow-hidden group transition-all duration-300 ${locked ? 'opacity-50 grayscale hover:opacity-100 hover:grayscale-0' : 'hover:border-primary/50 hover:shadow-[0_0_30px_rgba(0,255,255,0.15)] hover:-translate-y-1'}`}>
                  
                  {locked && (
                    <div className="absolute top-4 right-4 bg-red-500/20 text-red-400 border border-red-500/50 text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">
                      Premium
                    </div>
                  )}

                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <mode.icon className={`w-8 h-8 ${mode.color} drop-shadow-md`} />
                  </div>
                  
                  <h3 className="text-xl font-display font-bold text-white mb-2">{mode.title}</h3>
                  <p className="text-sm text-muted-foreground mb-6">{mode.desc}</p>
                  
                  <div className="w-full py-3 text-center bg-white/5 hover:bg-white/10 rounded-xl font-bold text-sm tracking-widest uppercase transition-colors">
                    {locked ? 'Unlock' : 'Initiate Sequence'}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
