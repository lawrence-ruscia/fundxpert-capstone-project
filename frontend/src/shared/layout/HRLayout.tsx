import { Outlet } from 'react-router-dom';
import { LayoutProvider } from '../context/layout-provider';
import { AppSidebar } from './app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { getCookie } from '@/lib/cookies';
import { Header } from './Header';
import { ThemeSwitch } from '../components/theme-switch';
import { ProfileDropdown } from '../components/profile-dropdown';
import { Main } from './Main';
import { hrSidebarData } from '../data/hrSidebarData';
import NavigationSetter from '../components/NavigationSetter';
export default function HRLayout() {
  const defaultOpen = getCookie('sidebar_state') !== 'false';
  return (
    <LayoutProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar sidebarData={hrSidebarData} />
        <SidebarInset
          className={cn(
            // Set content container, so we can use container queries
            '@container/content',

            // If layout is fixed, set the height
            // to 100svh to prevent overflow
            'has-[[data-layout=fixed]]:h-svh',

            // If layout is fixed and sidebar is inset,
            // set the height to 100svh - spacing (total margins) to prevent overflow
            'peer-data-[variant=inset]:has-[[data-layout=fixed]]:h-[calc(100svh-(var(--spacing)*4))]'
          )}
        >
          {/* ===== Top Heading ===== */}
          <Header>
            <div className='ms-auto flex items-center space-x-4'>
              <ThemeSwitch />
              <ProfileDropdown />
            </div>
          </Header>
          {/* ===== Main ===== */}
          <Main>
            <NavigationSetter />
            <Outlet />
          </Main>
        </SidebarInset>
      </SidebarProvider>
    </LayoutProvider>
  );
}
