import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams } from 'wouter';
import { ArrowLeft, Heart, Zap, Trophy, TrendingUp, Brain } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { GameSession } from '@/context/AppContext';
import { ALL_GAMES } from './Games';

// Game imports
import FallingClouds from '@/games/FallingClouds';
import NumberTap from '@/games/NumberTap';
import ColorSequence from '@/games/ColorSequence';
import MemoryCardFlip from '@/games/MemoryCardFlip';
import BubblePop from '@/games/BubblePop';
import StroopChallenge from '@/games/StroopChallenge';
import PatternSimon from '@/games/PatternSimon';
import WordScramble from '@/games/WordScramble';
import TargetTap from '@/games/TargetTap';
import DualTask from '@/games/DualTask';
import MathBlaster from '@/games/MathBlaster';
import SpeedSort from '@/games/SpeedSort';
import ReactionChain from '@/games/ReactionChain';

type GameState = 'lobby' | 'playing' | 'result';

const DOMAIN_STAT: Record<string, string> = {
  'Speed Math': 'mathIQ',
  'Memory': 'memory',
  'Focus': 'focus',
  'Speed': 'speed',
  'Logic': 'logic',
  'Verbal': 'focus',
  'Multitask': 'logic',
};

function GameComponent({ gameId, onFinish }: { gameId: string; onFinish: (s: Partial<GameSession>) => void }) {
  switch (gameId) {
    case 'falling-clouds': return <FallingClouds onFinish={onFinish} />;
    case 'number-tap': return <NumberTap onFinish={onFinish} />;
    case 'color-sequence': return <ColorSequence onFinish={onFinish} />;
    case 'memory-cards': return <MemoryCardFlip onFinish={onFinish} />;
    case 'bubble-pop': return <BubblePop onFinish={onFinish} />;
    case 'stroop': return <StroopChallenge onFinish={onFinish} />;
    case 'pattern-simon': return <PatternSimon onFinish={onFinish} />;
    case 'word-scramble': return <WordScramble onFinish={onFinish} />;
    case 'target-tap': return <TargetTap onFinish={onFinish} />;
    case 'dual-task': return <DualTask onFinish={onFinish} />;
    case 'math-blaster': return <MathBlaster onFinish={onFinish} />;
    case 'speed-sort': return <SpeedSort onFinish={onFinish} />;
    case 'reaction-chain': return <ReactionChain onFinish={onFinish} />;
    default: return <div className="text-center py-12 text-gray-400">Game not found: {gameId}</div>;
  }
}

export default function GamePlay() {
  const { id } = useParams<{ id: string }>();
  const gameId = id || '';
  const { state, addXP, updateStat, addGameSession, consumeEnergy, updateHighScore } = useAppContext();
  const [gameState, setGameState] = useState<GameState>('lobby');
  const [session, setSession] = useState<Partial<GameSession> | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const prevLevel = React.useRef(state.level);

  const meta = ALL_GAMES.find(g => g.id === gameId);

  useEffect(() => {
    if (state.level > prevLevel.current) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 2500);
    }
    prevLevel.current = state.level;
  }, [state.level]);

  const handleStart = () => {
    if (meta && state.energy < meta.energy) {
      alert('Not enough energy! Come back tomorrow or try a cheaper game.');
      return;
    }
    if (meta) consumeEnergy(meta.energy);
    setGameState('playing');
  };

  const handleFinish = (s: Partial<GameSession>) => {
    const full: GameSession = {
      gameId, gameName: meta?.title || gameId, domain: meta?.domain || 'Mixed',
      score: s.score || 0, accuracy: s.accuracy || 0,
      avgResponseMs: s.avgResponseMs || 0, correct: s.correct || 0,
      wrong: s.wrong || 0, maxCombo: s.maxCombo || 0,
      xpEarned: s.xpEarned || 0, difficulty: s.difficulty || 1,
      timestamp: new Date().toISOString()
    };
    setSession(full);

    // Write to context
    addGameSession(full);
    updateHighScore(gameId, full.score);
    if (full.xpEarned > 0) addXP(full.xpEarned);

    // Update domain stat
    const statKey = DOMAIN_STAT[full.domain] as any;
    if (statKey) {
      const improvement = full.accuracy >= 80 ? 2 : full.accuracy >= 60 ? 1 : 0;
      if (improvement > 0) updateStat(statKey, improvement);
    }

    setGameState('result');
  };

  const handleReplay = () => {
    setSession(null);
    setGameState('lobby');
  };

  if (!meta) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-gray-400 text-lg">Game not found</p>
        <Link href="/games"><a className="text-cyan-400 hover:underline">← Back to Games</a></Link>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      {/* Level up flash */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="text-center"
              initial={{ scale: 0.5 }} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}>
              <p className="text-7xl font-black text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.8)]">LEVEL UP!</p>
              <p className="text-2xl text-white">→ Level {state.level}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/games">
          <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-white">{meta.title}</h1>
          <p className="text-sm text-gray-400">{meta.domain} • {meta.xpRange} XP</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-yellow-400">
            <Zap className="w-4 h-4" /> {state.energy}
          </div>
          <div className="flex items-center gap-1 text-cyan-400">
            <Brain className="w-4 h-4" /> Lv.{state.level}
          </div>
        </div>
      </div>

      {/* Content */}
      {gameState === 'lobby' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8 rounded-3xl text-center space-y-6">
          <div className="text-6xl">{meta.icon}</div>
          <div>
            <h2 className="text-3xl font-black text-white mb-2">{meta.title}</h2>
            <p className="text-gray-400 max-w-md mx-auto">{meta.description}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
            <div className="glass-panel p-3 rounded-xl text-center">
              <p className="text-xs text-gray-400">Domain</p>
              <p className="text-sm font-bold text-white">{meta.domain}</p>
            </div>
            <div className="glass-panel p-3 rounded-xl text-center">
              <Zap className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
              <p className="text-xs text-gray-400">Energy</p>
              <p className="text-sm font-bold text-yellow-400">{meta.energy}</p>
            </div>
            <div className="glass-panel p-3 rounded-xl text-center">
              <TrendingUp className="w-4 h-4 text-green-400 mx-auto mb-1" />
              <p className="text-xs text-gray-400">XP</p>
              <p className="text-sm font-bold text-green-400">{meta.xpRange}</p>
            </div>
          </div>
          {state.highScores[gameId] && (
            <div className="flex items-center justify-center gap-2 text-yellow-400">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-bold">Best Score: {state.highScores[gameId]}</span>
            </div>
          )}
          <motion.button onClick={handleStart} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            disabled={state.energy < meta.energy}
            className="px-12 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-black text-lg rounded-xl shadow-lg hover:shadow-cyan-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            {state.energy >= meta.energy ? '▶ START GAME' : `⚡ Need ${meta.energy} energy`}
          </motion.button>
        </motion.div>
      )}

      {gameState === 'playing' && (
        <div className="glass-panel p-6 rounded-3xl">
          <GameComponent gameId={gameId} onFinish={handleFinish} />
        </div>
      )}

      {gameState === 'result' && session && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 rounded-3xl space-y-6">
          <div className="text-center">
            <div className="text-5xl mb-3">{session.accuracy! >= 80 ? '🏆' : session.accuracy! >= 60 ? '⭐' : '🧠'}</div>
            <h2 className="text-3xl font-black text-white">
              {session.accuracy! >= 80 ? 'Excellent!' : session.accuracy! >= 60 ? 'Good Job!' : 'Keep Training!'}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l: 'Score', v: session.score, c: 'text-cyan-400', ico: '🎯' },
              { l: 'Accuracy', v: `${session.accuracy}%`, c: session.accuracy! >= 70 ? 'text-green-400' : 'text-orange-400', ico: '✓' },
              { l: 'XP Earned', v: `+${session.xpEarned}`, c: 'text-yellow-400', ico: '⚡' },
              { l: 'Max Combo', v: `×${session.maxCombo}`, c: 'text-purple-400', ico: '🔥' },
            ].map(s => (
              <div key={s.l} className="glass-panel p-3 rounded-xl text-center border border-white/5">
                <p className="text-lg">{s.ico}</p>
                <p className={`text-xl font-black ${s.c}`}>{s.v}</p>
                <p className="text-xs text-gray-400">{s.l}</p>
              </div>
            ))}
          </div>
          {/* High score indicator */}
          {session.score === state.highScores[gameId] && session.score! > 0 && (
            <div className="text-center">
              <span className="inline-flex items-center gap-2 text-yellow-400 font-bold text-sm border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 rounded-full">
                <Trophy className="w-4 h-4" /> New High Score!
              </span>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={handleReplay}
              className="flex-1 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl font-bold text-white transition-all">
              ↩ Play Again
            </button>
            <Link href="/games" className="flex-1">
              <button className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-bold rounded-xl hover:scale-105 transition-all">
                ← All Games
              </button>
            </Link>
          </div>
          <Link href="/analytics" className="block text-center text-xs text-cyan-400 hover:underline">
            View Brain Analytics →
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
