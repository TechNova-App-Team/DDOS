import { useState } from 'react';
import { useTheme } from './contexts/ThemeContext';
import { PingProvider } from './contexts/PingContext';
import { TabButton } from './components/TabButton';
import { Dashboard } from './components/Dashboard';
import { Run } from './components/Run';
import { Settings } from './components/Settings';
import { LayoutDashboard, Play, Settings as SettingsIcon, Loader2 } from 'lucide-react';

type Tab = 'dashboard' | 'run' | 'settings';

function AppContent() {
  const { themeColor, isLoading } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeColor === 'black' ? 'bg-black' : 'bg-gray-950'}`}>
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${themeColor === 'black' ? 'bg-black' : 'bg-gray-950'}`}
      style={{
        backgroundImage: themeColor === 'black'
          ? 'radial-gradient(circle at 20% 50%, rgba(30, 30, 30, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(40, 40, 40, 0.4) 0%, transparent 50%)'
          : 'radial-gradient(circle at 20% 50%, rgba(55, 65, 81, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(75, 85, 99, 0.4) 0%, transparent 50%)'
      }}
    >
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Ping Dashboard</h1>
              <p className="text-gray-400 text-sm">Monitor and analyze ping results</p>
            </div>
            <div className="flex gap-3">
              <TabButton
                icon={LayoutDashboard}
                label="Dashboard"
                active={activeTab === 'dashboard'}
                onClick={() => setActiveTab('dashboard')}
              />
              <TabButton
                icon={Play}
                label="Run"
                active={activeTab === 'run'}
                onClick={() => setActiveTab('run')}
              />
              <TabButton
                icon={SettingsIcon}
                label="Settings"
                active={activeTab === 'settings'}
                onClick={() => setActiveTab('settings')}
              />
            </div>
          </div>
        </div>

        <div className="animate-fadeIn">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'run' && <Run />}
          {activeTab === 'settings' && <Settings />}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <PingProvider>
      <AppContent />
    </PingProvider>
  );
}

export default App;
