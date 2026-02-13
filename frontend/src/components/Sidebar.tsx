import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ============================================
// NAVIGATION ITEMS (with role restrictions)
// ============================================
const NAV_ITEMS = [
  {
    path: '/dashboard',
    label: 'لوحة التحكم',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    roles: ['manager', 'operator', 'accountant'],
  },
  {
    path: '/shipments/daily',
    label: 'نموذج يومي جديد',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    roles: ['manager', 'operator'],
  },
  {
    path: '/export',
    label: 'تصدير البيانات',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    roles: ['manager', 'operator', 'accountant'],
  },
  {
    path: '/reports',
    label: 'التقارير',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    roles: ['manager', 'operator', 'accountant'],
    comingSoon: true,
  },
  {
    path: '/settings',
    label: 'الإعدادات',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    roles: ['manager'],
    comingSoon: true,
  },
];

// Role labels and colors
const ROLE_LABELS: Record<string, string> = {
  manager: 'مدير',
  operator: 'مشغل',
  accountant: 'محاسب',
};

const ROLE_COLORS: Record<string, string> = {
  manager: 'bg-purple-100 text-purple-700',
  operator: 'bg-green-100 text-green-700',
  accountant: 'bg-blue-100 text-blue-700',
};

// ============================================
// SIDEBAR COMPONENT
// ============================================
const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Get user info from context
  const userName = user?.name || 'مستخدم';
  const userRole = user?.role || 'operator';

  // ============================================
  // LOGOUT HANDLER - Forces full page reload
  // ============================================
  const handleLogout = () => {
    // First clear the auth state
    logout();
    
    // Clear any additional storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    
    // Force a complete page reload to login
    // This ensures ALL React state is cleared
    window.location.replace('/');
  };

  const closeMobile = () => setIsMobileOpen(false);

  // Filter nav items based on user role
  const visibleNavItems = NAV_ITEMS.filter(item => 
    item.roles.includes(userRole)
  );

  // ============================================
  // LOGO COMPONENT (with fallback)
  // ============================================
  const LogoSection = () => (
    <div className="p-5 border-b border-gray-100">
      <div className="flex items-center gap-3">
        {!logoError ? (
          <img 
            src="/jericho-logo.png" 
            alt="Jericho Transport" 
            className="h-10 object-contain"
            onError={() => setLogoError(true)}
          />
        ) : (
          <>
            <div className="w-11 h-11 bg-black rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg tracking-tight">jt</span>
            </div>
            <div className="text-right">
              <h1 className="font-bold text-gray-800 text-sm leading-tight">Jericho Transport</h1>
              <p className="text-xs text-gray-400 mt-0.5">شركة أريحا للنقل</p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ============================================
  // SIDEBAR CONTENT
  // ============================================
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Logo Section */}
      <LogoSection />

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.comingSoon ? '#' : item.path}
            onClick={(e) => {
              if (item.comingSoon) {
                e.preventDefault();
                alert('هذه الميزة قيد التطوير وستكون متاحة قريباً');
              }
              closeMobile();
            }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                item.comingSoon 
                  ? 'opacity-50 cursor-not-allowed text-gray-400'
                  : isActive
                  ? 'bg-sky-50 text-sky-600 font-medium shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.comingSoon && (
              <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                قريباً
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-100">
        {/* User Info Card */}
        <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-xl">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
            {userName.charAt(0)}
          </div>
          <div className="flex-1 text-right min-w-0">
            <p className="font-medium text-gray-800 text-sm truncate">{userName}</p>
            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full mt-0.5 ${ROLE_COLORS[userRole] || ROLE_COLORS.operator}`}>
              {ROLE_LABELS[userRole] || userRole}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2.5 bg-white rounded-xl shadow-lg border border-gray-100"
        aria-label="فتح القائمة"
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={closeMobile}
        />
      )}

      {/* Mobile Sidebar - Slides from RIGHT for RTL */}
      <aside
        className={`lg:hidden fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={closeMobile}
          className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="إغلاق القائمة"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar - Fixed on RIGHT for RTL */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:right-0 lg:top-0 lg:h-screen lg:w-64 lg:bg-white lg:border-l lg:border-gray-100 lg:shadow-sm">
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;