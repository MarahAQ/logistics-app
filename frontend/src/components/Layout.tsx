import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext.tsx';
// ============================================
// LAYOUT COMPONENT
// Wraps all authenticated pages with sidebar
// ============================================
const Layout: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Sidebar - Gets user from AuthContext */}
      <Sidebar 
        userName={user?.name || 'مستخدم'} 
        userRole={user?.role || 'operator'} 
      />
      
      {/* Main Content - Offset for sidebar on RIGHT */}
      <main className="lg:mr-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;