import { useEffect, useRef, useState, useCallback } from 'react';
import { useSmartPollingContext } from '../context/SmartPollingContext';

export type PollingContext =
  | 'loan-detail'
  | 'loan-table'
  | 'withdrawal-detail'
  | 'withdrawal-table'
  | 'contributions'
  | 'employees'
  | 'users'
  | 'dashboard'
  | 'idle'
  | 'custom';

/**
 * Returns a polling interval (in ms) optimized for the given context.
 * Covers all major modules: HR, Employee, Admin, Dashboard, etc.
 */
export function getSmartPollingInterval(context: PollingContext): number {
  switch (context) {
    // Loan pages — status-driven & dynamic
    case 'loan-detail':
      return 60_000; // 1 min (employee or HR watching single loan)
    case 'loan-table':
      return 120_000; // 2 min (overview list of many loans)

    // Withdrawals — similar to loans but fewer workflow steps
    case 'withdrawal-detail':
      return 60_000; // 1 min prev: 120_000
    case 'withdrawal-table':
      return 120_000; // 2 min prev: 80_000

    // Contributions — payroll based, rarely changes daily
    case 'contributions':
      return 600_000; // 10 min

    // HR Employee list — infrequent changes, manual refresh often enough
    case 'employees':
      return 300_000; // 5 min

    // Admin user management — low-change, mostly manual sync
    case 'users':
      return 600_000; // 10 min (or disable if preferred)

    // Dashboards — lightweight summaries
    case 'dashboard':
      return 120_000; // 2 min auto-refresh for metrics

    // Idle pages or background tabs
    case 'idle':
      return 900_000; // 15 min (failsafe for background)

    // Custom interval (use interval option directly)
    case 'custom':
    default:
      return 300_000; // 5 min default
  }
}

interface UseSmartPollingOptions {
  interval?: number; // Manual interval (overrides context)
  context?: PollingContext; // Auto-determine interval based on context
  enabled?: boolean;
  pauseWhenHidden?: boolean; // Pause when tab is hidden
  pauseWhenInactive?: boolean; // Pause when user is inactive
  backoffMultiplier?: number; // Multiplier for backoff on errors
  maxBackoffInterval?: number; // Max interval during backoff
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

export function useSmartPolling<T>(
  fetchFn: () => Promise<T>,
  options: UseSmartPollingOptions = {}
) {
  const {
    interval: manualInterval,
    context = 'custom',
    enabled = true,
    pauseWhenHidden = true,
    pauseWhenInactive = true,
    backoffMultiplier = 2,
    maxBackoffInterval = 1800000, // 30 minutes
    onError,
    onSuccess,
  } = options;

  // Determine interval: manual takes precedence, otherwise use context
  const baseInterval = manualInterval ?? getSmartPollingInterval(context);

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentInterval, setCurrentInterval] = useState(baseInterval);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);

  // Get context values (with fallback if context not available)
  let isTabVisible = true;
  let isUserActive = true;
  let globalPausePolling = false;

  try {
    const pollingContext = useSmartPollingContext();
    isTabVisible = pollingContext.isTabVisible;
    isUserActive = pollingContext.isUserActive;
    globalPausePolling = pollingContext.globalPausePolling;
  } catch {
    // Context not available, use default values
  }

  const fetchFnRef = useRef(fetchFn);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFnRef.current();
      setData(result);
      setLastUpdated(new Date());
      setConsecutiveErrors(0);
      setCurrentInterval(baseInterval); // Reset to base interval on success
      onSuccess?.();
    } catch (err) {
      console.error('❌ Smart polling fetch failed:', err);
      const errorMessage = (err as Error).message;
      setError(errorMessage);

      // Exponential backoff
      setConsecutiveErrors(prev => prev + 1);
      const newInterval = Math.min(
        baseInterval * Math.pow(backoffMultiplier, consecutiveErrors + 1),
        maxBackoffInterval
      );
      setCurrentInterval(newInterval);

      onError?.(err as Error);
    } finally {
      setLoading(false);
    }
  }, [
    baseInterval,
    consecutiveErrors,
    backoffMultiplier,
    maxBackoffInterval,
    onError,
    onSuccess,
  ]);

  useEffect(() => {
    // Initial fetch
    fetchData();
  }, [fetchData]);

  // Smart polling effect
  useEffect(() => {
    const shouldPoll =
      enabled &&
      !globalPausePolling &&
      (!pauseWhenHidden || isTabVisible) &&
      (!pauseWhenInactive || isUserActive);

    if (shouldPoll) {
      timerRef.current = setInterval(fetchData, currentInterval);
      console.log(
        `🔄 Smart polling active (context: ${context}, interval: ${currentInterval}ms)`
      );
    } else {
      console.log('⏸️  Smart polling paused');
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [
    fetchData,
    enabled,
    currentInterval,
    isTabVisible,
    isUserActive,
    globalPausePolling,
    pauseWhenHidden,
    pauseWhenInactive,
    context,
  ]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh: fetchData,
    isPaused:
      !enabled ||
      globalPausePolling ||
      (pauseWhenHidden && !isTabVisible) ||
      (pauseWhenInactive && !isUserActive),
    consecutiveErrors,
    currentInterval,
    context,
    baseInterval,
  };
}

// ============================================================================
// Usage Examples - Updated Dashboard Component
// ============================================================================

/*
// EXAMPLE 1: Using context-based intervals (recommended)
import { useSmartPolling } from './useSmartPolling';

function LoanDetailPage({ loanId }: { loanId: string }) {
  const fetchLoanData = useCallback(async () => {
    return await getLoanById(loanId);
  }, [loanId]);

  const { data, loading, error, refresh, lastUpdated, isPaused } = useSmartPolling(
    fetchLoanData,
    {
      context: 'loan-detail', // Auto uses 1 minute interval
      enabled: true,
      pauseWhenHidden: true,
      pauseWhenInactive: true,
    }
  );

  return (
    <div>
      {loading && !data && <Spinner />}
      {data && <LoanDetails loan={data} />}
    </div>
  );
}

// EXAMPLE 2: Loan table with 2-minute context
function LoansTablePage() {
  const { data, refresh, isPaused, currentInterval } = useSmartPolling(
    fetchAllLoans,
    {
      context: 'loan-table', // Auto uses 2 minute interval
    }
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1>Loans</h1>
        <div className="text-sm text-gray-500">
          {isPaused ? '⏸️ Paused' : `🔄 Refresh every ${currentInterval / 1000}s`}
        </div>
      </div>
      {data && <LoansTable loans={data} />}
    </div>
  );
}

// EXAMPLE 3: Dashboard with 2-minute context
function AdminDashboard() {
  const [autoRefreshEnabled] = usePersistedState('admin-dashboard-auto-refresh', true);

  const fetchDashboardData = useCallback(async () => {
    const users = await getAllUsers();
    const summary = await getUserSummary();
    return { users, summary };
  }, []);

  const { 
    data, 
    loading, 
    error, 
    refresh, 
    lastUpdated,
    isPaused,
    consecutiveErrors,
    currentInterval,
    baseInterval
  } = useSmartPolling(fetchDashboardData, {
    context: 'dashboard', // Auto uses 2 minute interval
    enabled: autoRefreshEnabled,
    pauseWhenHidden: true,
    pauseWhenInactive: true,
    onError: (error) => {
      console.error('Dashboard polling error:', error);
    },
    onSuccess: () => {
      console.log('Dashboard data refreshed');
    }
  });

  return (
    <div>
      <div className="polling-status">
        {isPaused && <span>⏸️ Polling paused</span>}
        {consecutiveErrors > 0 && (
          <span>⚠️ {consecutiveErrors} errors (backoff: {currentInterval}ms)</span>
        )}
        <span className="text-xs text-gray-500">
          Base interval: {baseInterval / 1000}s
        </span>
      </div>
      
      <button onClick={refresh}>Refresh Now</button>
      
      {lastUpdated && (
        <p>Last updated: {lastUpdated.toLocaleTimeString()}</p>
      )}
      
      {loading && !data && <Spinner />}
      {error && <ErrorMessage error={error} />}
      {data && <DashboardContent data={data} />}
    </div>
  );
}

// EXAMPLE 4: Users page with 10-minute context
function UsersPage() {
  const { data } = useSmartPolling(fetchAllUsers, {
    context: 'users', // Auto uses 10 minute interval
  });

  return <UsersTable users={data} />;
}

// EXAMPLE 5: Custom interval (overrides context)
function CustomIntervalPage() {
  const { data } = useSmartPolling(fetchData, {
    context: 'dashboard', // This will be ignored
    interval: 30000, // Manual 30 second interval takes precedence
  });

  return <DataDisplay data={data} />;
}

// EXAMPLE 6: Withdrawal detail page
function WithdrawalDetailPage({ withdrawalId }: { withdrawalId: string }) {
  const { data, refresh, loading } = useSmartPolling(
    () => getWithdrawalById(withdrawalId),
    {
      context: 'withdrawal-detail', // Auto uses 2 minute interval
    }
  );

  return (
    <div>
      {loading && <Spinner />}
      {data && <WithdrawalDetails withdrawal={data} />}
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}

// EXAMPLE 7: Contributions page
function ContributionsPage() {
  const { data, isPaused, currentInterval } = useSmartPolling(
    fetchContributions,
    {
      context: 'contributions', // Auto uses 10 minute interval
    }
  );

  console.log(`Polling every ${currentInterval / 60000} minutes`);
  
  return <ContributionsTable data={data} />;
}
*/
