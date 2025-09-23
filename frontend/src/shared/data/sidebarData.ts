import {
  ChartLine,
  LayoutDashboard,
  Monitor,
  PiggyBank,
  HelpCircle,
  Bell,
  Palette,
  Settings,
  Wrench,
  UserCog,
  CircleQuestionMark,
  Wallet,
  Shield,
  ArrowDownCircle,
  BanknoteArrowDown,
  FileText,
  BookOpen,
} from 'lucide-react';
import { type SidebarData } from '@/shared/types/navTypes';

export const sidebarData: SidebarData = {
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
          url: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          title: 'Contributions History',
          url: '/dashboard/contributions',
          icon: PiggyBank,
        },
        {
          title: 'Fund Projection',
          url: '/dashboard/projection',
          icon: ChartLine,
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
      ],
    },
  ],
};
