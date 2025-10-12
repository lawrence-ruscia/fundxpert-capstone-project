import { RouterProvider } from 'react-router-dom';
import { router } from './router/routes';
import { ThemeProvider } from './shared/context/useTheme';
import { AuthProvider } from './features/auth/context/AuthContext';
import { Toaster } from 'sonner';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster position='top-right' />
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
