import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Lock,
  Unlock,
  Key,
  Shield,
  UserX,
  UserCog,
  User as UserIcon,
  Mail,
  Briefcase,
  Calendar,
  AlertCircle,
  Clock,
  DollarSign,
  Building,
  Hash,
  ShieldAlert,
  Eye,
  RefreshCw,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { useSmartPolling } from '@/shared/hooks/useSmartPolling';
import { getUserById } from '@/features/dashboard/admin/services/adminService';
import { usePersistedState } from '@/shared/hooks/usePersistedState';
import { LockUserDialog } from '../components/LockUserDialog';
import { UnlockUserDialog } from '../components/UnlockUserDialog';
import { ResetPasswordDialog } from '../components/ResetPasswordDialog';
import { ToggleLockButton } from '../components/ToggleLockButton';
import { ChangeRoleDialog } from '../components/ChangeRoleDialog';
import type { User } from '@/shared/types/user';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters';
import { ChangeEmploymentStatusDialog } from '../components/ChangeEmploymentStatusDialog';
import { HRRoleBadge } from '@/features/dashboard/hr/components/HRRoleBadge';

export function AdminUserDetailsPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog states
  const [openLock, setOpenLock] = useState(false);
  const [openUnlock, setOpenUnlock] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  const [autoRefreshEnabled] = usePersistedState(
    'admin-dashboard-auto-refresh',
    true // default value
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUserData = useCallback(async () => {
    const user = await getUserById(Number(userId));

    return user;
  }, [userId]);

  const {
    data: user,
    loading,
    error,
    refresh,
    lastUpdated,
  } = useSmartPolling(fetchUserData, {
    context: 'users',
    enabled: false,
    pauseWhenHidden: true,
    pauseWhenInactive: true,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAccountStatus = (user: User) => {
    if (user.locked_until) {
      const lockExpiry = new Date(user.locked_until);
      if (lockExpiry > new Date()) {
        return { status: 'LOCKED', variant: 'destructive' as const };
      }
    }
    if (user.employment_status !== 'Active') {
      return {
        status: user.employment_status.toUpperCase(),
        variant: 'secondary' as const,
      };
    }
    if (user.password_expired) {
      return { status: 'PASSWORD EXPIRED', variant: 'destructive' as const };
    }
    if (user.temp_password) {
      return { status: 'TEMP PASSWORD', variant: 'secondary' as const };
    }
    if (user.failed_attempts >= 3) {
      return { status: 'AT RISK', variant: 'destructive' as const };
    }
    return { status: 'ACTIVE', variant: 'default' as const };
  };

  const getRoleBadge = (role: User['role']) => {
    const config = {
      Admin: {
        icon: Shield,
        className: 'border-red-200 bg-red-50 text-red-800 font-semibold',
      },
      HR: {
        icon: UserIcon,
        className: 'border-green-200 bg-green-50 text-green-800 font-semibold',
      },
      Employee: {
        icon: UserIcon,
        className: 'border-blue-200 bg-blue-50 text-blue-800 font-semibold',
      },
    };
    const { className, icon: Icon } = config[role];
    return (
      <Badge variant='outline' className={className}>
        <Icon className='mr-1 h-3 w-3' />
        {role}
      </Badge>
    );
  };

  if (loading) {
    return <LoadingSpinner text='Loading user data...' />;
  }

  if (error || !user) {
    return (
      <div className='container px-4 py-8'>
        <div className='flex min-h-[400px] items-center justify-center'>
          <Card className='mx-auto max-w-md'>
            <CardContent className='py-12 text-center'>
              <AlertCircle className='text-destructive mx-auto mb-4 h-12 w-12' />
              <p className='text-destructive mb-2 text-sm font-medium'>
                Failed to load user details
              </p>
              <Button
                onClick={() => refresh()}
                variant='outline'
                className='mt-4'
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const accountStatus = getAccountStatus(user);
  const isLocked =
    user.locked_until && new Date(user.locked_until) > new Date();

  return (
    <div className='container px-4'>
      {/* Header */}
      <div className='mb-8'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => navigate('/admin/users')}
          className='mb-4'
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to Users
        </Button>

        <div className='flex flex-col gap-4'>
          {/* Title and Controls Row */}
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>{user.name}</h1>
              <div className='mt-2 flex items-center gap-2'>
                <p className='text-muted-foreground'>
                  {user.position || 'No position assigned'} •{' '}
                  {user.department || 'No department'}
                </p>
              </div>
            </div>

            {/* Refresh Controls */}
            <div className='flex flex-wrap items-center gap-3'>
              {/* Last Updated */}
              {lastUpdated && (
                <div className='text-muted-foreground text-right text-sm'>
                  <p className='font-medium'>Last updated</p>
                  <p className='text-xs'>
                    {lastUpdated.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
              {/* Manual Refresh Button */}
              <Button
                variant='outline'
                size='sm'
                onClick={handleRefresh}
                disabled={isRefreshing}
                className='gap-2'
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>

          {/* Status Badges Row */}
          <div className='flex flex-wrap gap-2'>
            {getRoleBadge(user.role)}
            <Badge variant={accountStatus.variant}>
              {accountStatus.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Security Alerts */}
      {(isLocked ||
        user.password_expired ||
        user.temp_password ||
        user.failed_attempts >= 3) && (
        <Alert variant='destructive' className='mb-6'>
          <ShieldAlert className='h-4 w-4' />
          <AlertDescription>
            <p className='mb-2 font-semibold'>Security Attention Required</p>
            <ul className='list-inside list-disc space-y-1 text-sm'>
              {isLocked && (
                <li>
                  Account is locked until {formatDateTime(user.locked_until!)}
                </li>
              )}
              {user.password_expired && <li>Password has expired</li>}
              {user.temp_password && <li>Using temporary password</li>}
              {user.failed_attempts >= 3 && (
                <li>{user.failed_attempts} failed login attempts detected</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading Overlay for Background Refresh */}
      {loading && user && (
        <div className='bg-background/80 fixed inset-0 z-50 flex items-start justify-center pt-20 backdrop-blur-sm'>
          <div className='bg-card flex items-center gap-2 rounded-lg border p-4 shadow-lg'>
            <RefreshCw className='h-4 w-4 animate-spin' />
            <span className='text-sm font-medium'>Updating data...</span>
          </div>
        </div>
      )}

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Main Content - 2 columns */}
        <div className='space-y-6 lg:col-span-2'>
          {/* Employment Information */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <Briefcase className='text-primary h-5 w-5' />
                </div>
                Employment Information
              </CardTitle>
              <CardDescription>
                Job details and organizational structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-6 md:grid-cols-2'>
                <div className='space-y-4'>
                  <div>
                    <div className='mb-2 flex items-center gap-2'>
                      <Hash className='text-muted-foreground h-4 w-4' />
                      <span className='text-muted-foreground text-sm font-medium'>
                        Employee ID
                      </span>
                    </div>
                    <p className='font-mono font-semibold'>
                      {user.employee_id}
                    </p>
                  </div>

                  <div>
                    <div className='mb-2 flex items-center gap-2'>
                      <Building className='text-muted-foreground h-4 w-4' />
                      <span className='text-muted-foreground text-sm font-medium'>
                        Department
                      </span>
                    </div>
                    <p className='font-medium'>
                      {user.department || 'Unassigned'}
                    </p>
                  </div>

                  <div>
                    <div className='mb-2 flex items-center gap-2'>
                      <Briefcase className='text-muted-foreground h-4 w-4' />
                      <span className='text-muted-foreground text-sm font-medium'>
                        Position
                      </span>
                    </div>
                    <p className='font-medium'>
                      {user.position || 'Unassigned'}
                    </p>
                  </div>
                </div>

                <div className='space-y-4'>
                  <div>
                    <div className='mb-2 flex items-center gap-2'>
                      <DollarSign className='text-muted-foreground h-4 w-4' />
                      <span className='text-muted-foreground text-sm font-medium'>
                        Monthly Salary
                      </span>
                    </div>
                    <p className='text-xl font-bold'>
                      {formatCurrency(Number(user.salary))}
                    </p>
                  </div>

                  <div>
                    <div className='mb-2 flex items-center gap-2'>
                      <Calendar className='text-muted-foreground h-4 w-4' />
                      <span className='text-muted-foreground text-sm font-medium'>
                        Date Hired
                      </span>
                    </div>
                    <p className='font-medium'>{formatDate(user.date_hired)}</p>
                  </div>

                  <div>
                    <div className='mb-2 flex items-center gap-2'>
                      <AlertCircle className='text-muted-foreground h-4 w-4' />
                      <span className='text-muted-foreground text-sm font-medium'>
                        Employment Status
                      </span>
                    </div>
                    <Badge
                      variant={
                        user.employment_status === 'Active'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {user.employment_status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <UserCog className='text-primary h-5 w-5' />
                </div>
                Account Information
              </CardTitle>
              <CardDescription>
                Login credentials and contact details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-6 md:grid-cols-2'>
                <div className='space-y-4'>
                  <div>
                    <div className='mb-2 flex items-center gap-2'>
                      <Mail className='text-muted-foreground h-4 w-4' />
                      <span className='text-muted-foreground text-sm font-medium'>
                        Email Address
                      </span>
                    </div>
                    <p className='font-mono text-sm'>{user.email}</p>
                  </div>

                  <div>
                    <div className='mb-2 flex items-center gap-2'>
                      <Hash className='text-muted-foreground h-4 w-4' />
                      <span className='text-muted-foreground text-sm font-medium'>
                        User ID
                      </span>
                    </div>
                    <p className='text-muted-foreground font-mono text-sm'>
                      {user.id}
                    </p>
                  </div>
                </div>

                <div className='space-y-4'>
                  <div>
                    <div className='mb-2 flex items-center gap-2'>
                      <Calendar className='text-muted-foreground h-4 w-4' />
                      <span className='text-muted-foreground text-sm font-medium'>
                        Account Created
                      </span>
                    </div>
                    <p className='text-sm'>{formatDate(user.created_at)}</p>
                  </div>

                  <div>
                    <div className='mb-2 flex items-center gap-2'>
                      <Shield className='text-muted-foreground h-4 w-4' />
                      <span className='text-muted-foreground text-sm font-medium'>
                        Role
                      </span>
                    </div>
                    {getRoleBadge(user.role)}
                  </div>

                  {user.hr_role && (
                    <div>
                      <div className='mb-2 flex items-center gap-2'>
                        <Users className='text-muted-foreground h-4 w-4' />
                        <span className='text-muted-foreground text-sm font-medium'>
                          HR Role
                        </span>
                      </div>
                      {<HRRoleBadge hrRole={user.hr_role} size='sm' />}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Status */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <Shield className='text-primary h-5 w-5' />
                </div>
                Security Status
              </CardTitle>
              <CardDescription>
                Authentication and security metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-center justify-between rounded-lg border p-3'>
                  <div className='flex items-center gap-3'>
                    <div
                      className={`rounded-full p-2 ${user.is_twofa_enabled ? 'bg-green-100' : 'bg-gray-100'}`}
                    >
                      <Shield
                        className={`h-4 w-4 ${user.is_twofa_enabled ? 'text-green-600' : 'text-gray-600'}`}
                      />
                    </div>
                    <div>
                      <p className='font-medium'>Two-Factor Authentication</p>
                      <p className='text-muted-foreground text-xs'>
                        Additional security layer for login
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={user.is_twofa_enabled ? 'default' : 'secondary'}
                  >
                    {user.is_twofa_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>

                <Separator />

                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='bg-muted/50 flex items-start gap-3 rounded-lg p-3'>
                    <Clock className='text-muted-foreground mt-0.5 h-5 w-5' />
                    <div>
                      <p className='text-sm font-medium'>
                        Last Password Change
                      </p>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        {user.password_last_changed
                          ? formatDate(user.password_last_changed)
                          : 'Never changed'}
                      </p>
                    </div>
                  </div>

                  <div className='bg-muted/50 flex items-start gap-3 rounded-lg p-3'>
                    <AlertCircle
                      className={`mt-0.5 h-5 w-5 ${user.failed_attempts >= 3 ? 'text-destructive' : 'text-muted-foreground'}`}
                    />
                    <div>
                      <p className='text-sm font-medium'>
                        Failed Login Attempts
                      </p>
                      <p
                        className={`mt-1 text-xs ${user.failed_attempts >= 3 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}
                      >
                        {user.failed_attempts === 0
                          ? 'No failed attempts'
                          : `${user.failed_attempts} attempt${user.failed_attempts > 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                </div>

                {user.temp_password && (
                  <Alert>
                    <Key className='h-4 w-4' />
                    <AlertDescription>
                      User is currently using a temporary password and must
                      change it on next login
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Actions */}
        <div className='lg:col-span-1'>
          <Card className='sticky top-6'>
            <CardHeader>
              <CardTitle className='text-lg'>Quick Actions</CardTitle>
              <CardDescription>
                Manage user account and security
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-2'>
              {/* Primary Actions */}
              <div className='space-y-2'>
                <ToggleLockButton
                  user={user}
                  actionLoading={actionLoading}
                  onLockClick={() => setOpenLock(true)}
                  onUnlockClick={() => setOpenUnlock(true)}
                  variant='outline'
                  className='hover:bg-accent hover:text-accent-foreground w-full justify-start transition-colors'
                />
                <Button
                  variant='outline'
                  className='hover:bg-accent hover:text-accent-foreground w-full justify-start transition-colors'
                  onClick={() => setShowResetDialog(true)}
                  disabled={actionLoading}
                >
                  <Key className='mr-2 h-4 w-4' />
                  Reset Password
                </Button>
                <Button
                  variant='outline'
                  className='hover:bg-accent hover:text-accent-foreground w-full justify-start transition-colors'
                  onClick={() => setShowRoleDialog(true)}
                  disabled={actionLoading}
                >
                  <UserCog className='mr-2 h-4 w-4' />
                  Change Role
                </Button>

                <Button
                  variant='outline'
                  className='hover:bg-accent hover:text-accent-foreground w-full justify-start transition-colors'
                  onClick={() => setShowStatusDialog(true)}
                  disabled={actionLoading}
                >
                  <UserCog className='mr-2 h-4 w-4' />
                  Change Employment Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <LockUserDialog
        open={openLock}
        onOpenChange={setOpenLock}
        setActionLoading={setActionLoading}
        userId={user.id.toString()}
        userName={user.name}
        refresh={refresh}
      />

      <UnlockUserDialog
        open={openUnlock}
        onOpenChange={setOpenUnlock}
        setActionLoading={setActionLoading}
        userId={user.id.toString()}
        userName={user.name}
        refresh={refresh}
      />

      <ResetPasswordDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        setActionLoading={setActionLoading}
        userId={user.id}
        userName={user.name}
        employeeId={user.employee_id}
        refresh={refresh}
      />

      <ChangeRoleDialog
        open={showRoleDialog}
        onOpenChange={setShowRoleDialog}
        setActionLoading={setActionLoading}
        userId={user.id}
        userName={user.name}
        employeeId={user.employee_id}
        currentRole={user.role}
        refresh={refresh}
      />

      <ChangeEmploymentStatusDialog
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        setActionLoading={setActionLoading}
        userId={user.id}
        userName={user.name}
        employeeId={user.employee_id}
        currentStatus={user.employment_status}
        refresh={refresh}
      />
    </div>
  );
}
