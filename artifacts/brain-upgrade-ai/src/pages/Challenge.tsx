import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearch, Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Zap, Brain, Timer } from 'lucide-react';
import { generateQuestionBatch, generateQuestion, Question, ModeKey } from '@/games/gameEngine';
import { aiService } from '@/services/aiService';

// ─── Reaction Game Component ─────────────────────────────────────────────────
function ReactionGame({ onFinish }: { onFinish: (times: number[]) => void }) {
  const [phase, setPhase] = useState<'wait' | 'flash' | 'too-early' | 'done'>('wait');
  const [times, setTimes] = useState<number[]>([]);
  const [round, setRound] = useState(1);
  const totalRounds = 8;
  const startRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedulFlash = useCallback(() => {
    setPhase('wait');
    const delay = Math.random() * 2500 + 1000;
    timerRef.current = setTimeout(() => {
      startRef.current = Date.now();
      setPhase('flash');
    }, delay);
  }, []);

  useEffect(() => { schedulFlash(); return () => { if (timerRef.current) clearTimeout(timerRef.current); }; }, []);

  const handleClick = () => {
    if (phase === 'wait') {
      if (timerRef.current) clearTimeout(timerRef.current);
      setPhase('too-early');
      setTimeout(() => {
        if (round >= totalRounds) { onFinish(times); return; }
        setRound(r => r + 1);
        schedulFlash();
      }, 1200);
    } else if (phase === 'flash') {
      const rt = Date.now() - startRef.current;
      const newTimes = [...times, rt];
      setTimes(newTimes);
      if (round >= totalRounds) { onFinish(newTimes); return; }
      setRound(r => r + 1);
      schedulFlash();
    }
  };

  const colors = { wait: 'bg-gray-900 border-white/10', flash: 'bg-cyan-500 border-cyan-300', 'too-early': 'bg-red-600 border-red-400', done: 'bg-gray-900 border-white/10' };

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div className="flex justify-between w-full max-w-lg text-sm text-gray-400">
        <span>Round {round}/{totalRounds}</span>
        <span>{times.length > 0 ? `Best: ${Math.min(...times)}ms` : 'Ready'}</span>
      </div>
      <motion.div
        className={`w-full max-w-lg h-64 rounded-3xl border-2 cursor-pointer flex items-center justify-center transition-colors duration-100 select-none ${colors[phase]}`}
        whileTap={{ scale: 0.97 }}
        onClick={handleClick}
      >
        <div className="text-center pointer-events-none">
          {phase === 'wait' && <p className="text-2xl text-gray-400 font-bold">Wait for CYAN...</p>}
          {phase === 'flash' && <p className="text-4xl font-black text-black">CLICK NOW!</p>}
          {phase === 'too-early' && <p className="text-2xl font-bold text-white">Too early! ⚡</p>}
        </div>
      </motion.div>
      <div className="flex gap-2 flex-wrap justify-center">
        {times.map((t, i) => (
          <span key={i} className="px-3 py-1 rounded-full text-xs font-mono bg-white/5 border border-white/10">
            {t}ms
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Memory Grid Game ─────────────────────────────────────────────────────────
function MemoryGridGame({ q, onAnswer }: { q: Question; onAnswer: (correct: boolean) => void }) {
  const [phase, setPhase] = useState<'show' | 'recall'>('show');
  const [selected, setSelected] = useState<boolean[]>(Array(q.memoryGrid!.length).fill(false));
  const gridSize = q.gridSize || 3;

  useEffect(() => {
    const t = setTimeout(() => setPhase('recall'), 3000);
    return () => clearTimeout(t);
  }, []);

  const toggle = (i: number) => {
    if (phase !== 'recall') return;
    setSelected(prev => { const n = [...prev]; n[i] = !n[i]; return n; });
  };

  const submit = () => {
    const correctStr = q.memoryGrid!.map(b => b ? '1' : '0').join('');
    const userStr = selected.map(b => b ? '1' : '0').join('');
    onAnswer(correctStr === userStr);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <AnimatePresence mode="wait">
        {phase === 'show' ? (
          <motion.div key="show" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-center text-cyan-400 font-bold mb-4 animate-pulse">Memorize this pattern!</p>
            <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
              {q.memoryGrid!.map((lit, i) => (
                <div key={i} className={`w-16 h-16 rounded-xl border-2 transition-all ${lit ? 'bg-cyan-500 border-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.7)]' : 'bg-white/5 border-white/10'}`} />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="recall" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-center text-purple-400 font-bold mb-4">Recreate the pattern!</p>
            <div className={`grid gap-2 mb-4`} style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
              {selected.map((sel, i) => (
                <div key={i} onClick={() => toggle(i)}
                  className={`w-16 h-16 rounded-xl border-2 cursor-pointer transition-all ${sel ? 'bg-cyan-500 border-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.6)]' : 'bg-white/5 border-white/10 hover:border-white/30'}`} />
              ))}
            </div>
            <button onClick={submit} className="w-full py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-all">
              Submit Pattern
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Memory Type Game ─────────────────────────────────────────────────────────
function MemoryTypeGame({ q, onAnswer }: { q: Question; onAnswer: (correct: boolean) => void }) {
  const [phase, setPhase] = useState<'show' | 'recall'>('show');
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(q.memorySequence?.length ? q.memorySequence.length * 1.5 + 2 : 5);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(interval); setPhase('recall'); setTimeout(() => inputRef.current?.focus(), 100); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const sequence = q.memorySequence || [];
  const isCountingMode = q.type === 'counting-mem';

  const submit = () => {
    const correct = input.trim().toLowerCase() === q.answer.toLowerCase();
    onAnswer(correct);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md text-center">
      <AnimatePresence mode="wait">
        {phase === 'show' ? (
          <motion.div key="show" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Timer className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-mono text-xl">{Math.ceil(timeLeft)}s</span>
            </div>
            {isCountingMode ? (
              <div className="flex flex-wrap justify-center gap-1 max-w-sm mx-auto">
                {sequence.map((item, i) => (
                  <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.15 }}
                    className="text-3xl">
                    {item}
                  </motion.span>
                ))}
              </div>
            ) : (
              <div className="flex gap-3 justify-center flex-wrap">
                {sequence.map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="px-4 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-2xl font-black tracking-widest">
                    {item}
                  </motion.div>
                ))}
              </div>
            )}
            {q.subPrompt && <p className="text-gray-400 text-sm mt-4">{q.subPrompt}</p>}
          </motion.div>
        ) : (
          <motion.div key="recall" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
            <p className="text-purple-400 font-bold text-xl mb-2">Now type your answer!</p>
            {q.subPrompt && <p className="text-gray-300 text-sm mb-4">{q.subPrompt}</p>}
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-4 text-center text-2xl font-mono font-bold text-white focus:outline-none focus:border-cyan-500 tracking-widest"
              placeholder="Type here..." autoFocus />
            <button onClick={submit} className="w-full mt-4 py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-all">
              Submit Answer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Word Memory Choice Game ──────────────────────────────────────────────────
function WordMemoryGame({ q, onAnswer }: { q: Question; onAnswer: (correct: boolean) => void }) {
  const [phase, setPhase] = useState<'show' | 'recall'>('show');
  const [timeLeft, setTimeLeft] = useState(q.memorySequence ? q.memorySequence.length * 1.5 + 2 : 8);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(interval); setPhase('recall'); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg text-center">
      <AnimatePresence mode="wait">
        {phase === 'show' ? (
          <motion.div key="show" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Timer className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-mono text-xl">{Math.ceil(timeLeft)}s</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(q.memorySequence || []).map((word, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }}
                  className="py-4 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-200 font-bold text-lg tracking-wide">
                  {word}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="recall" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
            <p className="text-cyan-400 font-bold text-xl mb-2">Which word was in the list?</p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {q.options.map(opt => (
                <button key={opt} onClick={() => onAnswer(opt === q.answer)}
                  className="py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 hover:border-cyan-500/50 transition-all active:scale-95">
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Challenge Page ──────────────────────────────────────────────────────
export default function Challenge() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const mode = (params.get('mode') || 'math') as ModeKey;

  const { addXP, updateStat, addHistory, consumeEnergy, progressMissionCategory } = useAppContext();

  const TOTAL_QUESTIONS = mode === 'reaction' ? 0 : 10;

  const [status, setStatus] = useState<'intro' | 'playing' | 'results'>('intro');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [flash, setFlash] = useState<'none' | 'correct' | 'wrong'>('none');
  const [timeLeft, setTimeLeft] = useState(30);
  const [totalTime, setTotalTime] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [xpEarned, setXpEarned] = useState(0);
  const [aiDecisionLoading, setAiDecisionLoading] = useState(false);
  const [aiDecisionScenario, setAiDecisionScenario] = useState<{ scenario: string; options: string[] } | null>(null);
  const [aiFeedback, setAiFeedback] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQ = questions[current];

  // ── Timer for each question ──
  useEffect(() => {
    if (status !== 'playing' || !currentQ || currentQ.inputType === 'reaction') return;
    if (currentQ.inputType === 'memory-type' || currentQ.inputType === 'memory-grid' || currentQ.type === 'word-memory') return;

    const limit = currentQ.timeLimit || 20;
    setTimeLeft(limit);

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleWrong();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [current, status]);

  // ── Total session timer ──
  useEffect(() => {
    if (status !== 'playing') return;
    totalTimerRef.current = setInterval(() => setTotalTime(t => t + 1), 1000);
    return () => { if (totalTimerRef.current) clearInterval(totalTimerRef.current); };
  }, [status]);

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (totalTimerRef.current) clearInterval(totalTimerRef.current);
  };

  const handleCorrect = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setFlash('correct');
    setTimeout(() => setFlash('none'), 600);
    setCorrect(c => c + 1);
    nextQuestion();
  };

  const handleWrong = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setFlash('wrong');
    setTimeout(() => setFlash('none'), 600);
    setWrong(w => w + 1);
    nextQuestion();
  };

  const nextQuestion = () => {
    setCurrent(c => {
      if (c + 1 >= TOTAL_QUESTIONS) {
        setTimeout(() => endGame(), 100);
        return c + 1;
      }
      return c + 1;
    });
  };

  const startGame = () => {
    if (!consumeEnergy(8)) {
      alert('Not enough energy! Wait for recovery.');
      return;
    }
    const qs = mode !== 'reaction' ? generateQuestionBatch(mode, TOTAL_QUESTIONS) : [];
    setQuestions(qs);
    setCurrent(0);
    setCorrect(0);
    setWrong(0);
    setTotalTime(0);
    setReactionTimes([]);
    setAiFeedback('');
    setAiDecisionScenario(null);
    setStatus('playing');
    if (mode === 'iq') loadAIDecision(qs);
  };

  const loadAIDecision = async (qs: Question[]) => {
    // Check if any question is AI decision type — not needed here, handled separately
  };

  const endGame = (reactionTs?: number[]) => {
    clearTimers();
    const rTimes = reactionTs ?? reactionTimes;
    const totalQ = mode === 'reaction' ? rTimes.length : TOTAL_QUESTIONS;
    const accuracy = mode === 'reaction' ? 100 : Math.round((correct / totalQ) * 100);
    const avgReaction = rTimes.length > 0 ? Math.round(rTimes.reduce((a, b) => a + b, 0) / rTimes.length) : 0;
    const xp = mode === 'reaction'
      ? Math.max(10, Math.round(1200 / Math.max(avgReaction, 100)))
      : Math.round(correct * 15 + accuracy * 0.5);

    setXpEarned(xp);
    addXP(xp);
    progressMissionCategory(mode.charAt(0).toUpperCase() + mode.slice(1), 1);
    progressMissionCategory('General', 1);

    const statMap: Record<ModeKey, keyof import('@/context/AppContext').BrainStats> = {
      math: 'mathIQ', logic: 'logic', speed: 'speed', memory: 'memory',
      iq: 'logic', pattern: 'logic', mixed: 'logic', reaction: 'focus',
    };
    updateStat(statMap[mode], mode === 'reaction' ? 2 : Math.max(1, Math.floor(accuracy / 20)));

    addHistory({
      date: new Date().toISOString(),
      score: mode === 'reaction' ? Math.round(1000 - avgReaction) : correct * 100,
      category: mode,
      accuracy,
      speedMs: avgReaction || undefined,
    });

    setStatus('results');
  };

  const modeColors: Record<ModeKey, string> = {
    math: 'cyan', logic: 'purple', speed: 'yellow', memory: 'blue',
    iq: 'orange', pattern: 'green', mixed: 'red', reaction: 'pink',
  };
  const col = modeColors[mode] || 'cyan';

  const flashClass = flash === 'correct'
    ? 'ring-4 ring-green-400 bg-green-500/5'
    : flash === 'wrong'
    ? 'ring-4 ring-red-400 bg-red-500/5 animate-[shake_0.3s_ease-in-out]'
    : '';

  const accuracy = TOTAL_QUESTIONS > 0 ? Math.round((correct / TOTAL_QUESTIONS) * 100) : 0;

  return (
    <div className={`min-h-[80vh] flex flex-col transition-all duration-200 rounded-2xl p-2 ${flashClass}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/train">
          <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </Link>
        {status === 'playing' && mode !== 'reaction' && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-400 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {correct}</span>
            <span className="text-red-400 flex items-center gap-1"><XCircle className="w-4 h-4" /> {wrong}</span>
            <span className="text-gray-400 font-mono">{current + 1}/{TOTAL_QUESTIONS}</span>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">

        {/* ── INTRO ── */}
        {status === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center gap-6">
            <div className="text-7xl">{['🔢','🧩','⚡','🧠','🏆','🌀','🎯','🔥'][['math','logic','speed','memory','iq','pattern','reaction','mixed'].indexOf(mode)]}</div>
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-widest">
              {mode.toUpperCase()} MODULE
            </h1>
            <div className="flex gap-6 text-sm">
              {mode !== 'reaction' && <div className="glass-panel px-4 py-2 rounded-xl"><span className="text-gray-400">Questions</span><br /><span className="text-white font-bold text-xl">{TOTAL_QUESTIONS}</span></div>}
              <div className="glass-panel px-4 py-2 rounded-xl"><span className="text-gray-400">Energy Cost</span><br /><span className="text-yellow-400 font-bold text-xl">8 ⚡</span></div>
              <div className="glass-panel px-4 py-2 rounded-xl"><span className="text-gray-400">XP Reward</span><br /><span className="text-green-400 font-bold text-xl">Up to 200+</span></div>
            </div>
            <motion.button onClick={startGame} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              className="px-16 py-5 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-black text-2xl rounded-full shadow-[0_0_40px_rgba(0,229,255,0.5)] hover:shadow-[0_0_60px_rgba(0,229,255,0.7)] transition-all uppercase tracking-widest">
              INITIALIZE
            </motion.button>
          </motion.div>
        )}

        {/* ── PLAYING ── */}
        {status === 'playing' && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto gap-6">

            {/* Progress bar */}
            {mode !== 'reaction' && (
              <div className="w-full bg-white/5 rounded-full h-2">
                <motion.div className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
                  animate={{ width: `${(current / TOTAL_QUESTIONS) * 100}%` }} transition={{ duration: 0.3 }} />
              </div>
            )}

            {/* Reaction mode */}
            {mode === 'reaction' && (
              <ReactionGame onFinish={(times) => { setReactionTimes(times); endGame(times); }} />
            )}

            {/* Memory grid */}
            {currentQ?.inputType === 'memory-grid' && (
              <MemoryGridGame q={currentQ} onAnswer={(ok) => ok ? handleCorrect() : handleWrong()} />
            )}

            {/* Memory type (digits/words to type) */}
            {currentQ?.inputType === 'memory-type' && (
              <MemoryTypeGame q={currentQ} onAnswer={(ok) => ok ? handleCorrect() : handleWrong()} />
            )}

            {/* Word memory (show words then pick) */}
            {currentQ?.type === 'word-memory' || currentQ?.type === 'num-word-mem' || currentQ?.type === 'seq-order' ? (
              <WordMemoryGame q={currentQ} onAnswer={(ok) => ok ? handleCorrect() : handleWrong()} />
            ) : null}

            {/* Multiple choice */}
            {currentQ?.inputType === 'choice' && currentQ?.type !== 'word-memory' && currentQ?.type !== 'num-word-mem' && currentQ?.type !== 'seq-order' && (
              <div className="w-full text-center">
                {/* Timer bar */}
                <div className="w-full bg-white/5 rounded-full h-1.5 mb-6">
                  <motion.div className={`h-1.5 rounded-full ${timeLeft > 10 ? 'bg-green-400' : timeLeft > 5 ? 'bg-yellow-400' : 'bg-red-400'}`}
                    animate={{ width: `${(timeLeft / (currentQ.timeLimit || 20)) * 100}%` }} transition={{ duration: 0.5 }} />
                </div>

                {/* Category badge */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-xs uppercase tracking-widest text-gray-500 border border-white/10 px-3 py-1 rounded-full">
                    {currentQ.category} • {currentQ.type.replace(/-/g, ' ')}
                  </span>
                  <span className="text-xs text-yellow-400 font-mono">{timeLeft}s</span>
                </div>

                {/* Question */}
                <motion.div key={currentQ.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight whitespace-pre-line drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  {currentQ.prompt}
                </motion.div>
                {currentQ.subPrompt && <p className="text-gray-400 text-sm mb-6">{currentQ.subPrompt}</p>}

                {/* Options */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                  {currentQ.options.map((opt, i) => (
                    <motion.button key={opt} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      onClick={() => { if (timerRef.current) clearInterval(timerRef.current); opt === currentQ.answer ? handleCorrect() : handleWrong(); }}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className="py-5 px-4 glass-panel rounded-2xl text-xl font-bold text-white hover:border-cyan-500/60 hover:bg-cyan-500/10 transition-all border border-white/10 active:border-cyan-400">
                      {opt}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        )}

        {/* ── RESULTS ── */}
        {status === 'results' && (
          <motion.div key="results" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center gap-6">
            <div className="text-6xl">
              {mode === 'reaction' ? '⚡' : accuracy >= 80 ? '🏆' : accuracy >= 50 ? '🧠' : '🔄'}
            </div>
            <h2 className="text-4xl font-black text-white">
              {mode === 'reaction' ? 'REFLEX DATA CAPTURED' : accuracy >= 80 ? 'NEURAL UPGRADE COMPLETE' : accuracy >= 50 ? 'SEQUENCE COMPLETE' : 'KEEP TRAINING'}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-xl">
              {mode !== 'reaction' && <>
                <div className="glass-panel p-4 rounded-2xl">
                  <p className="text-gray-400 text-xs mb-1">CORRECT</p>
                  <p className="text-3xl font-black text-green-400">{correct}</p>
                </div>
                <div className="glass-panel p-4 rounded-2xl">
                  <p className="text-gray-400 text-xs mb-1">ACCURACY</p>
                  <p className="text-3xl font-black text-cyan-400">{accuracy}%</p>
                </div>
                <div className="glass-panel p-4 rounded-2xl">
                  <p className="text-gray-400 text-xs mb-1">TIME</p>
                  <p className="text-3xl font-black text-purple-400">{totalTime}s</p>
                </div>
              </>}
              {mode === 'reaction' && reactionTimes.length > 0 && <>
                <div className="glass-panel p-4 rounded-2xl">
                  <p className="text-gray-400 text-xs mb-1">AVG</p>
                  <p className="text-3xl font-black text-cyan-400">{Math.round(reactionTimes.reduce((a,b)=>a+b,0)/reactionTimes.length)}ms</p>
                </div>
                <div className="glass-panel p-4 rounded-2xl">
                  <p className="text-gray-400 text-xs mb-1">BEST</p>
                  <p className="text-3xl font-black text-green-400">{Math.min(...reactionTimes)}ms</p>
                </div>
                <div className="glass-panel p-4 rounded-2xl">
                  <p className="text-gray-400 text-xs mb-1">WORST</p>
                  <p className="text-3xl font-black text-red-400">{Math.max(...reactionTimes)}ms</p>
                </div>
              </>}
              <div className="glass-panel p-4 rounded-2xl">
                <p className="text-gray-400 text-xs mb-1">XP EARNED</p>
                <p className="text-3xl font-black text-yellow-400">+{xpEarned}</p>
              </div>
            </div>

            {/* Score bar */}
            {mode !== 'reaction' && (
              <div className="w-full max-w-xl">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Score</span><span>{accuracy}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-3">
                  <motion.div className="h-3 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
                    initial={{ width: 0 }} animate={{ width: `${accuracy}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <motion.button onClick={startGame} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-8 py-3 bg-white/10 border border-white/20 text-white font-bold rounded-xl hover:bg-white/20 transition-all">
                <RefreshCw className="w-4 h-4" /> RETRY
              </motion.button>
              <Link href="/train">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-bold rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-all">
                  TRAIN MORE
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
