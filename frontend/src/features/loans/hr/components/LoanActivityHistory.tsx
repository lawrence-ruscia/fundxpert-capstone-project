import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { LoanHistory } from '../types/hrLoanType';
import { History } from 'lucide-react';
export const LoanActivityHistory = ({
  history,
}: {
  history: LoanHistory[];
}) => {
  return (
    <Card>
      <CardHeader className='pb-4'>
        <CardTitle className='flex items-center gap-2 text-lg'>
          <div className='bg-primary/10 rounded-lg p-2'>
            <History className='text-primary h-5 w-5' />
          </div>
          Activity History
        </CardTitle>
      </CardHeader>
      <CardContent className='max-h-96 overflow-y-auto'>
        {!history || history.length === 0 ? (
          <div className='py-8 text-center'>
            <History className='text-muted-foreground mx-auto mb-3 h-12 w-12 opacity-50' />
            <p className='text-muted-foreground text-sm'>
              No activity recorded yet.
            </p>
          </div>
        ) : (
          <div className='space-y-4'>
            {history.map((item, index) => (
              <div
                key={item.id}
                className='relative border-l-2 pb-4 pl-6 last:border-l-0 last:pb-0'
              >
                <div className='bg-primary border-background absolute top-0 left-0 h-3 w-3 -translate-x-1/2 rounded-full border-2' />
                <div className='space-y-1'>
                  <p className='text-base font-medium'>{item.action}</p>
                  <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                    <span>{item.actor_name || 'Unknown'}</span>
                    <span>•</span>
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                  {item.comments && (
                    <p className='text-muted-foreground mt-2 text-sm italic'>
                      "{item.comments}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
