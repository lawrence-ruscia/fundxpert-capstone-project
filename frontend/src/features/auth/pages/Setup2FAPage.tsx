import { DataError } from '@/shared/components/DataError';
import { use2faSetup } from '../hooks/use2faSetup';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { BackButton } from '@/shared/components/back-button';

export const Setup2FAPage = () => {
  const { userId, qrCode, isLoading, error, handleProceed, retryFetch } =
    use2faSetup();

  // User ID validation - redirect handled in hook
  if (!userId) {
    return (
      <DataError
        title='Failed to Load User Data'
        message='Unable to retrieve user information. Please log in again.'
      />
    );
  }

  // Loading state
  if (isLoading) {
    return <LoadingSpinner text='Generating QR' />;
  }

  // Error state with retry option
  if (error) {
    return <DataError title='Failed to Setup 2FA' message={error} />;
  }

  return (
    <Card className='gap-4'>
      <CardHeader className='space-y-4 text-center'>
        <BackButton />

        <CardTitle className='text-xl font-semibold'>
          Setup Two-Factor Authentication
        </CardTitle>
        <CardDescription className='text-sm leading-relaxed'>
          Scan this QR code using your authenticator app, then click "Next" to
          enter your 6-digit code.
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-6'>
        <div className='flex justify-center'>
          <div className='bg-muted rounded-lg p-4'>
            {qrCode ? (
              <img
                src={qrCode}
                alt='Scan QR for 2FA'
                className='h-48 w-48 object-contain'
                onError={e => {
                  console.error('QR code image failed to load');
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            ) : (
              <div className='flex h-48 w-48 items-center justify-center rounded bg-gray-200'>
                <span className='text-muted-foreground'>
                  Loading QR code...
                </span>
              </div>
            )}
          </div>
        </div>

        <div className='flex gap-3'>
          <Button
            variant='outline'
            onClick={retryFetch}
            className='flex-1'
            disabled={isLoading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Generate New QR
          </Button>

          <Button
            className='flex-1'
            onClick={handleProceed}
            disabled={!qrCode || isLoading}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
