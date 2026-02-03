import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

// ============================================
// LAYOUT COMPONENT
// Sidebar gets user info from AuthContext directly
// ============================================
const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Sidebar />
      <main className="lg:mr-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;