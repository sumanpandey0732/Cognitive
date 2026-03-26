import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { Bell, Volume2, ShieldAlert, Trash2, Sliders } from 'lucide-react';

export default function Settings() {
  const { state, updateSettings, resetProgress } = useAppContext();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    resetProgress();
    setShowResetConfirm(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 max-w-3xl mx-auto"
    >
      <header>
        <h1 className="text-4xl font-display font-black text-foreground">SYSTEM PREFS</h1>
        <p className="text-muted-foreground mt-2">Configure operating parameters.</p>
      </header>

      <div className="glass-panel rounded-3xl overflow-hidden divide-y divide-white/5">
        
        {/* Toggle Items */}
        <div className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-white">Neural Notifications</p>
              <p className="text-sm text-muted-foreground">Receive daily mission alerts.</p>
            </div>
          </div>
          <button 
            onClick={() => updateSettings({ notifications: !state.settings.notifications })}
            className={`w-14 h-7 rounded-full p-1 transition-colors ${state.settings.notifications ? 'bg-primary' : 'bg-white/10'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${state.settings.notifications ? 'translate-x-7 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-bold text-white">Haptic Feedback & Sound</p>
              <p className="text-sm text-muted-foreground">UI interaction sounds.</p>
            </div>
          </div>
          <button 
            onClick={() => updateSettings({ sound: !state.settings.sound })}
            className={`w-14 h-7 rounded-full p-1 transition-colors ${state.settings.sound ? 'bg-accent' : 'bg-white/10'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${state.settings.sound ? 'translate-x-7 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Select Items */}
        <div className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
              <Sliders className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="font-bold text-white">Base Difficulty</p>
              <p className="text-sm text-muted-foreground">Default complexity of puzzles.</p>
            </div>
          </div>
          <select 
            value={state.settings.difficulty}
            onChange={(e) => updateSettings({ difficulty: e.target.value as any })}
            className="bg-black border border-white/20 text-white rounded-lg px-4 py-2 outline-none focus:border-primary"
          >
            <option value="Easy">Easy</option>
            <option value="Normal">Normal</option>
            <option value="Hard">Hardcore</option>
          </select>
        </div>

      </div>

      {/* Danger Zone */}
      <div className="glass-panel rounded-3xl p-6 border-red-500/20 mt-8">
        <h3 className="text-red-500 font-bold mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" /> DANGER ZONE
        </h3>
        <p className="text-muted-foreground text-sm mb-6">Irreversible actions that wipe neural memory.</p>
        
        {showResetConfirm ? (
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
            <p className="text-white font-bold mb-4">Are you absolutely sure? This will wipe all XP and Stats.</p>
            <div className="flex gap-4">
              <button 
                onClick={handleReset}
                className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-2 rounded-lg transition-colors"
              >
                Yes, Wipe Memory
              </button>
              <button 
                onClick={() => setShowResetConfirm(false)}
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 font-bold px-4 py-2 border border-red-500/50 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Reset All Progress
          </button>
        )}
      </div>

    </motion.div>
  );
}
