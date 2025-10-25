import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Clock, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RecentAction } from '../types/admin';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export const RecentActions = ({
  recent_actions,
}: {
  recent_actions: RecentAction[];
}) => {
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <div className='bg-primary/10 rounded-lg p-2'>
                <Clock className='text-primary h-5 w-5' />
              </div>
              Recent Admin Actions
            </CardTitle>
            <CardDescription>
              Latest administrative activities in the system
            </CardDescription>
          </div>
          {recent_actions.length > 0 && (
            <Badge variant='secondary' className='text-xs'>
              {recent_actions.length}{' '}
              {recent_actions.length === 1 ? 'action' : 'actions'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {recent_actions.length > 0 ? (
          <div className='max-h-96 space-y-3 overflow-y-auto'>
            {recent_actions.map((action, idx) => {
              const isRecent = idx < 3; // Highlight first 3 as most recent

              return (
                <div
                  key={idx}
                  className={`group hover:border-primary/50 relative rounded-lg border p-4 transition-all hover:shadow-md ${
                    isRecent ? 'bg-primary/5' : 'bg-background'
                  }`}
                >
                  <div className='flex items-start justify-between gap-4'>
                    <div className='flex min-w-0 flex-1 items-start gap-3'>
                      {/* Admin Icon */}
                      <div className='bg-primary/10 mt-0.5 flex-shrink-0 rounded-full p-2'>
                        <Users className='text-primary h-4 w-4' />
                      </div>

                      {/* Content */}
                      <div className='min-w-0 flex-1 space-y-1'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <span className='text-sm font-semibold'>
                            Admin #{action.user_id}
                          </span>
                          {isRecent && (
                            <Badge
                              variant='default'
                              className='px-1.5 py-0 text-xs'
                            >
                              New
                            </Badge>
                          )}
                        </div>
                        <p className='text-muted-foreground text-sm leading-relaxed'>
                          {action.action}
                        </p>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className='flex flex-shrink-0 flex-col items-end gap-1'>
                      <div className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                        <Clock className='h-3 w-3' />
                        <span>
                          {new Date(action.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <span className='text-muted-foreground text-xs'>
                        {new Date(action.timestamp).toLocaleString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Timeline connector (except last item) */}
                  {idx < recent_actions.length - 1 && (
                    <div className='bg-border absolute top-full left-7 h-3 w-px' />
                  )}
                </div>
              );
            })}

            {/* View All Link (optional) */}
            {recent_actions.length >= 5 && (
              <div className='border-t pt-4 text-center'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='text-xs'
                  onClick={() => navigate('/admin/logs')}
                >
                  View All Actions
                  <ChevronRight className='ml-1 h-3 w-3' />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className='py-12 text-center'>
            <div className='bg-muted/50 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
              <Clock className='text-muted-foreground h-8 w-8' />
            </div>
            <p className='text-muted-foreground mb-1 font-medium'>
              No recent actions recorded
            </p>
            <p className='text-muted-foreground text-xs'>
              Admin activities will appear here as they occur
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
