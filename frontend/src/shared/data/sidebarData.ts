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
          url: '/withdrawals',
          icon: BanknoteArrowDown,
        },
        {
          title: 'Reports / Statements',
          url: '/reports',
          icon: FileText,
        },
        {
          title: 'Knowledge Base  ',
          url: '/reports',
          icon: BookOpen,
        },
      ],
    },

    {
      title: 'Others',
      items: [
        {
          title: 'Settings',
          icon: Settings,
          items: [
            {
              title: 'Profile',
              url: '/settings',
              icon: UserCog,
            },
            {
              title: 'Account',
              url: '/settings/account',
              icon: Wrench,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: Palette,
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
              icon: Bell,
            },
            {
              title: 'Display',
              url: '/settings/display',
              icon: Monitor,
            },
          ],
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
};
