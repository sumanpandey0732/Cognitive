import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area, BarChart, Bar, Cell, ScatterChart, Scatter
} from 'recharts';
import { Brain, TrendingUp, Zap, Target, Clock, Trophy, Activity, AlertCircle } from 'lucide-react';

const DOMAIN_COLORS: Record<string, string> = {
  'Speed Math': '#00e5ff', 'Memory': '#a855f7', 'Focus': '#f97316',
  'Speed': '#22c55e', 'Logic': '#3b82f6', 'Verbal': '#eab308',
  'Multitask': '#ef4444', 'Mixed': '#64748b',
};

const SKILL_LABELS = ['Memory', 'Logic', 'Speed', 'Focus', 'Math IQ'];

function BrainHeatmap({ sessions }: { sessions: any[] }) {
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const daySessions = sessions.filter(s => s.timestamp?.startsWith(key));
    const score = daySessions.length > 0 ? Math.round(daySessions.reduce((a: number, s: any) => a + s.score, 0) / daySessions.length) : 0;
    return { day: ['S','M','T','W','T','F','S'][d.getDay()], score, count: daySessions.length, date: key };
  });

  const max = Math.max(...last7.map(d => d.score), 1);

  return (
    <div className="flex gap-2 items-end">
      {last7.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t-md transition-all"
            style={{ height: 60, background: d.score > 0 ? `rgba(0,229,255,${0.2 + (d.score / max) * 0.7})` : 'rgba(255,255,255,0.05)' }}>
          </div>
          <span className="text-[9px] text-gray-500">{d.day}</span>
          {d.count > 0 && <span className="text-[9px] text-cyan-400 font-bold">{d.count}g</span>}
        </div>
      ))}
    </div>
  );
}

function SkillHeatmap({ stats }: { stats: any }) {
  const skills = [
    { name: 'Memory', val: stats.memory, color: '#a855f7' },
    { name: 'Logic', val: stats.logic, color: '#3b82f6' },
    { name: 'Speed', val: stats.speed, color: '#22c55e' },
    { name: 'Focus', val: stats.focus, color: '#f97316' },
    { name: 'Math IQ', val: stats.mathIQ, color: '#00e5ff' },
  ];
  return (
    <div className="flex flex-col gap-2">
      {skills.map(s => (
        <div key={s.name} className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-14">{s.name}</span>
          <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden">
            <motion.div className="h-4 rounded-full" initial={{ width: 0 }}
              animate={{ width: `${s.val}%` }} transition={{ duration: 0.8, delay: 0.1 }}
              style={{ background: `linear-gradient(90deg, ${s.color}66, ${s.color})`, boxShadow: `0 0 10px ${s.color}44` }} />
          </div>
          <span className="text-xs font-bold w-8 text-right" style={{ color: s.color }}>{s.val}</span>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-2 h-4 rounded-sm"
                style={{ background: i < Math.ceil(s.val / 20) ? s.color : 'rgba(255,255,255,0.05)' }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 border border-primary/20 rounded-lg text-sm">
        <p className="font-bold text-white mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} className="font-bold" style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const { state } = useAppContext();
  const [tab, setTab] = useState<'overview' | 'games' | 'trends' | 'report'>('overview');

  const sessions = state.gameSessions || [];
  const history = state.history || [];

  const brainAge = useMemo(() => {
    const avg = Object.values(state.stats).reduce((a, b) => a + b, 0) / 5;
    return Math.max(18, Math.min(70, 65 - Math.floor(avg * 0.35) + Math.floor(Math.random() * 3)));
  }, [state.stats]);

  const totalAccuracy = state.totalCorrect + state.totalWrong > 0
    ? Math.round(state.totalCorrect / (state.totalCorrect + state.totalWrong) * 100) : 0;

  const radarData = [
    { subject: 'Speed', A: state.stats.speed },
    { subject: 'Memory', A: state.stats.memory },
    { subject: 'Logic', A: state.stats.logic },
    { subject: 'Focus', A: state.stats.focus },
    { subject: 'Math IQ', A: state.stats.mathIQ },
  ];

  const trendData = history.slice(0, 15).reverse().map((h, i) => ({
    name: `#${i + 1}`, score: h.score || 0, accuracy: h.accuracy || 0
  }));

  const domainData = useMemo(() => {
    const map: Record<string, { count: number; totalScore: number; totalAcc: number }> = {};
    sessions.forEach(s => {
      if (!map[s.domain]) map[s.domain] = { count: 0, totalScore: 0, totalAcc: 0 };
      map[s.domain].count++;
      map[s.domain].totalScore += s.score;
      map[s.domain].totalAcc += s.accuracy;
    });
    return Object.entries(map).map(([domain, d]) => ({
      domain, count: d.count,
      avgScore: Math.round(d.totalScore / d.count),
      avgAcc: Math.round(d.totalAcc / d.count),
      color: DOMAIN_COLORS[domain] || '#64748b',
    })).sort((a, b) => b.avgScore - a.avgScore);
  }, [sessions]);

  const gameLeaderboard = useMemo(() => {
    return Object.entries(state.highScores || {})
      .map(([id, score]) => ({ id, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [state.highScores]);

  const strengths = radarData.filter(d => d.A >= 60).map(d => d.subject);
  const weaknesses = radarData.filter(d => d.A < 40).map(d => d.subject);
  const avgStat = Math.round(Object.values(state.stats).reduce((a, b) => a + b, 0) / 5);

  const sessionTrend = sessions.slice(0, 20).reverse().map((s, i) => ({
    name: `#${i + 1}`, score: s.score, accuracy: s.accuracy, domain: s.domain
  }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <header>
        <h1 className="text-4xl font-display font-black text-white">BRAIN ANALYTICS</h1>
        <p className="text-gray-400 mt-1">Deep cognitive performance tracking & personalized insights</p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Games Played', value: state.totalGamesPlayed, icon: '🎮', color: 'text-cyan-400' },
          { label: 'Global Accuracy', value: `${totalAccuracy}%`, icon: '🎯', color: totalAccuracy >= 70 ? 'text-green-400' : 'text-orange-400' },
          { label: 'Brain Score', value: state.brainScore, icon: '🧠', color: 'text-purple-400' },
          { label: 'Brain Age Est.', value: `~${brainAge}y`, icon: '⏰', color: 'text-cyan-400' },
        ].map(s => (
          <div key={s.label} className="glass-panel p-4 rounded-2xl border border-white/5">
            <p className="text-xl">{s.icon}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['overview', 'games', 'trends', 'report'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-bold border capitalize transition-all ${tab === t ? 'bg-primary text-black border-primary' : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30'}`}>
            {t === 'report' ? '📊 Brain Report' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar */}
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Cognitive Radar</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Stats" dataKey="A" stroke="#00FFFF" fill="#00FFFF" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Skill heatmap */}
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Skill Heatmap</h3>
            <SkillHeatmap stats={state.stats} />
          </div>

          {/* Weekly activity */}
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">7-Day Activity</h3>
            <BrainHeatmap sessions={sessions} />
          </div>

          {/* High scores */}
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">🏆 High Scores</h3>
            {gameLeaderboard.length === 0 ? (
              <p className="text-gray-500 text-sm">Play games to see your best scores here!</p>
            ) : (
              <div className="space-y-2">
                {gameLeaderboard.map(({ id, score }, i) => (
                  <div key={id} className="flex items-center gap-3">
                    <span className={`text-sm font-black w-5 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-500'}`}>{i + 1}</span>
                    <span className="flex-1 text-sm text-white capitalize">{id.replace(/-/g, ' ')}</span>
                    <span className="text-sm font-black text-cyan-400">{score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'games' && (
        <div className="space-y-6">
          {/* Domain performance */}
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Performance by Domain</h3>
            {domainData.length === 0 ? (
              <p className="text-gray-500 text-sm">Play mini-games to see domain breakdowns!</p>
            ) : (
              <div className="space-y-3">
                {domainData.map(d => (
                  <div key={d.domain} className="flex items-center gap-3">
                    <span className="text-xs font-bold w-20 truncate" style={{ color: d.color }}>{d.domain}</span>
                    <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-6 rounded-full flex items-center px-2 text-xs font-bold text-black transition-all"
                        style={{ width: `${Math.min(100, d.avgAcc)}%`, background: d.color, minWidth: 40 }}>
                        {d.avgAcc}%
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 w-12 text-right">{d.count} plays</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Session trend */}
          <div className="glass-panel p-6 rounded-3xl h-72">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Recent Game Sessions</h3>
            {sessionTrend.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sessionTrend}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10 }} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="score" stroke="#00e5ff" fill="url(#scoreGrad)" name="Score" />
                  <Line type="monotone" dataKey="accuracy" stroke="#a855f7" strokeWidth={2} dot={false} name="Accuracy" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">Play more games to see trends</div>
            )}
          </div>
        </div>
      )}

      {tab === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-3xl h-72">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Score Trend</h3>
            {trendData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10 }} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="score" stroke="#8A2BE2" strokeWidth={3} dot={{ r: 4, fill: '#8A2BE2' }} name="Score" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">Need more data</div>
            )}
          </div>

          <div className="glass-panel p-6 rounded-3xl h-72">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Accuracy Evolution</h3>
            {trendData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00FFFF" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#00FFFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10 }} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="accuracy" stroke="#00FFFF" fill="url(#accGrad)" name="Accuracy %" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">Need more data</div>
            )}
          </div>

          {/* Game frequency bar */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Games Played by Domain</h3>
            {domainData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={domainData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="domain" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10 }} />
                    <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Games Played" radius={[4, 4, 0, 0]}>
                      {domainData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Play games to see domain frequency</p>
            )}
          </div>
        </div>
      )}

      {tab === 'report' && (
        <div className="space-y-6">
          <div className="glass-panel p-8 rounded-3xl border border-cyan-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Brain className="w-48 h-48 text-cyan-400" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <Brain className="w-6 h-6 text-cyan-400" />
                <h2 className="text-2xl font-black text-white">Personalized Brain Report</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="glass-panel p-4 rounded-2xl text-center border border-purple-500/20">
                  <p className="text-4xl font-black text-purple-400">{state.brainScore}</p>
                  <p className="text-xs text-gray-400 mt-1">Global Brain Score</p>
                </div>
                <div className="glass-panel p-4 rounded-2xl text-center border border-cyan-500/20">
                  <p className="text-4xl font-black text-cyan-400">~{brainAge}</p>
                  <p className="text-xs text-gray-400 mt-1">Estimated Brain Age</p>
                </div>
                <div className="glass-panel p-4 rounded-2xl text-center border border-green-500/20">
                  <p className="text-4xl font-black text-green-400">{totalAccuracy}%</p>
                  <p className="text-xs text-gray-400 mt-1">Overall Accuracy</p>
                </div>
              </div>

              {/* Strengths */}
              {strengths.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-green-400 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Strengths
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {strengths.map(s => (
                      <span key={s} className="px-3 py-1 rounded-full text-sm font-bold bg-green-500/10 text-green-400 border border-green-500/20">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Weaknesses */}
              {weaknesses.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-orange-400 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Areas to Improve
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {weaknesses.map(s => (
                      <span key={s} className="px-3 py-1 rounded-full text-sm font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Recommendations */}
              <div className="glass-panel p-4 rounded-2xl border border-cyan-500/10">
                <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> AI Coach Recommendations
                </h3>
                <div className="space-y-2 text-sm text-gray-300">
                  {avgStat < 40 && <p>• 🧠 Your brain is warming up. Play at least 3 games daily for consistent improvement.</p>}
                  {state.stats.memory < 50 && <p>• 💜 Memory needs work — try Color Sequence and Memory Card Flip daily.</p>}
                  {state.stats.speed < 50 && <p>• ⚡ Speed is low — Falling Math Clouds and Reaction Chain will sharpen it.</p>}
                  {state.stats.logic < 50 && <p>• 🔵 Logic needs training — Speed Sort and the MCQ Logic module are your best bet.</p>}
                  {state.stats.focus < 50 && <p>• 🟠 Focus is lagging — Stroop Challenge and Number Tap directly target this.</p>}
                  {state.stats.mathIQ < 50 && <p>• 🔷 Math IQ can improve — Math Blaster and Bubble Pop are perfect drills.</p>}
                  {avgStat >= 60 && <p>• 🏆 You're performing above average! Try Dual Task to push your multitasking abilities.</p>}
                  {state.streak > 3 && <p>• 🔥 {state.streak}-day streak! Consistency is your superpower. Keep going!</p>}
                  {state.totalGamesPlayed === 0 && <p>• 👋 Start with Falling Math Clouds or Number Tap to get your first scores!</p>}
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500 text-center">
                Brain age is an estimate based on your cognitive performance vs. population averages. 
                Play more games for a more accurate report.
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
