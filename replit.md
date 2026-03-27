# Brain Upgrade AI — Project Documentation

## Overview
A production-level brain training web app built with React + Vite. Dark cyberpunk theme (black/navy, neon cyan/purple). Inspired by Lumosity + Peak + AI lab.

## Tech Stack
- **Framework**: React 18 + Vite 7 + TypeScript
- **Routing**: wouter
- **Styling**: Tailwind CSS + custom cyberpunk CSS (glassmorphism, glow effects)
- **Animation**: Framer Motion
- **Charts**: Recharts (RadarChart, AreaChart, LineChart, BarChart)
- **Icons**: Lucide React
- **State**: React Context + localStorage
- **AI**: OpenRouter API (model: openai/gpt-4o-mini) via `VITE_OPENROUTER_API_KEY`
- **Date utils**: date-fns

## Architecture

### Entry Points
- `src/App.tsx` — Router, QueryClientProvider, AppProvider wrapper
- `src/context/AppContext.tsx` — Global state: XP, level, energy (1000/day), stats, sessions, highScores

### Pages (src/pages/)
| Page | Route | Description |
|------|-------|-------------|
| Home | / | Dashboard: brain score, featured games, recent sessions, stats |
| Games | /games | Mini-games hub: 13 interactive games, category filter |
| GamePlay | /play/:id | Game wrapper: lobby → playing → result with XP/analytics tracking |
| Train | /train | MCQ training modules (8 modes) |
| Challenge | /challenge?mode=X | AI-powered MCQ challenge |
| Analytics | /analytics | Brain analytics: radar, heatmaps, trends, brain report |
| Missions | /missions | Daily/weekly missions |
| Stats | /stats | Detailed stats |
| SkillTree | /skilltree | Skill unlock tree |
| Profile | /profile | User profile |
| Settings | /settings | App settings |

### Mini-Games (src/games/)
13 real interactive games, all feed into analytics:

| Game ID | File | Domain |
|---------|------|--------|
| falling-clouds | FallingClouds.tsx | Speed Math — math problems fall, tap correct answer |
| bubble-pop | BubblePop.tsx | Speed Math — pop bubbles with correct answers |
| math-blaster | MathBlaster.tsx | Speed Math — rapid fire with timer |
| color-sequence | ColorSequence.tsx | Memory — Simon Says colors |
| memory-cards | MemoryCardFlip.tsx | Memory — card pair matching |
| pattern-simon | PatternSimon.tsx | Memory — 4-pad sequence |
| stroop | StroopChallenge.tsx | Focus — color vs word conflict |
| number-tap | NumberTap.tsx | Focus — tap 1→25 in order |
| target-tap | TargetTap.tsx | Speed — moving target precision |
| speed-sort | SpeedSort.tsx | Logic — sort numbers fast |
| word-scramble | WordScramble.tsx | Verbal — unscramble words |
| dual-task | DualTask.tsx | Multitask — math + color recall simultaneously |
| reaction-chain | ReactionChain.tsx | Speed — only tap target color |

### Game Engine (src/games/gameEngine.ts)
100+ MCQ question types for the Train/Challenge modes:
- Math (25 types), Logic (15), Memory (11), IQ (11), Speed, Pattern

### AI Service (src/services/aiService.ts)
- Calls OpenRouter API with `VITE_OPENROUTER_API_KEY`
- Model: `openai/gpt-4o-mini`
- Generates MCQs for challenge mode

## State Management

### AppContext State
```ts
{
  brainScore: number;      // 0-1000
  xp: number; level: number; streak: number;
  energy: number;          // 0-1000, resets daily
  stats: {                 // all 0-100
    speed, memory, logic, focus, mathIQ
  };
  history: HistoryEntry[];     // MCQ session history
  gameSessions: GameSession[]; // mini-game sessions (500 max)
  highScores: Record<string, number>; // per game
  totalGamesPlayed: number; totalCorrect: number; totalWrong: number;
  missions: Mission[];
  settings: { sound, notifications, difficulty, dailyGoal };
}
```

### Analytics Tracking
Each GameSession stores: gameId, gameName, domain, score, accuracy, avgResponseMs, correct, wrong, maxCombo, xpEarned, difficulty, timestamp

## Game Mechanics
- ❤️ Lives system (3-5 lives per game)
- 🔥 Combo multiplier (up to ×5)
- ⚡ Energy cost per game (8-20 energy)
- 🏆 High score tracking per game
- Adaptive difficulty: speed/numbers increase as you progress
- XP → Level progression (level × 100 XP per level)
- Stats improve based on accuracy (≥80% = +2, ≥60% = +1)

## Environment Variables
- `VITE_OPENROUTER_API_KEY` — OpenRouter API key for AI MCQ generation

## CSS Design System
- Background: `#0A0A1A` (deep dark navy)
- Primary: `#00FFFF` (neon cyan)
- Accent: `#8A2BE2` (violet)
- Glass: `.glass-panel` — backdrop blur + border
- Glow: `.box-glow-cyan`, `.text-glow-cyan`
- Animate: `.animate-pulse-score`, `.particle`

## Port
- Vite dev server: port from `$PORT` env var (currently 21394)
