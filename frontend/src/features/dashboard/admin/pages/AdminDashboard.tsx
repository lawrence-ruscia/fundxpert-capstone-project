import { useNavigate } from 'react-router-dom';

import { BalanceCard } from '../../employee/components/BalanceCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { AuditLog } from '@/shared/types/user';
import { Loader2, Users, ShieldCheck, FileText, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getAdminStats, getRecentAuditLogs } from '../services/adminService';
import type { AdminStats } from '../types/admin';
export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [statsRes, logsRes] = await Promise.all([
          getAdminStats(),
          getRecentAuditLogs(10),
        ]);
        setStats(statsRes);
        setLogs(logsRes);
      } catch (err) {
        console.error('❌ Failed to load admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading)
    return (
      <div className='flex h-64 items-center justify-center'>
        <Loader2 className='mr-2 h-6 w-6 animate-spin text-gray-500' />
        <span>Loading dashboard...</span>
      </div>
    );

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>
            System Administration Dashboard
          </h1>
          <p className='text-sm text-gray-500'>
            Overview of system users, activities, and account health.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <BalanceCard
          icon={Users}
          label='Total Users'
          value={String(stats?.totalUsers)}
        />
        <BalanceCard
          icon={ShieldCheck}
          label='HR Staff'
          value={String(stats?.hrCount)}
        />
        <BalanceCard
          icon={Lock}
          label='Locked Accounts'
          value={String(stats?.lockedAccounts)}
        />
        <BalanceCard
          icon={FileText}
          label='Recent Logins (24h)'
          value={String(stats?.recentLogins)}
        />
      </div>

      {/* Alerts Section */}
      {stats && (stats.lockedAccounts > 0 || stats.expiredPasswords > 0) && (
        <Card className='border-red-200 bg-red-50'>
          <CardHeader>
            <CardTitle className='text-base text-red-600'>
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-1 text-sm text-red-700'>
            {stats.lockedAccounts > 0 && (
              <p>🔒 {stats.lockedAccounts} account(s) are currently locked.</p>
            )}
            {stats.expiredPasswords > 0 && (
              <p>⚠️ {stats.expiredPasswords} user(s) have expired passwords.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className='text-sm text-gray-500'>No recent activity found.</p>
          ) : (
            <div className='overflow-x-auto'>
              <table className='min-w-full text-sm'>
                <thead>
                  <tr className='border-b text-left'>
                    <th className='px-2 py-2 font-medium text-gray-600'>
                      User
                    </th>
                    <th className='px-2 py-2 font-medium text-gray-600'>
                      Action
                    </th>
                    <th className='px-2 py-2 font-medium text-gray-600'>
                      Entity
                    </th>
                    <th className='px-2 py-2 font-medium text-gray-600'>
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className='border-b hover:bg-gray-50'>
                      <td className='px-2 py-2'>{log.email}</td>
                      <td className='px-2 py-2'>{log.action}</td>
                      <td className='px-2 py-2'>{log.entity_type}</td>
                      <td className='px-2 py-2 text-gray-500'>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className='mt-3 text-right'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => navigate('/admin/logs')}
            >
              View All Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-wrap gap-3'>
          <Button onClick={() => navigate('/admin/users/new')}>
            + Create User
          </Button>
          <Button variant='outline' onClick={() => navigate('/admin/users')}>
            Manage Users
          </Button>
          <Button variant='outline' onClick={() => navigate('/admin/logs')}>
            View Logs
          </Button>
          <Button variant='outline' onClick={() => navigate('/admin/locked')}>
            Locked Accounts
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
