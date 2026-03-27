import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Brain, Gamepad2, Target, BarChart2, LineChart, Network, User, Settings, Zap, Joystick } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';

const NAV_ITEMS = [
  { href: '/', icon: Brain, label: 'Dashboard' },
  { href: '/games', icon: Joystick, label: 'Games' },
  { href: '/train', icon: Gamepad2, label: 'Train' },
  { href: '/missions', icon: Target, label: 'Missions' },
  { href: '/stats', icon: BarChart2, label: 'Stats' },
  { href: '/analytics', icon: LineChart, label: 'Analytics' },
  { href: '/skilltree', icon: Network, label: 'Skill Tree' },
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

const MAX_ENERGY = 1000;

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { state } = useAppContext();
  const [particles, setParticles] = useState<{ id: number, x: number, duration: number, delay: number }[]>([]);

  useEffect(() => {
    const p = Array.from({ length: 20 }).map((_, i) => ({
      id: i, x: Math.random() * 100, duration: 15 + Math.random() * 20, delay: Math.random() * 10
    }));
    setParticles(p);
  }, []);

  const energyPct = Math.round((state.energy / MAX_ENERGY) * 100);
  const xpPct = Math.round((state.xp / (state.level * 100)) * 100);

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative z-0">
      <div className="particles-container">
        {particles.map(p => (
          <div key={p.id} className="particle w-1 h-1 md:w-2 md:h-2"
            style={{ left: `${p.x}%`, animationDuration: `${p.duration}s`, animationDelay: `-${p.delay}s` }} />
        ))}
      </div>

      {/* Sidebar */}
      <nav className="hidden md:flex flex-col w-64 border-r border-white/10 glass-panel bg-background/50 sticky top-0 h-screen z-10">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <Brain className="w-8 h-8 text-primary drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
          <span className="font-display font-bold text-xl text-foreground tracking-widest text-glow-cyan">BRAIN.OS</span>
        </div>

        <div className="p-5 border-b border-white/10 space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-muted-foreground font-bold tracking-wider uppercase">Level {state.level}</span>
              <span className="text-xs text-primary font-bold">{state.xp} / {state.level * 100} XP</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(0,255,255,0.5)]"
                style={{ width: `${xpPct}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                <Zap className="w-3 h-3 text-accent" /> Energy
              </div>
              <span className="text-xs text-accent font-bold">{state.energy} <span className="text-gray-600">/ 1000</span></span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div className="bg-accent h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(138,43,226,0.5)]"
                style={{ width: `${energyPct}%` }} />
            </div>
          </div>
          {state.streak > 0 && (
            <div className="flex items-center gap-2 text-xs text-orange-400">
              <span>🔥</span>
              <span className="font-bold">{state.streak} day streak</span>
            </div>
          )}
        </div>

        <div className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href === '/games' && location.startsWith('/play'));
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-4 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 cursor-pointer",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20 box-glow-cyan"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}>
                  <item.icon className={cn("w-5 h-5", isActive ? "drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]" : "")} />
                  <span>{item.label}</span>
                  {item.href === '/games' && (
                    <span className="ml-auto text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">13</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden pb-24 md:pb-0 relative z-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Bottom Bar (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel bg-background/80 border-t border-white/10 z-50 flex items-center justify-around p-2">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const isActive = location === item.href || (item.href === '/games' && location.startsWith('/play'));
          return (
            <Link key={item.href} href={item.href}>
              <div className="flex flex-col items-center gap-1 p-2 cursor-pointer">
                <item.icon className={cn("w-6 h-6", isActive ? "text-primary drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]" : "text-muted-foreground")} />
                <span className={cn("text-[10px]", isActive ? "text-primary font-bold" : "text-muted-foreground")}>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
