import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AllCertificates from "@/pages/all-certificates";
import Subscriptions from "@/pages/subscriptions";
import LoginPage from "@/pages/login";
import Navigation from "@/components/layout/navigation";
import { useAuth } from "@/hooks/use-auth";

function ProtectedApp() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/certificates" component={AllCertificates} />
      <Route path="/subscriptions" component={Subscriptions} />
      <Route component={NotFound} />
    </Switch>
  )
}

function Router() {
  const { user, loading } = useAuth()
  if (loading) return null
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route>
        {user ? <ProtectedApp /> : <Redirect to="/login" />}
      </Route>
    </Switch>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) {
      const isDark = saved === "dark";
      setDarkMode(isDark);
      document.documentElement.classList.toggle("dark", isDark);
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("theme", newDarkMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newDarkMode);
  };

  // Show navigation only when not on login page and user is authenticated
  const showNavigation = user && location !== '/login';

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {showNavigation ? (
            <Navigation darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
          ) : (
            // Show only logo when on login page
            <div 
              className="shadow-sm border-b border-gray-200"
              style={{
                backgroundImage: 'url(/src/assets/images/chipsbgforheader.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-start items-center h-16">
                  <div className="flex items-center">
                    <img 
                      src="/src/assets/images/kettle-studio-logo.png" 
                      alt="Kettle Studio Logo" 
                      className="h-12 w-auto mr-3"
                      style={{ maxWidth: '120px' }}
                    />
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-black drop-shadow-lg">KettleStudio Documentation</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
