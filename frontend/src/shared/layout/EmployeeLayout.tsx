import { Outlet } from 'react-router-dom';
import { LayoutProvider } from '../context/layout-provider';
import { AppSidebar } from './app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { getCookie } from '@/lib/cookies';
export default function EmployeeLayout() {
  const defaultOpen = getCookie('sidebar_state') !== 'false';
  return (
    <LayoutProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
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
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </LayoutProvider>
  );
}
