import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Shield } from 'lucide-react';
import type { RoleSummary, UserSummary } from '../types/admin';

export const RoleDistribution = ({
  role_summary,
  user_summary,
}: {
  role_summary: RoleSummary[];
  user_summary: UserSummary;
}) => {
  return (
    <Card className='lg:col-span-1'>
      <CardHeader className='pb-4'>
        <CardTitle className='flex items-center gap-2 text-lg'>
          <div className='bg-primary/10 rounded-lg p-2'>
            <Shield className='text-primary h-5 w-5' />
          </div>
          User Roles
        </CardTitle>
        <CardDescription>Distribution by role type</CardDescription>
      </CardHeader>
      <CardContent>
        {role_summary.length > 0 ? (
          <div className='space-y-6'>
            {role_summary.map((r, index) => {
              const percentage =
                user_summary.total_users > 0
                  ? ((r.count / user_summary.total_users) * 100).toFixed(1)
                  : '0';

              // Color variations for different roles
              const colors = [
                'bg-blue-500',
                'bg-green-500',
                'bg-purple-500',
                'bg-orange-500',
              ];
              const bgColors = [
                'bg-blue-500/10',
                'bg-green-500/10',
                'bg-purple-500/10',
                'bg-orange-500/10',
              ];

              return (
                <div
                  key={r.role}
                  className='group hover:border-primary/50 relative overflow-hidden rounded-lg border p-4 transition-all hover:shadow-md'
                >
                  <div className='mb-3 flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <div
                        className={`${bgColors[index % bgColors.length]} rounded-lg p-2`}
                      >
                        <Shield className='h-4 w-4' />
                      </div>
                      <div>
                        <h4 className='text-base font-semibold'>{r.role}</h4>
                        <p className='text-muted-foreground text-xs'>
                          {r.count} {r.count === 1 ? 'user' : 'users'}
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-2xl font-bold'>{percentage}%</div>
                    </div>
                  </div>

                  <div className='relative'>
                    <div className='bg-muted h-2 overflow-hidden rounded-full'>
                      <div
                        className={`${colors[index % colors.length]} h-full rounded-full transition-all duration-500 ease-out`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Subtle background decoration */}
                  <div
                    className={`absolute -right-8 -bottom-8 h-24 w-24 ${bgColors[index % bgColors.length]} rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-30`}
                  />
                </div>
              );
            })}

            {/* Total Summary */}
            <div className='border-t pt-4'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground font-medium'>
                  Total Users
                </span>
                <span className='text-lg font-bold'>
                  {user_summary.total_users}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className='py-12 text-center'>
            <div className='bg-muted/50 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
              <Shield className='text-muted-foreground h-8 w-8' />
            </div>
            <p className='text-muted-foreground mb-1 font-medium'>
              No role data available
            </p>
            <p className='text-muted-foreground text-xs'>
              User roles will appear here once data is available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
