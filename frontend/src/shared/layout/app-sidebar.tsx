import Logo from '@/components/ui/logo';
import { NavUser } from '../components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { sidebarData } from '../data/sidebarData';
import { NavGroup } from '../components/nav-group';
import { AppTitle } from '../components/app-title';
import { useLayout } from '../context/layout-provider';
import { useAuth } from '@/features/auth/context/AuthContext';

export function AppSidebar() {
  const { collapsible, variant } = useLayout();
  const { user } = useAuth();

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <AppTitle />
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map(props => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={user ?? { id: 99, name: 'John Doe', role: 'Employee' }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
