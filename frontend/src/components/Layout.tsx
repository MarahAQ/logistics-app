import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

// ============================================
// LAYOUT COMPONENT
// Wraps all authenticated pages with sidebar
// ============================================
interface LayoutProps {
  userName?: string;
  userRole?: 'manager' | 'operator' | 'accountant';
}

const Layout: React.FC<LayoutProps> = ({ 
  userName = 'أحمد', 
  userRole = 'operator' 
}) => {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Sidebar */}
      <Sidebar userName={userName} userRole={userRole} />
      
      {/* Main Content - Offset for sidebar on RIGHT */}
      <main className="lg:mr-64 min-h-screen">
        {/* Page content renders here via Outlet */}
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
