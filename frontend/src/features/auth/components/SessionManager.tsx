// src/components/auth/SessionManager.tsx

import { Progress } from '@/components/ui/progress';
import { useSessionWarning } from '../hooks/useSessionWarning';
import { AlertTriangle, Clock, Shield } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function SessionManager() {
  const { showModal, countdown, extendSession, forceLogout } =
    useSessionWarning();

  if (!showModal) return null;

  // Calculate progress percentage (5 minutes = 300 seconds)
  const totalWarningTime = 300; // 5 minutes in seconds
  const progressPercentage =
    ((totalWarningTime - countdown) / totalWarningTime) * 100;

  // Format countdown for better display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  return (
    <AlertDialog open={true}>
      <AlertDialogContent className='border-border bg-background max-w-md'>
        <AlertDialogHeader className='text-center'>
          <div className='bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
            <AlertTriangle className='text-destructive h-8 w-8' />
          </div>
          <AlertDialogTitle className='text-foreground text-center text-xl font-semibold'>
            Session Timeout Warning
          </AlertDialogTitle>
          <AlertDialogDescription className='text-muted-foreground text-center'>
            Your secure session will expire soon for your protection.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className='space-y-6 py-4'>
          {/* Time Display */}
          <div className='text-center'>
            <div className='mb-2 flex items-center justify-center gap-2'>
              <Clock className='text-muted-foreground h-5 w-5' />
              <span className='text-muted-foreground text-sm font-medium'>
                Time Remaining
              </span>
            </div>
            <div className='text-foreground text-3xl font-bold tabular-nums'>
              {formatTime(countdown)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className='space-y-2'>
            <Progress value={progressPercentage} className='h-2' />
            <p className='text-muted-foreground text-center text-xs'>
              Session will automatically expire when timer reaches 0:00
            </p>
          </div>

          {/* Security Notice */}
          <div className='bg-muted/50 rounded-lg p-3'>
            <div className='flex items-start gap-2'>
              <Shield className='text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0' />
              <p className='text-muted-foreground text-xs leading-relaxed'>
                This timeout helps protect your account and sensitive
                information from unauthorized access.
              </p>
            </div>
          </div>
        </div>

        <AlertDialogFooter className='flex-col gap-2 sm:flex-row'>
          <AlertDialogCancel onClick={forceLogout}>
            Logout Now
          </AlertDialogCancel>
          <AlertDialogAction onClick={extendSession}>
            Continue Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
