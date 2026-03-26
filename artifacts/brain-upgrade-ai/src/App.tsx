import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "@/context/AppContext";
import { Shell } from "@/components/layout/Shell";

import Home from "@/pages/Home";
import Train from "@/pages/Train";
import Challenge from "@/pages/Challenge";
import Missions from "@/pages/Missions";
import Stats from "@/pages/Stats";
import Analytics from "@/pages/Analytics";
import SkillTree from "@/pages/SkillTree";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <h1 className="text-6xl font-display font-black text-primary text-glow-cyan mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">System Error: Sector not found.</p>
      <a href="/" className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all text-white">
        Return to Core
      </a>
    </div>
  );
}

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/train" component={Train} />
        <Route path="/challenge" component={Challenge} />
        <Route path="/missions" component={Missions} />
        <Route path="/stats" component={Stats} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/skilltree" component={SkillTree} />
        <Route path="/profile" component={Profile} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
