import { Outlet } from 'react-router-dom';
import NavigationSetter from '../components/NavigationSetter';

export default function RootLayout() {
  return (
    <>
      <NavigationSetter />
      <Outlet />
    </>
  );
}
