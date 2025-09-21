import { Button } from '@/components/ui/button';
import { Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DataError({
  title = 'Failed to Load Data',
  message = "We couldn't load the requested information. Please try refreshing the page.",
}) {
  const navigate = useNavigate();

  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-4'>
        <div className='bg-muted rounded-full p-4'>
          <Database className='text-muted-foreground h-12 w-12' />
        </div>
        <h1 className='text-center text-4xl font-bold'>{title}</h1>
        <p className='text-muted-foreground max-w-md text-center'>{message}</p>
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
