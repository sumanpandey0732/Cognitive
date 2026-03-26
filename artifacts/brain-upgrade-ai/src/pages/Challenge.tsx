import React, { useState, useEffect, useRef } from 'react';
import { useSearch } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { aiService } from '@/services/aiService';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'wouter';

export default function Challenge() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const mode = searchParams.get('mode') || 'logic';
  
  const { addXP, updateStat, addHistory, consumeEnergy, progressMissionCategory } = useAppContext();
  
  const [status, setStatus] = useState<'intro' | 'playing' | 'results'>('intro');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(mode === 'decision' ? 3 : mode === 'reaction' ? 5 : 10);
  
  // generic state
  const [flash, setFlash] = useState<'none'|'green'|'red'>('none');
  
  // === Logic / Speed State ===
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [answer, setAnswer] = useState('');

  // === Reaction State ===
  const [bgClass, setBgClass] = useState('bg-background');
  const [startTime, setStartTime] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [waiting, setWaiting] = useState(false);

  // === Decision State ===
  const decisionQuery = useQuery({
    queryKey: ['decisionScenario', round],
    queryFn: () => aiService.getDecisionScenario(),
    enabled: status === 'playing' && mode === 'decision'
  });
  
  const evalMutation = useMutation({
    mutationFn: (choice: string) => aiService.evaluateDecision(decisionQuery.data!.scenario, choice),
    onSuccess: (data) => {
      setScore(prev => prev + data.score);
      alert(`AI Feedback: ${data.feedback}\nScore: ${data.score}/100`);
      nextRound();
    }
  });

  const startGame = () => {
    if (!consumeEnergy(10)) {
      alert("Not enough energy! Wait for it to recharge.");
      return;
    }
    setScore(0);
    setRound(1);
    setReactionTimes([]);
    setStatus('playing');
    generateRound(1);
  };

  const generateRound = (r: number) => {
    if (mode === 'speed') {
      const a = Math.floor(Math.random() * (10 * r)) + 10;
      const b = Math.floor(Math.random() * (10 * r)) + 10;
      const ans = a + b;
      setQuestion(`${a} + ${b} = ?`);
      setAnswer(ans.toString());
      setOptions([ans.toString(), (ans+2).toString(), (ans-1).toString(), (ans+10).toString()].sort(() => Math.random() - 0.5));
    } 
    else if (mode === 'logic') {
      const start = Math.floor(Math.random() * 5) + 1;
      const mult = Math.floor(Math.random() * 3) + 2;
      const seq = [start, start*mult, start*mult*mult, start*mult*mult*mult];
      const ans = seq[3] * mult;
      setQuestion(`${seq.join(', ')}, ?`);
      setAnswer(ans.toString());
      setOptions([ans.toString(), (ans+mult).toString(), (ans-start).toString(), (ans*2).toString()].sort(() => Math.random() - 0.5));
    }
    else if (mode === 'reaction') {
      setBgClass('bg-background');
      setWaiting(true);
      const delay = Math.random() * 2000 + 1000; // 1-3s
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setBgClass('bg-primary/50');
        setStartTime(Date.now());
        setWaiting(false);
      }, delay);
    }
  };

  const handleAnswer = (opt: string) => {
    if (opt === answer) {
      setFlash('green');
      setScore(prev => prev + 100);
    } else {
      setFlash('red');
    }
    setTimeout(() => setFlash('none'), 500);
    nextRound();
  };

  const handleReactionClick = () => {
    if (mode !== 'reaction') return;
    if (waiting) {
      // penalty for clicking early
      setReactionTimes(prev => [...prev, 1000]);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      nextRound();
    } else {
      const time = Date.now() - startTime;
      setReactionTimes(prev => [...prev, time]);
      setBgClass('bg-background');
      nextRound();
    }
  };

  const nextRound = () => {
    if (round >= maxRounds) {
      endGame();
    } else {
      setRound(r => r + 1);
      generateRound(round + 1);
    }
  };

  const endGame = () => {
    setStatus('results');
    
    // Calculate final metrics
    let finalScore = score;
    if (mode === 'reaction') {
      const avg = reactionTimes.reduce((a,b)=>a+b,0)/reactionTimes.length;
      finalScore = Math.max(0, 1000 - avg); // quick calc
    }

    addXP(Math.floor(finalScore / 2));
    progressMissionCategory(mode.charAt(0).toUpperCase() + mode.slice(1), 1);
    
    // Update specific stats
    if (mode === 'speed') updateStat('speed', 1);
    if (mode === 'logic') updateStat('logic', 1);
    if (mode === 'reaction') updateStat('focus', 1);
    if (mode === 'decision') updateStat('logic', 2);

    addHistory({
      date: new Date().toISOString(),
      score: finalScore,
      category: mode,
      accuracy: (score / (maxRounds * 100)) * 100
    });
  };

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  return (
    <div className={`min-h-[80vh] flex flex-col transition-colors duration-200 ${bgClass} ${flash === 'green' ? 'bg-green-500/20' : flash === 'red' ? 'bg-red-500/20 animate-shake' : ''}`}>
      
      <div className="flex justify-between items-center mb-8">
        <Link href="/train">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Abort Sequence
          </button>
        </Link>
        {status === 'playing' && (
          <div className="font-display font-bold text-xl text-primary text-glow-cyan">
            Round {round} / {maxRounds}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {status === 'intro' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            <h1 className="text-5xl font-display font-black text-white uppercase tracking-widest mb-4">
              {mode} MODULE
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg mb-8">
              Prepare your neural pathways. This challenge will consume <span className="text-accent font-bold">10 Energy</span>.
            </p>
            <button 
              onClick={startGame}
              className="px-12 py-4 bg-primary text-black font-bold font-display text-xl rounded-full hover:scale-105 transition-all box-glow-cyan-strong"
            >
              INITIALIZE
            </button>
          </motion.div>
        )}

        {status === 'playing' && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto"
          >
            
            {/* Logic / Speed */}
            {(mode === 'logic' || mode === 'speed') && (
              <div className="w-full text-center">
                <div className="text-6xl font-display font-black text-white mb-12 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                  {question}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {options.map(opt => (
                    <button 
                      key={opt}
                      onClick={() => handleAnswer(opt)}
                      className="glass-panel text-2xl font-bold py-6 rounded-xl hover:bg-white/10 hover:border-primary/50 transition-all active:scale-95"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reaction */}
            {mode === 'reaction' && (
              <div 
                className="w-full h-full min-h-[50vh] flex items-center justify-center border-2 border-dashed border-white/20 rounded-3xl cursor-pointer"
                onMouseDown={handleReactionClick}
              >
                <p className="text-2xl text-muted-foreground font-display text-center pointer-events-none select-none">
                  {waiting ? "Wait for the flash..." : "CLICK NOW!"}
                </p>
              </div>
            )}

            {/* Decision */}
            {mode === 'decision' && (
              <div className="w-full">
                {decisionQuery.isLoading ? (
                  <div className="flex flex-col items-center text-primary">
                    <Loader2 className="w-12 h-12 animate-spin mb-4" />
                    <p>Generating scenario...</p>
                  </div>
                ) : decisionQuery.data ? (
                  <div className="glass-panel p-8 rounded-3xl">
                    <p className="text-xl mb-8 leading-relaxed">{decisionQuery.data.scenario}</p>
                    <div className="space-y-3">
                      {decisionQuery.data.options.map((opt, i) => (
                        <button 
                          key={i}
                          onClick={() => evalMutation.mutate(opt)}
                          disabled={evalMutation.isPending}
                          className="w-full text-left glass-panel p-4 rounded-xl hover:border-primary/50 transition-all disabled:opacity-50"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-red-400">Failed to load AI scenario.</p>
                )}
              </div>
            )}

          </motion.div>
        )}

        {status === 'results' && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            <h2 className="text-4xl font-display font-bold text-glow-cyan mb-2">SEQUENCE COMPLETE</h2>
            <p className="text-xl text-muted-foreground mb-8">Performance metrics recorded.</p>
            
            <div className="glass-panel p-8 rounded-3xl w-full max-w-sm mb-8 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Score</span>
                <span className="text-2xl font-bold text-white">{mode === 'reaction' ? `${Math.floor(reactionTimes.reduce((a,b)=>a+b,0)/reactionTimes.length)}ms avg` : score}</span>
              </div>
              <div className="w-full h-px bg-white/10" />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">XP Gained</span>
                <span className="text-2xl font-bold text-primary">+{Math.floor(score/2)}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={startGame}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> RETRY
              </button>
              <Link href="/train">
                <button className="px-8 py-3 bg-primary text-black font-bold rounded-xl box-glow-cyan-strong hover:bg-white transition-all">
                  FINISH
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
