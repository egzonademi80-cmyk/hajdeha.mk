import { Analytics } from "@vercel/analytics/react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
// Pages
import Landing from "@/pages/Landing";
import Register from "@/pages/Register";
import SuperAdmin from "@/pages/SuperAdmin";
import PublicMenu from "@/pages/PublicMenu";
import AuthLogin from "@/pages/AuthLogin";
import POS from "@/pages/POS";
import TablePage from "@/pages/TablePage";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminRestaurant from "@/pages/AdminRestaurant";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DarkModeToggle } from "./components/DarkModeToggle";
import { useDarkMode } from "./hooks/useDarkMode";

function Router() {
  const { isDark, toggleDarkMode } = useDarkMode();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <DarkModeToggle isDark={isDark} toggleDarkMode={toggleDarkMode} />
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={Landing} />
        <Route path="/register" component={Register} />
        <Route path="/restaurant/:slug" component={PublicMenu} />
        <Route path="/auth/login" component={AuthLogin} />
        <Route path="/superadmin" component={SuperAdmin} />

        {/* Protected Routes */}
        <Route path="/admin/dashboard">
          {() => <ProtectedRoute component={AdminDashboard} />}
        </Route>
        <Route path="/admin/restaurant/:id">
          {() => <ProtectedRoute component={AdminRestaurant} />}
        </Route>
        {/* Table ordering (QR scan) */}
        <Route path="/table/:restaurantSlug/:tableNumber" component={TablePage} />

        {/* Fallback */}
        <Route path="/pos/bujar" component={POS} />
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
