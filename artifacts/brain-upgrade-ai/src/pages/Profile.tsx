import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { Crown, Edit2, Medal, Zap } from 'lucide-react';

export default function Profile() {
  const { state, togglePremium } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('CyberUser_99');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 max-w-4xl mx-auto"
    >
      
      {/* Header / Avatar Card */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
        {state.isPremium && (
          <div className="absolute top-0 right-0 p-6">
            <div className="bg-gradient-to-r from-amber-400 to-yellow-600 text-black font-bold px-4 py-1 rounded-full flex items-center gap-2 text-sm shadow-[0_0_15px_rgba(251,191,36,0.5)]">
              <Crown className="w-4 h-4" /> VIP STATUS
            </div>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary shadow-[0_0_30px_rgba(0,255,255,0.3)] bg-black">
              <img src={`${import.meta.env.BASE_URL}images/avatar.png`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-3 -right-3 bg-accent text-white font-display font-bold w-12 h-12 flex items-center justify-center rounded-full border-4 border-background shadow-[0_0_15px_rgba(138,43,226,0.6)]">
              {state.level}
            </div>
          </div>
          
          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              {isEditing ? (
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => setIsEditing(false)}
                  autoFocus
                  className="bg-black/50 border border-primary/50 text-white px-3 py-1 rounded-lg text-3xl font-display font-black w-full max-w-[250px] outline-none"
                />
              ) : (
                <h1 className="text-4xl font-display font-black text-white">{username}</h1>
              )}
              <button onClick={() => setIsEditing(!isEditing)} className="text-muted-foreground hover:text-white">
                <Edit2 className="w-5 h-5" />
              </button>
            </div>
            <p className="text-primary tracking-widest uppercase font-bold text-sm">Neural Operative</p>
            
            <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-4">
              <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Total Sessions</p>
                <p className="text-xl font-bold text-white">{state.history.length}</p>
              </div>
              <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Best Streak</p>
                <p className="text-xl font-bold text-orange-400">{Math.max(state.streak, 1)} <FlameIcon /></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Achievements */}
        <div className="glass-panel p-6 rounded-3xl">
          <h3 className="text-lg font-display font-bold text-white mb-4">Badges</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="aspect-square bg-white/5 rounded-2xl flex flex-col items-center justify-center border border-primary/30 shadow-[0_0_10px_rgba(0,255,255,0.1)]">
              <Medal className="w-8 h-8 text-primary mb-2" />
              <span className="text-xs font-bold text-center">First Node</span>
            </div>
            <div className="aspect-square bg-white/5 rounded-2xl flex flex-col items-center justify-center opacity-50 grayscale border border-white/10">
              <Zap className="w-8 h-8 text-white mb-2" />
              <span className="text-xs font-bold text-center">Speed King</span>
            </div>
            <div className="aspect-square bg-white/5 rounded-2xl flex flex-col items-center justify-center opacity-50 grayscale border border-white/10">
              <Crown className="w-8 h-8 text-white mb-2" />
              <span className="text-xs font-bold text-center">100 Days</span>
            </div>
          </div>
        </div>

        {/* Upgrade Card */}
        <div className={`p-6 rounded-3xl relative overflow-hidden ${state.isPremium ? 'bg-gradient-to-br from-amber-500/20 to-yellow-700/20 border border-amber-500/50' : 'glass-panel border-accent/50'}`}>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-display font-bold text-white mb-2">
                {state.isPremium ? 'Premium Active' : 'Upgrade to Neural Pro'}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {state.isPremium ? 'All advanced modules and AI features unlocked.' : 'Unlock AI coaching, decision simulators, and advanced telemetry.'}
              </p>
            </div>
            <button 
              onClick={togglePremium}
              className={`w-full py-4 font-bold rounded-xl transition-all ${state.isPremium ? 'bg-black/50 text-white hover:bg-black/70' : 'bg-accent text-white shadow-[0_0_15px_rgba(138,43,226,0.5)] hover:bg-white hover:text-black'}`}
            >
              {state.isPremium ? 'Manage Subscription' : 'ACTIVATE PREMIUM'}
            </button>
          </div>
        </div>
      </div>

    </motion.div>
  );
}

function FlameIcon() {
  return <svg className="w-4 h-4 inline-block text-orange-500 -mt-1" fill="currentColor" viewBox="0 0 20 20"><path d="M11.644 1.59a.75.75 0 01.073.828c-.82 1.341-1.378 2.658-1.558 3.753-.133.805.023 1.516.388 2.052.26.384.629.689 1.109.845.54.218 1.18.256 1.942.062a.75.75 0 01.884.51c.361 1.05.412 2.14.183 3.125-.236 1.01-.735 1.93-1.463 2.651a5.25 5.25 0 01-3.69 1.528 5.228 5.228 0 01-3.535-1.37A5.405 5.405 0 014 10.963c0-2.316 1.258-4.57 2.894-6.39.554-.617 1.157-1.198 1.79-1.74a.75.75 0 011.085.048c.552.628 1.083 1.285 1.572 1.96.208.286.41.58.604.881a.75.75 0 01-1.229.835c-.146-.226-.301-.46-.463-.7z"/></svg>;
}
