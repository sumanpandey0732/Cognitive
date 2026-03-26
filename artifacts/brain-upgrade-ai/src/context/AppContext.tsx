import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { format } from 'date-fns';

export interface BrainStats {
  speed: number;
  memory: number;
  logic: number;
  focus: number;
  mathIQ: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  completed: boolean;
  category: string;
  progress: number;
  target: number;
}

export interface HistoryEntry {
  id: string;
  date: string;
  score: number;
  category: string;
  accuracy: number;
  speedMs?: number;
}

export interface AppState {
  brainScore: number;
  xp: number;
  level: number;
  streak: number;
  lastPlayDate: string | null;
  energy: number;
  stats: BrainStats;
  history: HistoryEntry[];
  achievements: string[];
  unlockedSkills: string[];
  missions: Mission[];
  isPremium: boolean;
  settings: {
    notifications: boolean;
    sound: boolean;
    difficulty: 'Easy' | 'Normal' | 'Hard';
    dailyGoal: number;
  }
}

const defaultStats: BrainStats = {
  speed: 20,
  memory: 20,
  logic: 20,
  focus: 20,
  mathIQ: 20,
};

const defaultState: AppState = {
  brainScore: 500,
  xp: 0,
  level: 1,
  streak: 0,
  lastPlayDate: null,
  energy: 100,
  stats: defaultStats,
  history: [],
  achievements: [],
  unlockedSkills: [],
  missions: [],
  isPremium: false,
  settings: {
    notifications: true,
    sound: true,
    difficulty: 'Normal',
    dailyGoal: 3,
  }
};

interface AppContextType {
  state: AppState;
  addXP: (amount: number) => void;
  updateStat: (stat: keyof BrainStats, amount: number) => void;
  addHistory: (entry: Omit<HistoryEntry, 'id'>) => void;
  consumeEnergy: (amount: number) => boolean;
  updateMissions: (missions: Mission[]) => void;
  progressMissionCategory: (category: string, amount: number) => void;
  unlockSkill: (skillId: string) => void;
  togglePremium: () => void;
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  resetProgress: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('brainUpgradeState');
    if (saved) {
      try {
        return { ...defaultState, ...JSON.parse(saved) };
      } catch (e) {
        console.error("Failed to parse state", e);
      }
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem('brainUpgradeState', JSON.stringify(state));
  }, [state]);

  // Streak logic and Energy Recovery logic on mount
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    setState(prev => {
      let newStreak = prev.streak;
      const lastPlay = prev.lastPlayDate;
      
      if (lastPlay !== today) {
        // Recover energy
        prev.energy = 100;
        
        if (lastPlay) {
          const lastDate = new Date(lastPlay);
          const current = new Date(today);
          const diffDays = Math.floor((current.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
          
          if (diffDays === 1) {
            // Keep streak alive, handled later when they actually play
          } else if (diffDays > 1) {
            newStreak = 0; // Lost streak
          }
        }
      }
      return { ...prev, streak: newStreak, energy: prev.energy };
    });
  }, []);

  const addXP = (amount: number) => {
    setState(prev => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      const nextLevelXp = newLevel * 100;
      
      if (newXp >= nextLevelXp) {
        newLevel += 1;
        newXp -= nextLevelXp;
        // Optionally trigger a level up notification
      }
      return { ...prev, xp: newXp, level: newLevel };
    });
  };

  const updateStat = (stat: keyof BrainStats, amount: number) => {
    setState(prev => {
      const newStats = { ...prev.stats };
      newStats[stat] = Math.min(100, Math.max(0, newStats[stat] + amount));
      
      // Update Brain Score based on avg stats
      const avg = Object.values(newStats).reduce((a, b) => a + b, 0) / 5;
      const newScore = Math.floor(avg * 10);
      
      return { ...prev, stats: newStats, brainScore: newScore };
    });
  };

  const addHistory = (entry: Omit<HistoryEntry, 'id'>) => {
    setState(prev => {
      const today = format(new Date(), 'yyyy-MM-dd');
      let newStreak = prev.streak;
      
      if (prev.lastPlayDate !== today) {
        newStreak += 1;
      }

      return {
        ...prev,
        streak: newStreak,
        lastPlayDate: today,
        history: [{ ...entry, id: Math.random().toString(36).substr(2, 9) }, ...prev.history].slice(0, 100) // keep last 100
      };
    });
  };

  const consumeEnergy = (amount: number) => {
    if (state.energy < amount) return false;
    setState(prev => ({ ...prev, energy: Math.max(0, prev.energy - amount) }));
    return true;
  };

  const updateMissions = (missions: Mission[]) => {
    setState(prev => ({ ...prev, missions }));
  };

  const progressMissionCategory = (category: string, amount: number) => {
    setState(prev => {
      let xpToAward = 0;
      const newMissions = prev.missions.map(m => {
        if (m.category === category && !m.completed) {
          const newProgress = Math.min(m.target, m.progress + amount);
          const completed = newProgress >= m.target;
          if (completed) xpToAward += m.xpReward;
          return { ...m, progress: newProgress, completed };
        }
        return m;
      });
      
      if (xpToAward > 0) {
        setTimeout(() => addXP(xpToAward), 0);
      }
      
      return { ...prev, missions: newMissions };
    });
  };

  const unlockSkill = (skillId: string) => {
    setState(prev => {
      if (!prev.unlockedSkills.includes(skillId)) {
        return { ...prev, unlockedSkills: [...prev.unlockedSkills, skillId] };
      }
      return prev;
    });
  };

  const togglePremium = () => {
    setState(prev => ({ ...prev, isPremium: !prev.isPremium }));
  };

  const updateSettings = (settings: Partial<AppState['settings']>) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...settings } }));
  };

  const resetProgress = () => {
    setState(defaultState);
  };

  return (
    <AppContext.Provider value={{
      state, addXP, updateStat, addHistory, consumeEnergy, 
      updateMissions, progressMissionCategory, unlockSkill, 
      togglePremium, updateSettings, resetProgress
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
}
