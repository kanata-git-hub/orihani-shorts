import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import { Login } from './pages/Login';
import { Admin } from './pages/Admin';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute, AdminRoute } from './components/AuthRoutes';
import { SplashScreen } from './components/SplashScreen';
import { PWAInstaller } from './components/PWAInstaller';

export default function App() {
  return (
    <AuthProvider>
      <SplashScreen />
      <PWAInstaller />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
          </Route>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
