import React, { useState, useEffect } from 'react';
import { Shipment } from '../types/shipment';

const API_BASE = 'http://localhost:5001';

// ============================================
// HELPER FUNCTIONS
// ============================================
const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('ar-EG');
};

const csvEscape = (v: any) => {
  const s = String(v ?? '');
  return `"${s.replace(/"/g, '""')}"`;
};

const downloadCSV = (filename: string, rows: Record<string, any>[]) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => csvEscape(r[h])).join(',')),
  ];
  const csv = csvLines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// ============================================
// EXPORT PAGE COMPONENT
// ============================================
const ExportPage: React.FC = () => {
  // Data
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [movementType, setMovementType] = useState<'all' | 'استيراد' | 'تصدير'>('all');
  const [clientFilter, setClientFilter] = useState('');

  // Export options
  const [includeAll, setIncludeAll] = useState(true);

  // Fetch shipments
  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/shipments`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setShipments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchShipments();
  }, []);

  // Filter shipments
  const filteredShipments = shipments.filter((s) => {
    // Movement type filter
    if (movementType !== 'all' && s.movement_type !== movementType) return false;

    // Client filter
    if (clientFilter.trim()) {
      const client = (s.client_name || '').toLowerCase();
      if (!client.includes(clientFilter.toLowerCase().trim())) return false;
    }

    // Date range filter
    if (dateFrom) {
      const shipmentDate = new Date(s.movement_date || s.created_at || '');
      const fromDate = new Date(dateFrom);
      if (shipmentDate < fromDate) return false;
    }

    if (dateTo) {
      const shipmentDate = new Date(s.movement_date || s.created_at || '');
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (shipmentDate > toDate) return false;
    }

    return true;
  });

  // Export handler
  const handleExport = () => {
    if (!filteredShipments.length) {
      alert('لا توجد بيانات للتصدير بناءً على الفلاتر المحددة');
      return;
    }

    const rows = filteredShipments.map((s) => {
      if (includeAll) {
        // Export ALL columns
        return {
          'رقم المرجع': s.reference_number || s.permit_number || '',
          'نوع العملية': s.movement_type || '',
          'نوع الشحن': s.freight_type || '',
          'اسم العميل': s.client_name || '',
          'شركة التخليص': s.clearance_company || '',
          'مسرب الحاوية': s.container_leak_status || '',
          'رقم التصريح الجمركي': s.customs_permit_number || '',
          'وصف البضاعة': s.goods_description || '',
          'حجم الحاوية': s.container_size || '',
          'رقم الحاوية': s.container_number || '',
          'وزن الحاوية': s.container_weight ?? '',
          'الخط الملاحي': s.shipping_line || '',
          'رقم البوليصة': s.bill_of_lading_number || '',
          'اسم السائق': s.driver_name || '',
          'رقم هاتف السائق': s.driver_phone || '',
          'رقم القاطرة': s.tractor_number || '',
          'رقم المقطورة': s.trailer_number || '',
          'موقع التسليم': s.delivery_location || '',
          'موقع التحميل': s.loading_location || '',
          'تاريخ التسليم': formatDate(s.delivery_date),
          'مسؤول المستودع': s.warehouse_manager || '',
          'رقم هاتف المسؤول': s.warehouse_manager_phone || '',
          'ساعات العمل': s.warehouse_working_hours || '',
          'ملاحظات': s.notes || '',
          'تاريخ الإنشاء': formatDate(s.created_at),
        };
      } else {
        // Export basic columns only
        return {
          'رقم المرجع': s.reference_number || s.permit_number || '',
          'نوع العملية': s.movement_type || '',
          'اسم العميل': s.client_name || '',
          'رقم الحاوية': s.container_number || '',
          'وزن الحاوية': s.container_weight ?? '',
          'الموقع': s.delivery_location || s.loading_location || '',
          'التاريخ': formatDate(s.delivery_date || s.movement_date),
        };
      }
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `shipments_export_${dateStr}.csv`;
    downloadCSV(filename, rows);

    alert(`تم تصدير ${rows.length} شحنة بنجاح!`);
  };

  // Reset filters
  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setMovementType('all');
    setClientFilter('');
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-gray-500">جاري تحميل البيانات...</div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">تصدير البيانات</h1>
        <p className="text-gray-500 mt-1">اختر الفلاتر المناسبة ثم قم بتصدير البيانات إلى Excel</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            فلاتر التصدير
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
              />
            </div>

            {/* Movement Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع العملية</label>
              <select
                value={movementType}
                onChange={(e) => setMovementType(e.target.value as any)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
              >
                <option value="all">الكل</option>
                <option value="استيراد">استيراد فقط</option>
                <option value="تصدير">تصدير فقط</option>
              </select>
            </div>

            {/* Client Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم العميل</label>
              <input
                type="text"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                placeholder="ابحث باسم العميل..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
              />
            </div>
          </div>

          {/* Export Options */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-3">خيارات التصدير</h3>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={includeAll}
                  onChange={() => setIncludeAll(true)}
                  className="w-4 h-4 text-sky-600"
                />
                <span className="text-sm text-gray-700">تصدير جميع الأعمدة (25 عمود)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={!includeAll}
                  onChange={() => setIncludeAll(false)}
                  className="w-4 h-4 text-sky-600"
                />
                <span className="text-sm text-gray-700">تصدير الأعمدة الأساسية فقط (7 أعمدة)</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={resetFilters}
              className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-sm"
            >
              مسح الفلاتر
            </button>
          </div>
        </div>

        {/* Export Summary Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">ملخص التصدير</h2>
          
          {/* Stats */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-600 text-sm">إجمالي الشحنات</span>
              <span className="font-bold text-gray-800">{shipments.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-sky-50 rounded-xl">
              <span className="text-sky-600 text-sm">سيتم تصديرها</span>
              <span className="font-bold text-sky-600">{filteredShipments.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-600 text-sm">عدد الأعمدة</span>
              <span className="font-bold text-gray-800">{includeAll ? 25 : 7}</span>
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={filteredShipments.length === 0}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              filteredShipments.length > 0
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>تصدير إلى Excel</span>
          </button>

          {filteredShipments.length === 0 && (
            <p className="text-center text-sm text-gray-400 mt-3">
              لا توجد شحنات مطابقة للفلاتر
            </p>
          )}
        </div>
      </div>

      {/* Preview Table */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">معاينة البيانات ({filteredShipments.length} شحنة)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">رقم المرجع</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">نوع العملية</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">العميل</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">رقم الحاوية</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredShipments.slice(0, 10).map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{s.reference_number || s.permit_number || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      s.movement_type === 'استيراد' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {s.movement_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{s.client_name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">{s.container_number || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(s.delivery_date || s.movement_date)}</td>
                </tr>
              ))}
              {filteredShipments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    لا توجد شحنات مطابقة للفلاتر
                  </td>
                </tr>
              )}
              {filteredShipments.length > 10 && (
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-center text-gray-400 text-sm">
                    ... و {filteredShipments.length - 10} شحنة أخرى
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExportPage;
