import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

export interface PingResult {
  timestamp: string;
  host: string;
  success: boolean;
  responseTime?: number;
  error?: string;
  packetSize?: number;
  ttl?: number;
  sequenceNumber?: number;
  sourceIp?: string;
}

export interface DetailedLog {
  id?: string;
  timestamp: number;
  sourceIp?: string;
  targetHost: string;
  targetIp?: string;
  packetSize?: number;
  sequenceNumber?: number;
  responseTime?: number;
  ttl?: number;
  success?: boolean;
  error?: string;
  logType: string;
  details?: string;
}

export interface HostStatistics {
  host: string;
  totalPings: number;
  successfulPings: number;
  failedPings: number;
  successRate: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  jitter: number; // Standard deviation of response times
  lastPing?: PingResult;
}

interface PingContextType {
  pingResults: PingResult[];
  detailedLogs: DetailedLog[];
  hostStats: HostStatistics[];
  isRunning: boolean;
  startPingSession: (host: string, count: number, interval: number) => Promise<void>;
  stopPingSession: () => void;
  clearResults: () => void;
  getHostStatistics: (host: string) => HostStatistics | undefined;
  addDetailedLog: (log: DetailedLog) => void;
}


const PingContext = createContext<PingContextType | undefined>(undefined);

export const PingProvider = ({ children }: { children: ReactNode }) => {
  const [pingResults, setPingResults] = useState<PingResult[]>([]);
  const [detailedLogs, setDetailedLogs] = useState<DetailedLog[]>([]);
  const [hostStats, setHostStats] = useState<HostStatistics[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const shouldStopRef = useRef(false);

  const computeStats = useCallback((results: PingResult[]) => {
    const groupedByHost: Record<string, PingResult[]> = {};
    
    results.forEach(result => {
      if (!groupedByHost[result.host]) {
        groupedByHost[result.host] = [];
      }
      groupedByHost[result.host].push(result);
    });

    const stats: HostStatistics[] = Object.entries(groupedByHost).map(([host, hostResults]) => {
      const successful = hostResults.filter(r => r.success);
      const responseTimes = successful
        .map(r => r.responseTime || 0)
        .filter(t => t > 0);

      // Calculate average
      const average = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      // Calculate jitter (standard deviation)
      let jitter = 0;
      if (responseTimes.length > 1) {
        const squaredDiffs = responseTimes.map(time => Math.pow(time - average, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / responseTimes.length;
        jitter = Math.sqrt(variance);
      }

      return {
        host,
        totalPings: hostResults.length,
        successfulPings: successful.length,
        failedPings: hostResults.length - successful.length,
        successRate: (successful.length / hostResults.length) * 100,
        averageResponseTime: average,
        minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
        maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
        jitter: jitter,
        lastPing: hostResults[hostResults.length - 1],
      };
    });

    setHostStats(stats);
  }, []);

  const startPingSession = useCallback(async (host: string, count: number, interval: number) => {
    setIsRunning(true);
    shouldStopRef.current = false;

    try {
      for (let i = 0; i < count; i++) {
        if (shouldStopRef.current) break;

        try {
          const startTime = performance.now();
          
          // Check if running in Electron
          const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
          
          let result: PingResult;

          if (isElectron) {
            // Use Electron IPC for real TCP connectivity check
            const pingResult = await (window as any).electronAPI.pingHost(host, 80);
            
            result = {
              timestamp: new Date().toLocaleTimeString(),
              host,
              success: pingResult.success,
              responseTime: pingResult.time ? parseInt(pingResult.time) : undefined,
              error: pingResult.error,
            };
          } else {
            // Fallback to fetch for browser
            const response = await Promise.race([
              fetch(`https://${host}/`, {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache',
              }),
              new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 5000)
              ),
            ]).catch(() => null);

            const endTime = performance.now();
            const responseTime = endTime - startTime;
            const success = response !== null;

            result = {
              timestamp: new Date().toLocaleTimeString(),
              host,
              success,
              responseTime: success ? responseTime : undefined,
              error: success ? undefined : 'Connection timeout or failed',
            };
          }

          setPingResults(prev => {
            const updated = [...prev, result];
            computeStats(updated);
            return updated;
          });
        } catch (error) {
          const result: PingResult = {
            timestamp: new Date().toLocaleTimeString(),
            host,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };

          setPingResults(prev => {
            const updated = [...prev, result];
            computeStats(updated);
            return updated;
          });
        }

        if (i < count - 1 && !shouldStopRef.current) {
          await new Promise(resolve => setTimeout(resolve, interval * 1000));
        }
      }
    } finally {
      setIsRunning(false);
    }
  }, [computeStats]);

  const stopPingSession = useCallback(() => {
    shouldStopRef.current = true;
    setIsRunning(false);
  }, []);

  const clearResults = useCallback(() => {
    setPingResults([]);
    setHostStats([]);
  }, []);

  const getHostStatistics = useCallback(
    (host: string) => hostStats.find(stat => stat.host === host),
    [hostStats]
  );

  const addDetailedLog = useCallback((log: DetailedLog) => {
    setDetailedLogs(prev => [...prev, log]);
  }, []);

  return (
    <PingContext.Provider
      value={{
        pingResults,
        detailedLogs,
        hostStats,
        isRunning,
        startPingSession,
        stopPingSession,
        clearResults,
        getHostStatistics,
        addDetailedLog,
      }}
    >
      {children}
    </PingContext.Provider>
  );
};

export const usePing = () => {
  const context = useContext(PingContext);
  if (context === undefined) {
    throw new Error('usePing must be used within a PingProvider');
  }
  return context;
};
