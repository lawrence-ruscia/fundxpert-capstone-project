import {
  LayoutDashboard,
  PiggyBank,
  ChartLine,
  Wallet,
  BanknoteArrowDown,
  Users,
  BarChart3,
} from 'lucide-react';
import type { SidebarData } from '../types/navTypes';

export const hrSidebarData: SidebarData = {
  user: {
    name: 'John Doe',
    email: 'johndoe@metrobank.ph',
    avatar: '/avatars/shadcn.jpg',
  },

  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/hr',
          icon: LayoutDashboard,
        },
        {
          title: 'Employees',
          url: '/hr/employees',
          icon: Users,
        },
        {
          title: 'Contributions',
          url: '/hr/contributions',
          icon: PiggyBank,
        },

        {
          title: 'Loans',
          url: '/dashboard/loans',
          icon: Wallet,
        },
        {
          title: 'Withdrawals',
          url: '/dashboard/withdrawals',
          icon: BanknoteArrowDown,
        },
        {
          title: 'Reports',
          url: '/dashboard/withdrawals',
          icon: BarChart3,
        },
      ],
    },
  ],
};
