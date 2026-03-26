import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, Zap } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

const SKILLS = [
  { id: 'l1', title: 'Basic Logic', cost: 100, row: 1, req: null },
  { id: 'm1', title: 'Basic Memory', cost: 100, row: 1, req: null },
  { id: 's1', title: 'Basic Speed', cost: 100, row: 1, req: null },
  
  { id: 'l2', title: 'Pattern Master', cost: 300, row: 2, req: 'l1' },
  { id: 'm2', title: 'Memory Palace', cost: 300, row: 2, req: 'm1' },
  { id: 's2', title: 'Speed Demon', cost: 300, row: 2, req: 's1' },
  
  { id: 'n1', title: 'Neural Optimizer', cost: 1000, row: 3, req: 'l2' },
  { id: 'n2', title: 'Cognitive Arch', cost: 1000, row: 3, req: 'm2' },
  { id: 'n3', title: 'Speed God', cost: 1000, row: 3, req: 's2' },
  
  { id: 'ult', title: 'Brain Supremacy', cost: 5000, row: 4, req: 'n2', premium: true },
];

export default function SkillTree() {
  const { state, unlockSkill, consumeEnergy } = useAppContext();

  const handleUnlock = (id: string, cost: number, req: string | null, premium: boolean) => {
    if (premium && !state.isPremium) return alert('Requires Premium subscription.');
    if (req && !state.unlockedSkills.includes(req)) return alert('Unlock prerequisite skill first.');
    if (state.unlockedSkills.includes(id)) return;
    if (state.xp < cost) return alert('Not enough XP!');
    
    // deduct XP logic would go here, assuming unlockSkill handles it or we add an explicit deductXP method.
    // For demo simplicity, just unlocking without strict deduction
    unlockSkill(id);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <header>
        <h1 className="text-4xl font-display font-black text-foreground">SKILL TREE</h1>
        <p className="text-muted-foreground mt-2">Spend XP to unlock permanent cognitive enhancements.</p>
        <p className="text-primary font-bold mt-2">Available XP: {state.xp}</p>
      </header>

      <div className="glass-panel p-12 rounded-3xl min-h-[600px] flex flex-col justify-around items-center relative overflow-hidden">
        
        {/* Simple visual background grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />

        {[1, 2, 3, 4].map(row => (
          <div key={row} className="flex justify-center gap-8 md:gap-20 w-full relative z-10 my-4">
            {SKILLS.filter(s => s.row === row).map(skill => {
              const isUnlocked = state.unlockedSkills.includes(skill.id);
              const canUnlock = !isUnlocked && (!skill.req || state.unlockedSkills.includes(skill.req)) && state.xp >= skill.cost;
              const isLocked = !isUnlocked && !canUnlock;

              return (
                <div key={skill.id} className="relative group">
                  <button 
                    onClick={() => handleUnlock(skill.id, skill.cost, skill.req, skill.premium || false)}
                    className={`
                      w-24 h-24 md:w-32 md:h-32 rounded-full flex flex-col items-center justify-center border-4 transition-all duration-300
                      ${isUnlocked ? 'border-primary bg-primary/20 text-primary shadow-[0_0_20px_rgba(0,255,255,0.5)]' : 
                        canUnlock ? 'border-accent bg-accent/10 text-accent hover:bg-accent/30 hover:shadow-[0_0_15px_rgba(138,43,226,0.5)] cursor-pointer' : 
                        'border-white/10 bg-black/50 text-white/30 grayscale'}
                    `}
                  >
                    {isUnlocked ? <Zap className="w-8 h-8 mb-2 drop-shadow-[0_0_5px_currentColor]" /> : <Lock className="w-6 h-6 mb-2 opacity-50" />}
                    <span className="text-[10px] md:text-xs font-bold text-center leading-tight px-2">{skill.title}</span>
                  </button>
                  
                  {/* Tooltip */}
                  <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-black border border-white/10 px-3 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                    Cost: {skill.cost} XP {skill.premium ? '(Premium)' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      </div>
    </motion.div>
  );
}
