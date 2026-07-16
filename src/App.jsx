import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SeafoodMaster from './pages/SeafoodMaster';
import DailyRates from './pages/DailyRates';
import PurchaseBilling from './pages/PurchaseBilling';
import ExportBilling from './pages/ExportBilling';
import Customers from './pages/Customers';
import ExportCompanies from './pages/ExportCompanies';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/rates" element={
        <ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Billing Staff']}>
          <Layout><DailyRates /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/purchase-billing" element={
        <ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Billing Staff']}>
          <Layout><PurchaseBilling /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/export-billing" element={
        <ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Billing Staff']}>
          <Layout><ExportBilling /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/seafood" element={
        <ProtectedRoute allowedRoles={['Super Admin', 'Admin']}>
          <Layout><SeafoodMaster /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/customers" element={
        <ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Billing Staff']}>
          <Layout><Customers /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/companies" element={
        <ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Export Company']}>
          <Layout><ExportCompanies /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/expenses" element={
        <ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Billing Staff']}>
          <Layout><Expenses /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/reports" element={
        <ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Export Company']}>
          <Layout><Reports /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={['Super Admin', 'Admin']}>
          <Layout><Settings /></Layout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
