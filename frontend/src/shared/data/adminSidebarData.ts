import { LayoutDashboard, UserCog, FileText } from 'lucide-react';
import type { SidebarData } from '../types/navTypes';

export const adminSidebarData: SidebarData = {
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
          url: '/admin',
          icon: LayoutDashboard,
        },
        {
          title: 'User Management',
          url: '/admin/users',
          icon: UserCog,
        },
        {
          title: 'System Logs',
          url: '/admin/logs',
          icon: FileText,
        },
      ],
    },
  ],
};
