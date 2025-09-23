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
  const { user, loading } = useAuth();

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
        {user && !loading && <NavUser user={user} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
