import { forwardRef } from 'react';
import { Cloud, CloudOff, Download, Upload, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ForwardRef wrapper for tooltip triggers that aren't buttons
const StatusIndicator = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  )
);
StatusIndicator.displayName = 'StatusIndicator';

export type SyncState = 'idle' | 'synced' | 'pending' | 'syncing' | 'error' | 'offline';

interface SyncStatusProps {
  state: SyncState;
  lastSynced: Date | null;
  error: string | null;
  isConfigured: boolean;
  onPull: () => void;
  onPush: () => void;
}

export function SyncStatus({ state, lastSynced, error, isConfigured, onPull, onPush }: SyncStatusProps) {
  if (!isConfigured) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <StatusIndicator className="flex items-center text-muted-foreground">
              <CloudOff className="h-4 w-4" />
            </StatusIndicator>
          </TooltipTrigger>
          <TooltipContent>
            <p>GitHub sync not configured</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const getStatusIcon = () => {
    switch (state) {
      case 'syncing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'synced':
        return <Cloud className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Cloud className="h-4 w-4 text-warning" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'offline':
        return <CloudOff className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Cloud className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (state) {
      case 'syncing':
        return 'Syncing...';
      case 'synced':
        return lastSynced ? `Synced ${formatTime(lastSynced)}` : 'Synced';
      case 'pending':
        return 'Unsaved changes';
      case 'error':
        return error || 'Sync error';
      case 'offline':
        return 'Offline';
      default:
        return 'Ready to sync';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return date.toLocaleDateString();
  };

  const isSyncing = state === 'syncing';

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <StatusIndicator className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground cursor-default">
              {getStatusIcon()}
              <span className="hidden sm:inline">{getStatusText()}</span>
            </StatusIndicator>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getStatusText()}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onPull}
              disabled={isSyncing}
            >
              <Download className="h-3.5 w-3.5" />
              <span className="sr-only">Pull from GitHub</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Pull latest from GitHub</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onPush}
              disabled={isSyncing || state === 'synced'}
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="sr-only">Push to GitHub</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Push changes to GitHub</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
