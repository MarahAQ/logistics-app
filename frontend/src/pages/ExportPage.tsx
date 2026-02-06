import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5001';

// ============================================
// EXPORT PAGE - With Preview Table
// Filters use: process_type, movement_date
// ============================================
const ExportPage: React.FC = () => {
  const { token } = useAuth();

  // Filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [movementType, setMovementType] = useState('all');
  const [clientName, setClientName] = useState('');

  // Data state
  const [shipments, setShipments] = useState<any[]>([]);
  const [filteredShipments, setFilteredShipments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ============================================
  // FETCH ALL SHIPMENTS
  // ============================================
  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch(`${API_BASE}/api/shipments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('فشل في جلب البيانات');

      const data = await response.json();
      setShipments(data);
      setFilteredShipments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // FILTER SHIPMENTS (Frontend preview)
  // Uses: process_type, movement_date
  // ============================================
  useEffect(() => {
    let filtered = [...shipments];

    // Date filter - use movement_date
    if (startDate) {
      filtered = filtered.filter(s => {
        if (!s.movement_date) return false;
        return s.movement_date >= startDate;
      });
    }

    if (endDate) {
      filtered = filtered.filter(s => {
        if (!s.movement_date) return false;
        return s.movement_date <= endDate;
      });
    }

    // Movement type filter - use process_type (English values)
    if (movementType !== 'all') {
      filtered = filtered.filter(s => s.process_type === movementType);
    }

    // Client name filter
    if (clientName) {
      filtered = filtered.filter(s => 
        s.client_name?.toLowerCase().includes(clientName.toLowerCase())
      );
    }

    setFilteredShipments(filtered);
  }, [shipments, startDate, endDate, movementType, clientName]);

  // ============================================
  // EXPORT TO XLSX
  // ============================================
  const handleExport = async () => {
    if (filteredShipments.length === 0) {
      setError('لا توجد شحنات للتصدير');
      return;
    }

    setIsExporting(true);
    setError('');
    setSuccess('');

    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (movementType !== 'all') params.append('movementType', movementType);
      if (clientName) params.append('clientName', clientName);

      const response = await fetch(`${API_BASE}/api/export/xlsx?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('فشل في تصدير البيانات');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const today = new Date().toISOString().split('T')[0];
      link.download = `شحنات_أريحا_${today}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess('تم تصدير الملف بنجاح!');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // ============================================
  // RESET FILTERS
  // ============================================
  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setMovementType('all');
    setClientName('');
    setError('');
    setSuccess('');
  };

  // ============================================
  // FORMAT DATE FOR DISPLAY
  // ============================================
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('ar-EG');
    } catch {
      return dateStr;
    }
  };

  // ============================================
  // TRANSLATE PROCESS TYPE
  // ============================================
  const translateProcessType = (type: string) => {
    const translations: Record<string, string> = {
      'import': 'استيراد',
      'export': 'تصدير',
    };
    return translations[type] || type || '-';
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">تصدير البيانات</h1>
        <p className="text-gray-500 mt-1">تصدير الشحنات إلى ملف Excel</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600">
          {success}
        </div>
      )}

      {/* Filters Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">تصفية البيانات</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          {/* Movement Type - sends English values */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع العملية</label>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="all">الكل</option>
              <option value="import">استيراد</option>
              <option value="export">تصدير</option>
            </select>
          </div>

          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">اسم العميل</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="البحث باسم العميل..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
        </div>

        {/* Reset Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            إعادة تعيين الفلاتر
          </button>
        </div>
      </div>

      {/* Stats & Export Button */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Stats */}
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-400">{shipments.length}</p>
              <p className="text-sm text-gray-500">إجمالي الشحنات</p>
            </div>
            <div className="h-12 w-px bg-gray-200"></div>
            <div className="text-center">
              <p className="text-3xl font-bold text-sky-600">{filteredShipments.length}</p>
              <p className="text-sm text-gray-500">سيتم تصديرها</p>
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting || filteredShipments.length === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              isExporting || filteredShipments.length === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
            }`}
          >
            {isExporting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>جاري التصدير...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>تصدير Excel</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">معاينة البيانات</h2>
          <p className="text-sm text-gray-500">أول 10 شحنات من النتائج</p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 mt-3">جاري التحميل...</p>
          </div>
        ) : filteredShipments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>لا توجد شحنات مطابقة للفلاتر</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">تاريخ اليوم</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">رقم المرجع</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">نوع العملية</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">اسم العميل</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">رقم الحاوية</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">موقع التسليم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredShipments.slice(0, 10).map((shipment, index) => (
                  <tr key={shipment.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {formatDate(shipment.movement_date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 font-mono">
                      {shipment.reference_number || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        shipment.process_type === 'import' 
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {translateProcessType(shipment.process_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {shipment.client_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                      {shipment.container_number || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {shipment.delivery_location || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Show more indicator */}
        {filteredShipments.length > 10 && (
          <div className="p-4 border-t border-gray-100 text-center text-sm text-gray-500">
            +{filteredShipments.length - 10} شحنات أخرى...
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportPage;