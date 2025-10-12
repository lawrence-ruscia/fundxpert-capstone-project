import { RefreshCw, Pause, Play, WifiOff, Eye, EyeOff } from 'lucide-react';
import { useSmartPollingContext } from '../context/SmartPollingContext';
interface GlobalPollingOverlayProps {
  show?: boolean; // Force show overlay regardless of status
  position?: 'top' | 'bottom' | 'center';
  showWhenPaused?: boolean; // Show overlay when polling is paused
}

export function GlobalPollingOverlay({
  show = false,
  position = 'top',
  showWhenPaused = true,
}: GlobalPollingOverlayProps) {
  const {
    isTabVisible,
    isUserActive,
    globalPausePolling,
    setGlobalPausePolling,
  } = useSmartPollingContext();

  const isPaused = globalPausePolling || !isTabVisible || !isUserActive;
  const shouldShow = show || (showWhenPaused && isPaused);

  if (!shouldShow) return null;

  const positionClasses = {
    top: 'items-start pt-20',
    bottom: 'items-end pb-20',
    center: 'items-center',
  };

  const getStatusInfo = () => {
    if (globalPausePolling) {
      return {
        icon: <Pause className='h-4 w-4' />,
        text: 'Polling paused globally',
        color: 'text-orange-600 dark:text-orange-400',
      };
    }
    if (!isTabVisible) {
      return {
        icon: <EyeOff className='h-4 w-4' />,
        text: 'Tab hidden - polling paused',
        color: 'text-blue-600 dark:text-blue-400',
      };
    }
    if (!isUserActive) {
      return {
        icon: <WifiOff className='h-4 w-4' />,
        text: 'Inactive - polling paused',
        color: 'text-gray-600 dark:text-gray-400',
      };
    }
    return {
      icon: <RefreshCw className='h-4 w-4 animate-spin' />,
      text: 'Polling active',
      color: 'text-green-600 dark:text-green-400',
    };
  };

  const status = getStatusInfo();

  return (
    <div
      className={`bg-background/80 fixed inset-0 z-50 flex justify-center backdrop-blur-sm ${positionClasses[position]}`}
    >
      <div className='bg-card flex items-center gap-3 rounded-lg border p-4 shadow-lg'>
        <div className={status.color}>{status.icon}</div>

        <span className='text-sm font-medium'>{status.text}</span>

        {globalPausePolling && (
          <button
            onClick={() => setGlobalPausePolling(false)}
            className='ml-2 flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700'
          >
            <Play className='h-3 w-3' />
            Resume
          </button>
        )}

        {!globalPausePolling && isTabVisible && isUserActive && (
          <button
            onClick={() => setGlobalPausePolling(true)}
            className='ml-2 flex items-center gap-1.5 rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-700'
          >
            <Pause className='h-3 w-3' />
            Pause
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PollingStatusBadge.tsx
// Compact badge for showing polling status in navigation/header
// ============================================================================

export function PollingStatusBadge() {
  const {
    isTabVisible,
    isUserActive,
    globalPausePolling,
    setGlobalPausePolling,
  } = useSmartPollingContext();

  const isPaused = globalPausePolling || !isTabVisible || !isUserActive;

  return (
    <button
      onClick={() => setGlobalPausePolling(!globalPausePolling)}
      className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        isPaused
          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400'
          : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
      }`}
      title={isPaused ? 'Click to resume polling' : 'Click to pause polling'}
    >
      {isPaused ? (
        <Pause className='h-3 w-3' />
      ) : (
        <RefreshCw className='h-3 w-3 animate-spin' />
      )}
      <span>{isPaused ? 'Paused' : 'Active'}</span>
    </button>
  );
}

// ============================================================================
// InlinePollingStatus.tsx
// Inline status indicator for individual components
// ============================================================================

interface InlinePollingStatusProps {
  isPaused: boolean;
  lastUpdated: Date | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function InlinePollingStatus({
  isPaused,
  lastUpdated,
  onRefresh,
  isRefreshing = false,
}: InlinePollingStatusProps) {
  return (
    <div className='text-muted-foreground flex items-center gap-3 text-xs'>
      {isPaused && (
        <div className='flex items-center gap-1.5 text-orange-600 dark:text-orange-400'>
          <Pause className='h-3 w-3' />
          <span>Polling paused</span>
        </div>
      )}

      {lastUpdated && (
        <div className='flex items-center gap-1.5'>
          <Eye className='h-3 w-3' />
          <span>Updated {formatTimeAgo(lastUpdated)}</span>
        </div>
      )}

      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className='hover:bg-muted flex items-center gap-1 rounded-md px-2 py-1 transition-colors disabled:opacity-50'
        >
          <RefreshCw
            className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          <span>Refresh</span>
        </button>
      )}
    </div>
  );
}

// Helper function
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ============================================================================
// Usage Examples
// ============================================================================

/*
// Example 1: Full-screen overlay that shows when paused
import { GlobalPollingOverlay } from './GlobalPollingOverlay';

function App() {
  return (
    <SmartPollingProvider>
      <GlobalPollingOverlay position="top" showWhenPaused={true} />
      <YourApp />
    </SmartPollingProvider>
  );
}

// Example 2: Badge in navigation header
import { PollingStatusBadge } from './GlobalPollingOverlay';

function Header() {
  return (
    <header className="flex items-center justify-between p-4">
      <h1>Dashboard</h1>
      <PollingStatusBadge />
    </header>
  );
}

// Example 3: Inline status in dashboard component
import { InlinePollingStatus } from './GlobalPollingOverlay';
import { useSmartPolling } from './useSmartPolling';

function AdminDashboard() {
  const { data, loading, lastUpdated, refresh, isPaused } = useSmartPolling(
    fetchUsersData,
    { interval: 300000, enabled: true }
  );

  return (
    <div>
      <div className="mb-4">
        <InlinePollingStatus 
          isPaused={isPaused}
          lastUpdated={lastUpdated}
          onRefresh={refresh}
          isRefreshing={loading}
        />
      </div>
      
      {data && <DataTable data={data} />}
    </div>
  );
}

// Example 4: Show overlay only during background refresh
function Dashboard() {
  const { data, loading } = useSmartPolling(fetchData, { interval: 300000 });
  
  return (
    <>
      {loading && data && (
        <div className='fixed inset-0 z-50 flex items-start justify-center pt-20 backdrop-blur-sm bg-background/80'>
          <div className='bg-card flex items-center gap-2 rounded-lg border p-4 shadow-lg'>
            <RefreshCw className='h-4 w-4 animate-spin' />
            <span className='text-sm font-medium'>Updating data...</span>
          </div>
        </div>
      )}
      
      {data && <DataDisplay data={data} />}
    </>
  );
}
*/
