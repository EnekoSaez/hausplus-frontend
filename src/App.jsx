import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { I18nProvider } from './context/I18nContext';

import Navbar from './components/Navbar';
import LandingPage from './pages/client/LandingPage';
import PropertyDetail from './pages/client/PropertyDetail';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import MyMessages from './pages/client/MyMessages';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"      element={<LandingPage />} />
        <Route path="/propiedad/:id" element={<PropertyDetail />} />
        <Route path="/login"
          element={user
            ? <Navigate to={user.role === 'employee' ? '/empleado' : user.role === 'owner' ? '/propietario' : '/'} replace />
            : <LoginPage />}
        />
        <Route path="/registro"
          element={user ? <Navigate to="/" replace /> : <RegisterPage />}
        />
        <Route path="/empleado/*"
          element={<ProtectedRoute allowedRoles={['employee']}><EmployeeDashboard /></ProtectedRoute>}
        />
        <Route path="/propietario/*"
          element={<ProtectedRoute allowedRoles={['owner']}><OwnerDashboard /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/mis-mensajes"
          element={user ? <MyMessages /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
}
