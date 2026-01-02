import { GlassCard } from './GlassCard';
import { useTheme } from '../contexts/ThemeContext';
import { usePing } from '../contexts/PingContext';
import { Activity, TrendingUp, Zap, Database, CheckCircle, XCircle, Clock, Gauge } from 'lucide-react';

export const Dashboard = () => {
  const { accentColor } = useTheme();
  const { hostStats, pingResults } = usePing();

  const stats = [
    { icon: Activity, label: 'Total Pings', value: pingResults.length.toString(), change: '+' + pingResults.length },
    { icon: CheckCircle, label: 'Successful', value: pingResults.filter(p => p.success).length.toString(), change: '+' + pingResults.filter(p => p.success).length },
    { icon: XCircle, label: 'Failed', value: pingResults.filter(p => !p.success).length.toString(), change: pingResults.filter(p => !p.success).length > 0 ? '+' + pingResults.filter(p => !p.success).length : '0' },
    { icon: Gauge, label: 'Success Rate', value: hostStats.length > 0 ? (hostStats.reduce((sum, stat) => sum + stat.successRate, 0) / hostStats.length).toFixed(1) + '%' : '0%', change: '0%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Overview of your application performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <GlassCard key={index} hover className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: accentColor + '20' }}
              >
                <stat.icon size={24} style={{ color: accentColor }} />
              </div>
              <span className="text-green-400 text-sm font-medium">{stat.change}</span>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Ping Statistics by Host</h3>
          {hostStats.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No ping data available. Start pinging from the Run tab.</p>
          ) : (
            <div className="space-y-4">
              {hostStats.map((stat, index) => (
                <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-semibold">{stat.host}</p>
                      <p className="text-gray-400 text-sm">Last ping: {stat.lastPing?.timestamp || 'N/A'}</p>
                    </div>
                    <div
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: stat.successRate >= 90 ? '#10b98120' : stat.successRate >= 50 ? '#f59e0b20' : '#ef444420',
                        color: stat.successRate >= 90 ? '#10b981' : stat.successRate >= 50 ? '#f59e0b' : '#ef4444',
                      }}
                    >
                      {stat.successRate.toFixed(1)}%
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Successful / Failed</p>
                      <p className="text-white font-semibold">{stat.successfulPings} / {stat.failedPings}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Total Pings</p>
                      <p className="text-white font-semibold">{stat.totalPings}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500 mb-1">Avg</p>
                      <p className="text-blue-400 font-semibold">{stat.averageResponseTime.toFixed(2)}ms</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Min</p>
                      <p className="text-green-400 font-semibold">{stat.minResponseTime.toFixed(2)}ms</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Max</p>
                      <p className="text-red-400 font-semibold">{stat.maxResponseTime.toFixed(2)}ms</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-xs mt-2 pt-2 border-t border-white/10">
                    <div>
                      <p className="text-gray-500 mb-1">Jitter (Stddev)</p>
                      <p className="text-purple-400 font-semibold">{stat.jitter.toFixed(2)}ms</p>
                    </div>
                  </div>

                  <div className="w-full bg-gray-800/50 rounded-full h-2 mt-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${stat.successRate}%`,
                        backgroundColor: stat.successRate >= 90 ? '#10b981' : stat.successRate >= 50 ? '#f59e0b' : '#ef4444'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Recent Ping Results</h3>
          {pingResults.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No ping results yet. Start pinging to see results.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {[...pingResults].reverse().slice(0, 20).map((result, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <div>
                    {result.success ? (
                      <CheckCircle size={20} className="text-green-400" />
                    ) : (
                      <XCircle size={20} className="text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{result.host}</p>
                    <p className="text-gray-500 text-xs">{result.timestamp}</p>
                  </div>
                  <div className="text-right">
                    {result.success ? (
                      <p className="text-green-400 text-sm font-semibold">{result.responseTime?.toFixed(2)}ms</p>
                    ) : (
                      <p className="text-red-400 text-sm font-semibold">Failed</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Detailed Statistics</h3>
        {hostStats.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No data available yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {hostStats.map((stat, index) => (
              <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-gray-400 text-sm mb-2">{stat.host}</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Success Rate:</span>
                    <span className="text-white font-semibold text-xs">{stat.successRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Avg Response:</span>
                    <span className="text-blue-400 font-semibold text-xs">{stat.averageResponseTime.toFixed(2)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Total Pings:</span>
                    <span className="text-white font-semibold text-xs">{stat.totalPings}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};
