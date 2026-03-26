import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';

export default function Analytics() {
  const { state } = useAppContext();

  // Format history data for charts
  const lineData = state.history.slice(-10).reverse().map((h, i) => ({
    name: `S${i+1}`,
    score: h.score,
    accuracy: h.accuracy
  }));

  const radarData = [
    { subject: 'Speed', A: state.stats.speed, fullMark: 100 },
    { subject: 'Memory', A: state.stats.memory, fullMark: 100 },
    { subject: 'Logic', A: state.stats.logic, fullMark: 100 },
    { subject: 'Focus', A: state.stats.focus, fullMark: 100 },
    { subject: 'Math IQ', A: state.stats.mathIQ, fullMark: 100 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 border border-primary/20 rounded">
          <p className="font-bold text-white mb-1">{label}</p>
          <p className="text-primary text-sm font-bold">Value: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <header>
        <h1 className="text-4xl font-display font-black text-foreground">DEEP ANALYTICS</h1>
        <p className="text-muted-foreground mt-2">Visualize your cognitive evolution.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Radar Chart */}
        <div className="glass-panel p-6 rounded-3xl h-[400px] flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Stat Distribution</h3>
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Stats" dataKey="A" stroke="#00FFFF" fill="#00FFFF" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score Trend */}
        <div className="glass-panel p-6 rounded-3xl h-[400px] flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Performance Trend</h3>
          <div className="flex-1 w-full">
            {lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{fontSize: 12}} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{fontSize: 12}} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="score" stroke="#8A2BE2" strokeWidth={3} dot={{ r: 4, fill: '#8A2BE2' }} activeDot={{ r: 8 }} />
                </RechartsLineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">Insufficient data</div>
            )}
          </div>
        </div>

        {/* Accuracy Area Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl h-[300px] flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Accuracy Evolution</h3>
          <div className="flex-1 w-full">
            {lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lineData}>
                  <defs>
                    <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00FFFF" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#00FFFF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{fontSize: 12}} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{fontSize: 12}} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="accuracy" stroke="#00FFFF" fillOpacity={1} fill="url(#colorAcc)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">Insufficient data</div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
