import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NetworkError({
  message = 'Unable to connect to our servers. Please check your internet connection and try again.',
}: {
  message?: string | null;
}) {
  const navigate = useNavigate();
  return (
    <div className='h-svh border-2'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-4'>
        <h1 className='text-center text-4xl font-bold'>Connection Problem</h1>

        <p className='text-muted-foreground text-center'>{message}</p>
        <div className='mt-6 flex gap-4'>
          <Button variant='outline' onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    </div>
  );
}
