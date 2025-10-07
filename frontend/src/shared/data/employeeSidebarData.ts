import {
  ChartLine,
  LayoutDashboard,
  PiggyBank,
  Wallet,
  BanknoteArrowDown,
} from 'lucide-react';
import { type SidebarData } from '@/shared/types/navTypes';

export const employeeSidebarData: SidebarData = {
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
          url: '/employee',
          icon: LayoutDashboard,
        },
        {
          title: 'Contributions History',
          url: '/employee/contributions',
          icon: PiggyBank,
        },
        {
          title: 'Fund Projection',
          url: '/employee/projection',
          icon: ChartLine,
        },
        {
          title: 'Loans',
          url: '/employee/loans',
          icon: Wallet,
        },
        {
          title: 'Withdrawals',
          url: '/employee/withdrawals',
          icon: BanknoteArrowDown,
        },
      ],
    },
  ],
};
