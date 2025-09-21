import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function LoadingSpinner() {
  return (
    <div className='min-h-screen bg-gradient-to-br'>
      <div className='container mx-auto max-w-6xl px-4 py-8'>
        <div className='mb-8'>
          <Skeleton className='mb-2 h-8 w-64' />
          <Skeleton className='h-4 w-96' />
        </div>

        <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-3'>
          {[1, 2, 3].map(i => (
            <Card key={i} className='border-0 shadow-lg'>
              <CardHeader>
                <Skeleton className='h-6 w-32' />
              </CardHeader>
              <CardContent>
                <Skeleton className='mb-2 h-8 w-24' />
                <Skeleton className='h-4 w-40' />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
          <div className='lg:col-span-2'>
            <Card className='border-0 shadow-lg'>
              <CardHeader>
                <Skeleton className='h-6 w-32' />
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className='h-16 w-full' />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className='space-y-6'>
            <Card className='border-0 shadow-lg'>
              <CardHeader>
                <Skeleton className='h-6 w-32' />
              </CardHeader>
              <CardContent>
                <Skeleton className='h-10 w-full' />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
