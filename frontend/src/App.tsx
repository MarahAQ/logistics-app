import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Auth - Note: App.tsx is in src/, context is in src/context/
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layout
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EnhancedShipmentForm from './pages/EnhancedShipmentForm';
import EditShipmentForm from './pages/EditShipmentForm';
import ExportPage from './pages/ExportPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

// ============================================
// APP COMPONENT
// ============================================
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route - Login */}
          <Route path="/" element={<Login />} />

          {/* Protected Routes - With Layout (Sidebar) */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* All authenticated users can access */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Manager and Operator can create/edit shipments */}
            <Route 
              path="/shipments/daily" 
              element={
                <ProtectedRoute allowedRoles={['manager', 'operator']}>
                  <EnhancedShipmentForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/shipments/edit/:id" 
              element={
                <ProtectedRoute allowedRoles={['manager', 'operator']}>
                  <EditShipmentForm />
                </ProtectedRoute>
              } 
            />

            {/* Export - Manager and Accountant */}
            <Route 
              path="/export" 
              element={
                <ProtectedRoute allowedRoles={['manager', 'accountant']}>
                  <ExportPage />
                </ProtectedRoute>
              } 
            />

            {/* Reports - All users (coming soon) */}
            <Route path="/reports" element={<ReportsPage />} />

            {/* Settings - Manager only */}
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <SettingsPage />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Catch all - Redirect to login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;