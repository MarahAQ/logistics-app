import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

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
  // TODO: Get user data from auth context/state
  // For now, using demo data
  const userName = 'أحمد';
  const userRole: 'manager' | 'operator' | 'accountant' = 'operator';

  return (
    <Router>
      <Routes>
        {/* Public Route - Login */}
        <Route path="/" element={<Login />} />

        {/* Protected Routes - With Layout (Sidebar) */}
        <Route element={<Layout userName={userName} userRole={userRole} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/shipments/daily" element={<EnhancedShipmentForm />} />
          <Route path="/shipments/edit/:id" element={<EditShipmentForm />} />
          <Route path="/export" element={<ExportPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Catch all - Redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
