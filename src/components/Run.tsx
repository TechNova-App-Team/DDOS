import { useState } from 'react';
import { GlassCard } from './GlassCard';
import { useTheme } from '../contexts/ThemeContext';
import { usePing } from '../contexts/PingContext';
import { Play, Square, RotateCcw, Download, Upload, Terminal, Network, Trash2, Zap, Radio, Eye, Gauge, MapPin } from 'lucide-react';

const PRESET_HOSTS = [
  { name: 'Google DNS', host: '8.8.8.8' },
  { name: 'Cloudflare DNS', host: '1.1.1.1' },
  { name: 'OpenDNS', host: '208.67.222.222' },
  { name: 'localhost', host: 'localhost' },
];

export const Run = () => {
  const { accentColor, themeColor } = useTheme();
  const { pingResults, detailedLogs, isRunning, startPingSession, stopPingSession, clearResults, addDetailedLog } = usePing();
  const [targetHost, setTargetHost] = useState('8.8.8.8');
  const [newHostInput, setNewHostInput] = useState('');
  const [savedHosts, setSavedHosts] = useState<string[]>(['8.8.8.8', '1.1.1.1']);
  const [pingCount, setPingCount] = useState(100);
  const [pingInterval, setPingInterval] = useState(0.01); // Much faster default
  const [portRange, setPortRange] = useState('80,443,8080');
  const [httpCheckUrl, setHttpCheckUrl] = useState('http://google.com');
  const [useDuration, setUseDuration] = useState(false);
  const [pingDuration, setPingDuration] = useState(10); // 10 seconds
  const [logs, setLogs] = useState<string[]>([
    '[INFO] System initialized',
    '[INFO] Ready to execute tasks',
  ]);

  const handleAddHost = () => {
    if (newHostInput && !savedHosts.includes(newHostInput)) {
      setSavedHosts(prev => [...prev, newHostInput]);
      setTargetHost(newHostInput);
      setNewHostInput('');
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Added new host: ${newHostInput}`]);
    }
  };

  const handleRemoveHost = (host: string) => {
    setSavedHosts(prev => prev.filter(h => h !== host));
    if (targetHost === host) {
      setTargetHost(savedHosts[0] || '');
    }
  };

  const handleStartPing = async () => {
    if (useDuration) {
      const newLog = `[${new Date().toLocaleTimeString()}] Starting continuous ping to ${targetHost}... (${pingDuration} seconds)`;
      setLogs(prev => [...prev, newLog]);
      
      try {
        // Calculate how many pings we can do in this duration
        const estimatedPings = Math.ceil((pingDuration * 1000) / (pingInterval * 1000));
        await startPingSession(targetHost, estimatedPings, pingInterval);
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Continuous ping session completed`]);
      } catch (error) {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [ERROR] ${error instanceof Error ? error.message : 'Unknown error'}`]);
      }
    } else {
      const newLog = `[${new Date().toLocaleTimeString()}] Starting ping to ${targetHost}... (${pingCount} packets)`;
      setLogs(prev => [...prev, newLog]);
      
      try {
        await startPingSession(targetHost, pingCount, pingInterval);
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Ping session completed`]);
      } catch (error) {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [ERROR] ${error instanceof Error ? error.message : 'Unknown error'}`]);
      }
    }
  };

  const handleStopPing = () => {
    stopPingSession();
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Ping session stopped by user`]);
  };

  const handleClear = () => {
    clearResults();
    setLogs(['[INFO] System reset', '[INFO] Ready to execute tasks']);
  };

  const handleQuickPing = async (count: number, interval: number) => {
    setPingCount(count);
    setPingInterval(interval);
    const newLog = `[${new Date().toLocaleTimeString()}] Starting mass ping (${count} packets, ${interval}s interval)...`;
    setLogs(prev => [...prev, newLog]);
    
    try {
      await startPingSession(targetHost, count, interval);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Mass ping completed`]);
    } catch (error) {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [ERROR] ${error instanceof Error ? error.message : 'Unknown error'}`]);
    }
  };

  const handlePortScan = async () => {
    const ports = portRange.split(',').map(p => p.trim()).filter(p => p && !isNaN(Number(p))).map(Number);
    const scanLog = `[${new Date().toLocaleTimeString()}] Starting port scan on ${targetHost} for ports: ${ports.join(', ')}`;
    setLogs(prev => [...prev, scanLog]);
    
    for (const port of ports) {
      try {
        const result = await (window as any).electronAPI.pingHost(targetHost, port);
        const portLog = `[${new Date().toLocaleTimeString()}] Port ${port}: ${result.success ? 'OPEN' : 'CLOSED'} (${result.time}ms)`;
        setLogs(prev => [...prev, portLog]);
        addDetailedLog({
          timestamp: Date.now(),
          targetHost,
          logType: 'port-scan-result',
          details: portLog
        });
      } catch (error) {
        const errorLog = `[${new Date().toLocaleTimeString()}] [ERROR] Port ${port}: ${String(error)}`;
        setLogs(prev => [...prev, errorLog]);
      }
    }
  };

  const handleDnsLookup = async () => {
    try {
      const startLog = `[${new Date().toLocaleTimeString()}] Resolving DNS for ${targetHost}...`;
      setLogs(prev => [...prev, startLog]);

      const result = await (window as any).electronAPI.resolveDns(targetHost);
      if (result.success && result.addresses) {
        const resultLog = `[${new Date().toLocaleTimeString()}] ${targetHost} resolved to: ${result.addresses.join(', ')} (${result.time}ms)`;
        setLogs(prev => [...prev, resultLog]);
        addDetailedLog({
          timestamp: Date.now(),
          targetHost,
          logType: 'dns-result',
          details: resultLog
        });
      } else {
        const errorLog = `[${new Date().toLocaleTimeString()}] [ERROR] DNS lookup failed: ${result.error}`;
        setLogs(prev => [...prev, errorLog]);
      }
    } catch (error) {
      const errorLog = `[${new Date().toLocaleTimeString()}] [ERROR] ${String(error)}`;
      setLogs(prev => [...prev, errorLog]);
    }
  };

  const handleHttpCheck = async () => {
    const url = httpCheckUrl.startsWith('http') ? httpCheckUrl : `http://${httpCheckUrl}`;
    try {
      const startLog = `[${new Date().toLocaleTimeString()}] Checking HTTP status for ${url}...`;
      setLogs(prev => [...prev, startLog]);

      const result = await (window as any).electronAPI.checkHttpStatus(url);
      const resultLog = `[${new Date().toLocaleTimeString()}] HTTP Status: ${result.statusCode} (${result.time}ms) - ${result.statusMessage}`;
      setLogs(prev => [...prev, resultLog]);
      addDetailedLog({
        timestamp: Date.now(),
        targetHost: url,
        logType: 'http-result',
        details: resultLog
      });
    } catch (error) {
      const errorLog = `[${new Date().toLocaleTimeString()}] [ERROR] ${String(error)}`;
      setLogs(prev => [...prev, errorLog]);
    }
  };

  const actions = [
    { icon: Upload, label: 'Import Data', action: () => setLogs(prev => [...prev, '[INFO] Import initiated']) },
    { icon: Download, label: 'Export Data', action: () => setLogs(prev => [...prev, '[INFO] Export initiated']) },
    { icon: Terminal, label: 'Run Script', action: () => setLogs(prev => [...prev, '[INFO] Script execution started']) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Network Testing Tools</h1>
        <p className="text-gray-400">Ping, DNS lookup, port scanning, and HTTP status checking</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Network size={24} style={{ color: accentColor }} />
                <h3 className="text-xl font-semibold text-white">Testing Configuration</h3>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${isRunning ? 'animate-pulse' : ''}`}
                  style={{ backgroundColor: isRunning ? '#10b981' : '#6b7280' }}
                />
                <span className="text-sm text-gray-400">
                  {isRunning ? 'Running' : 'Ready'}
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Saved Targets</label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {savedHosts.map((host) => (
                    <div key={host} className="flex items-center justify-between">
                      <button
                        onClick={() => setTargetHost(host)}
                        disabled={isRunning}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          targetHost === host
                            ? 'bg-blue-500/50 border border-blue-400 text-white'
                            : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                        } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {host}
                      </button>
                      <button
                        onClick={() => handleRemoveHost(host)}
                        disabled={isRunning}
                        className="ml-2 px-2 py-2 rounded-lg text-xs font-medium bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Add New Target</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHostInput}
                    onChange={(e) => setNewHostInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddHost()}
                    disabled={isRunning}
                    placeholder="IP oder Domain (z.B. 192.168.1.1 oder router.local)"
                    className={`
                      flex-1 px-4 py-2 rounded-lg border transition-all
                      bg-white/5 border-white/10 text-white placeholder-gray-500
                      focus:outline-none focus:border-white/30
                      ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  />
                  <button
                    onClick={handleAddHost}
                    disabled={isRunning || !newHostInput}
                    className={`px-4 py-2 rounded-lg font-medium transition-all bg-green-500/20 border border-green-500/40 text-green-300 hover:bg-green-500/30 ${
                      isRunning || !newHostInput ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Target Host/URL</label>
                <input
                  type="text"
                  value={targetHost}
                  onChange={(e) => setTargetHost(e.target.value)}
                  disabled={isRunning}
                  placeholder="e.g., google.com or 8.8.8.8"
                  className={`
                    w-full px-4 py-3 rounded-lg border transition-all
                    bg-white/5 border-white/10 text-white placeholder-gray-500
                    focus:outline-none focus:border-white/30
                    ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Ping Mode</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setUseDuration(false)}
                    disabled={isRunning}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      !useDuration
                        ? 'bg-blue-500/40 border border-blue-400 text-blue-200'
                        : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                    } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Count Mode
                  </button>
                  <button
                    onClick={() => setUseDuration(true)}
                    disabled={isRunning}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      useDuration
                        ? 'bg-cyan-500/40 border border-cyan-400 text-cyan-200'
                        : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                    } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Duration Mode
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {useDuration ? 'Duration (seconds)' : 'Ping Count'}
                  </label>
                  <input
                    type="number"
                    value={useDuration ? pingDuration : pingCount}
                    onChange={(e) => 
                      useDuration 
                        ? setPingDuration(Math.max(1, parseInt(e.target.value) || 1))
                        : setPingCount(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    disabled={isRunning}
                    min={useDuration ? "1" : "1"}
                    max={useDuration ? "300" : "10000"}
                    className={`
                      w-full px-4 py-3 rounded-lg border transition-all
                      bg-white/5 border-white/10 text-white
                      focus:outline-none focus:border-white/30
                      ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {useDuration ? `Max 300s (5 min)` : `Max 10000 pings`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Interval (seconds)</label>
                  <input
                    type="number"
                    value={pingInterval}
                    onChange={(e) => setPingInterval(Math.max(0.001, parseFloat(e.target.value) || 0.01))}
                    disabled={isRunning}
                    min="0.001"
                    step="0.001"
                    className={`
                      w-full px-4 py-3 rounded-lg border transition-all
                      bg-white/5 border-white/10 text-white
                      focus:outline-none focus:border-white/30
                      ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Min 0.001s (1ms) for ultra-fast
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <label className="block text-sm font-medium text-gray-300 mb-3">Port Range (for port scan)</label>
                <input
                  type="text"
                  value={portRange}
                  onChange={(e) => setPortRange(e.target.value)}
                  disabled={isRunning}
                  placeholder="e.g., 80,443,8080 or 22,3306,5432"
                  className={`
                    w-full px-4 py-3 rounded-lg border transition-all
                    bg-white/5 border-white/10 text-white
                    focus:outline-none focus:border-white/30
                    ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                />
              </div>

              <div className="pt-4 border-t border-white/10">
                <label className="block text-sm font-medium text-gray-300 mb-3">HTTP Check URL</label>
                <input
                  type="text"
                  value={httpCheckUrl}
                  onChange={(e) => setHttpCheckUrl(e.target.value)}
                  disabled={isRunning}
                  placeholder="e.g., http://example.com or https://api.example.com"
                  className={`
                    w-full px-4 py-3 rounded-lg border transition-all
                    bg-white/5 border-white/10 text-white
                    focus:outline-none focus:border-white/30
                    ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-300">Ping Tests</h4>
              <div className="flex gap-4">
                <button
                  onClick={handleStartPing}
                  disabled={isRunning}
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-4 rounded-xl
                    font-medium transition-all duration-300
                    ${isRunning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                  `}
                  style={{
                  backgroundColor: accentColor + '20',
                  color: accentColor,
                  border: `1px solid ${accentColor}40`
                }}
              >
                <Play size={20} />
                Start Ping
              </button>

              <button
                onClick={handleStopPing}
                disabled={!isRunning}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-4 rounded-xl
                  font-medium transition-all duration-300
                  ${!isRunning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                  ${themeColor === 'black' ? 'bg-red-500/20 border-red-500/40' : 'bg-red-500/20 border-red-500/40'}
                `}
                style={{ border: '1px solid rgba(239, 68, 68, 0.4)' }}
              >
                <Square size={20} className="text-red-400" />
                <span className="text-red-400">Stop</span>
              </button>

              <button
                onClick={handleClear}
                className={`
                  px-6 py-4 rounded-xl font-medium transition-all duration-300
                  ${themeColor === 'black' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-800/50 hover:bg-gray-700/50'}
                  text-gray-300 hover:text-white
                `}
                disabled={isRunning}
              >
                <Trash2 size={20} />
              </button>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2">
                <button
                  onClick={() => handleQuickPing(100, 0.1)}
                  disabled={isRunning}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/30 ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Zap size={16} className="inline mr-1" />
                  100x
                </button>
                <button
                  onClick={() => handleQuickPing(500, 0.05)}
                  disabled={isRunning}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all bg-orange-500/20 border border-orange-500/40 text-orange-300 hover:bg-orange-500/30 ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Zap size={16} className="inline mr-1" />
                  500x
                </button>
                <button
                  onClick={() => handleQuickPing(1000, 0.01)}
                  disabled={isRunning}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Zap size={16} className="inline mr-1" />
                  1000x
                </button>
                <button
                  onClick={() => handleQuickPing(5000, 0.01)}
                  disabled={isRunning}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all bg-red-600/20 border border-red-600/40 text-red-400 hover:bg-red-600/30 ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Zap size={16} className="inline mr-1" />
                  5000x
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-white/10 mt-6">
              <h4 className="text-sm font-semibold text-gray-300">Advanced Tests</h4>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={handleDnsLookup}
                  disabled={isRunning}
                  className={`
                    px-4 py-3 rounded-xl font-medium transition-all duration-300
                    flex items-center justify-center gap-2
                    bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30
                    ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <MapPin size={16} />
                  DNS Lookup
                </button>
                <button
                  onClick={handlePortScan}
                  disabled={isRunning}
                  className={`
                    px-4 py-3 rounded-xl font-medium transition-all duration-300
                    flex items-center justify-center gap-2
                    bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30
                    ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <Network size={16} />
                  Port Scan
                </button>
                <button
                  onClick={handleHttpCheck}
                  disabled={isRunning}
                  className={`
                    px-4 py-3 rounded-xl font-medium transition-all duration-300
                    flex items-center justify-center gap-2
                    bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30
                    ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <Eye size={16} />
                  HTTP Check
                </button>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Console Output</h3>
            <div
              className={`
                rounded-lg p-4 font-mono text-sm h-64 overflow-y-auto
                ${themeColor === 'black' ? 'bg-black/40' : 'bg-gray-900/40'}
              `}
            >
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`
                    ${log.includes('[INFO]') ? 'text-blue-400' :
                      log.includes('[ERROR]') ? 'text-red-400' :
                      log.includes('success') ? 'text-green-400' :
                      'text-gray-300'}
                  `}
                >
                  {log}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className={`
                    w-full flex items-center gap-3 p-4 rounded-xl
                    transition-all duration-300 hover:scale-105
                    ${themeColor === 'black' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-800/50 hover:bg-gray-700/50'}
                  `}
                  disabled={isRunning}
                >
                  <action.icon size={20} style={{ color: accentColor }} />
                  <span className="text-white font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Ping Statistics</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Total Pings</span>
                  <span className="text-white font-medium">{pingResults.length}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Successful</span>
                  <span className="text-green-400 font-medium">{pingResults.filter(p => p.success).length}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Failed</span>
                  <span className="text-red-400 font-medium">{pingResults.filter(p => !p.success).length}</span>
                </div>
              </div>
              {pingResults.length > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Success Rate</span>
                    <span className="text-blue-400 font-medium">
                      {((pingResults.filter(p => p.success).length / pingResults.length) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">About</h3>
            <div className="text-sm text-gray-400 space-y-2">
              <p>• <strong>Ping:</strong> TCP connectivity tests</p>
              <p>• <strong>DNS:</strong> Domain name resolution</p>
              <p>• <strong>Port Scan:</strong> Check open ports</p>
              <p>• <strong>HTTP Check:</strong> Test web server status</p>
              <p className="pt-2 text-xs text-gray-500">All tests are for network diagnostics only</p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
