import { RouterProvider } from 'react-router-dom';
import { router } from './router/routes';
import { ThemeProvider } from './shared/context/useTheme';
import { AuthProvider } from './features/auth/context/AuthContext';
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />;
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
