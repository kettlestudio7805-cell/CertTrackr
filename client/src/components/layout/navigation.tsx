import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface NavigationProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Navigation({ darkMode, onToggleDarkMode }: NavigationProps) {
  const [location] = useLocation();
  const { user, signOut } = useAuth()

  const isActive = (path: string) => location === path;

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center">
                <img 
                  src="/src/assets/images/kettle-studio-logo.png" 
                  alt="Kettle Studio Logo" 
                  className="h-12 w-auto mr-3"
                  style={{ maxWidth: '120px' }}
                />
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">Kettle Studio</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Documentation</span>
                </div>
              </div>
            </div>
            <nav className="hidden md:ml-10 md:flex space-x-8">
              <Link 
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive("/") 
                    ? "border-blue-500 text-gray-900 dark:text-white" 
                    : "border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 hover:border-gray-300"
                }`} 
                data-testid="nav-dashboard"
              >
                Dashboard
              </Link>
              <Link 
                href="/certificates"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive("/certificates") 
                    ? "border-blue-500 text-gray-900 dark:text-white" 
                    : "border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 hover:border-gray-300"
                }`} 
                data-testid="nav-certificates"
              >
                All Certificates
              </Link>
              <Link 
                href="/subscriptions"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive("/subscriptions") 
                    ? "border-blue-500 text-gray-900 dark:text-white" 
                    : "border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 hover:border-gray-300"
                }`} 
                data-testid="nav-subscriptions"
              >
                <i className="fas fa-credit-card mr-2"></i>
                Subscriptions
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={onToggleDarkMode}
              className="p-2 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
              data-testid="toggle-dark-mode"
            >
              <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'} text-lg`}></i>
            </button>
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700 dark:text-gray-300">{user.email}</span>
                <button
                  onClick={signOut}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link href="/login" className="text-sm text-blue-600">Sign in</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
