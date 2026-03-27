import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { format } from 'date-fns';

export interface BrainStats {
  speed: number; memory: number; logic: number; focus: number; mathIQ: number;
}

export interface Mission {
  id: string; title: string; description: string; xpReward: number;
  completed: boolean; category: string; progress: number; target: number;
}

export interface HistoryEntry {
  id: string; date: string; score: number; category: string;
  accuracy: number; speedMs?: number; gameType?: string;
  correct?: number; wrong?: number; combo?: number; lives?: number;
  domain?: string; difficulty?: number;
}

export interface GameSession {
  gameId: string; gameName: string; domain: string;
  score: number; accuracy: number; avgResponseMs: number;
  correct: number; wrong: number; maxCombo: number;
  xpEarned: number; timestamp: string; difficulty: number;
}

export interface AppState {
  brainScore: number; xp: number; level: number; streak: number;
  lastPlayDate: string | null; energy: number;
  stats: BrainStats; history: HistoryEntry[]; gameSessions: GameSession[];
  achievements: string[]; unlockedSkills: string[];
  missions: Mission[]; isPremium: boolean;
  highScores: Record<string, number>;
  totalGamesPlayed: number; totalCorrect: number; totalWrong: number;
  settings: { notifications: boolean; sound: boolean; difficulty: 'Easy'|'Normal'|'Hard'; dailyGoal: number; }
}

const defaultStats: BrainStats = { speed: 20, memory: 20, logic: 20, focus: 20, mathIQ: 20 };
const MAX_ENERGY = 1000;

const defaultState: AppState = {
  brainScore: 500, xp: 0, level: 1, streak: 0, lastPlayDate: null,
  energy: MAX_ENERGY, stats: defaultStats, history: [], gameSessions: [],
  achievements: [], unlockedSkills: [], missions: [], isPremium: false,
  highScores: {}, totalGamesPlayed: 0, totalCorrect: 0, totalWrong: 0,
  settings: { notifications: true, sound: true, difficulty: 'Normal', dailyGoal: 3 }
};

interface AppContextType {
  state: AppState;
  addXP: (amount: number) => void;
  updateStat: (stat: keyof BrainStats, amount: number) => void;
  addHistory: (entry: Omit<HistoryEntry, 'id'>) => void;
  addGameSession: (session: GameSession) => void;
  consumeEnergy: (amount: number) => boolean;
  updateMissions: (missions: Mission[]) => void;
  progressMissionCategory: (category: string, amount: number) => void;
  unlockSkill: (skillId: string) => void;
  togglePremium: () => void;
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  resetProgress: () => void;
  updateHighScore: (gameId: string, score: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('brainUpgradeState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrate energy to new max
        if (parsed.energy !== undefined && parsed.energy < 100) parsed.energy = MAX_ENERGY;
        return { ...defaultState, ...parsed };
      } catch { }
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem('brainUpgradeState', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setState(prev => {
      const lastPlay = prev.lastPlayDate;
      let newStreak = prev.streak;
      let newEnergy = prev.energy;
      if (lastPlay !== today) {
        newEnergy = MAX_ENERGY;
        if (lastPlay) {
          const diff = Math.floor((new Date(today).getTime() - new Date(lastPlay).getTime()) / 86400000);
          if (diff > 1) newStreak = 0;
        }
      }
      return { ...prev, streak: newStreak, energy: newEnergy };
    });
  }, []);

  const addXP = (amount: number) => setState(prev => {
    let xp = prev.xp + amount, level = prev.level;
    while (xp >= level * 100) { xp -= level * 100; level++; }
    return { ...prev, xp, level };
  });

  const updateStat = (stat: keyof BrainStats, amount: number) => setState(prev => {
    const s = { ...prev.stats, [stat]: Math.min(100, Math.max(0, prev.stats[stat] + amount)) };
    const avg = Object.values(s).reduce((a, b) => a + b, 0) / 5;
    return { ...prev, stats: s, brainScore: Math.floor(avg * 10) };
  });

  const addHistory = (entry: Omit<HistoryEntry, 'id'>) => setState(prev => {
    const today = format(new Date(), 'yyyy-MM-dd');
    let streak = prev.streak;
    if (prev.lastPlayDate !== today) streak += 1;
    return {
      ...prev, streak, lastPlayDate: today,
      totalGamesPlayed: prev.totalGamesPlayed + 1,
      totalCorrect: prev.totalCorrect + (entry.correct || 0),
      totalWrong: prev.totalWrong + (entry.wrong || 0),
      history: [{ ...entry, id: Math.random().toString(36).substr(2,9) }, ...prev.history].slice(0, 200)
    };
  });

  const addGameSession = (session: GameSession) => setState(prev => {
    const today = format(new Date(), 'yyyy-MM-dd');
    let streak = prev.streak;
    if (prev.lastPlayDate !== today) streak += 1;
    const prevHigh = prev.highScores[session.gameId] || 0;
    return {
      ...prev, streak, lastPlayDate: today,
      totalGamesPlayed: prev.totalGamesPlayed + 1,
      totalCorrect: prev.totalCorrect + session.correct,
      totalWrong: prev.totalWrong + session.wrong,
      highScores: { ...prev.highScores, [session.gameId]: Math.max(prevHigh, session.score) },
      gameSessions: [session, ...prev.gameSessions].slice(0, 500)
    };
  });

  const consumeEnergy = (amount: number) => {
    if (state.energy < amount) return false;
    setState(prev => ({ ...prev, energy: Math.max(0, prev.energy - amount) }));
    return true;
  };

  const updateHighScore = (gameId: string, score: number) => setState(prev => ({
    ...prev, highScores: { ...prev.highScores, [gameId]: Math.max(prev.highScores[gameId] || 0, score) }
  }));

  const updateMissions = (missions: Mission[]) => setState(prev => ({ ...prev, missions }));

  const progressMissionCategory = (category: string, amount: number) => setState(prev => {
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
    if (xpToAward > 0) setTimeout(() => addXP(xpToAward), 0);
    return { ...prev, missions: newMissions };
  });

  const unlockSkill = (skillId: string) => setState(prev =>
    prev.unlockedSkills.includes(skillId) ? prev : { ...prev, unlockedSkills: [...prev.unlockedSkills, skillId] }
  );
  const togglePremium = () => setState(prev => ({ ...prev, isPremium: !prev.isPremium }));
  const updateSettings = (settings: Partial<AppState['settings']>) =>
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...settings } }));
  const resetProgress = () => setState(defaultState);

  return (
    <AppContext.Provider value={{
      state, addXP, updateStat, addHistory, addGameSession, consumeEnergy,
      updateMissions, progressMissionCategory, unlockSkill,
      togglePremium, updateSettings, resetProgress, updateHighScore
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
