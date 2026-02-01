import React from 'react';

// ============================================
// REPORTS PAGE - COMING SOON
// ============================================
const ReportsPage: React.FC = () => {
  return (
    <div className="p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">التقارير</h1>
        <p className="text-gray-500 mt-1">تقارير وإحصائيات الشحنات</p>
      </div>

      {/* Coming Soon Card */}
      <div className="max-w-lg mx-auto mt-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>

          {/* Text */}
          <h2 className="text-xl font-bold text-gray-800 mb-2">قريباً!</h2>
          <p className="text-gray-500 mb-6">
            نعمل على تطوير نظام التقارير والإحصائيات.
            <br />
            سيتضمن تقارير يومية وشهرية وسنوية.
          </p>

          {/* Features Preview */}
          <div className="bg-gray-50 rounded-xl p-4 text-right">
            <h3 className="text-sm font-medium text-gray-700 mb-3">الميزات القادمة:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-sky-500 rounded-full"></span>
                تقارير الشحنات اليومية والشهرية
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-sky-500 rounded-full"></span>
                إحصائيات حسب العميل
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-sky-500 rounded-full"></span>
                رسوم بيانية تفاعلية
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-sky-500 rounded-full"></span>
                تقارير الأداء
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
