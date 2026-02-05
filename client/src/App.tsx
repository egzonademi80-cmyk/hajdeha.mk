import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
// Pages
import Home from "@/pages/Home";
import PublicMenu from "@/pages/PublicMenu";
import AuthLogin from "@/pages/AuthLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminRestaurant from "@/pages/AdminRestaurant";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DarkModeToggle } from "./components/DarkModeToggle";
import { useDarkMode } from "./hooks/useDarkMode";

function Router() {
  const { isDark, toggleDarkMode } = useDarkMode();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DarkModeToggle isDark={isDark} toggleDarkMode={toggleDarkMode} />
      <Switch>
        {/* Public Routes */}
        <Route path="/">
          {() => <Home isDark={isDark} toggleDarkMode={toggleDarkMode} />}
        </Route>
        <Route path="/restaurant/:slug" component={PublicMenu} />
        <Route path="/auth/login" component={AuthLogin} />

        {/* Protected Routes */}
        <Route path="/admin/dashboard">
          {() => <ProtectedRoute component={AdminDashboard} />}
        </Route>
        <Route path="/admin/restaurant/:id">
          {() => <ProtectedRoute component={AdminRestaurant} />}
        </Route>
        {/* Fallback */}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <Analytics />
        <SpeedInsights />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
