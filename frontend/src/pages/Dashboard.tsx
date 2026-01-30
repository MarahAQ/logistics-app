import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shipment } from '../types/shipment';

const API_BASE = 'http://localhost:5001';

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('ar-EG');
};

// ------------------------------
// Status (Frontend-only for demo)
// ------------------------------
type ShipmentStatus = 'open' | 'in_progress' | 'ready_for_accountant' | 'closed';

const STATUS_STORAGE_KEY = 'shipment_status_by_id_v1';

const STATUS_OPTIONS: { value: ShipmentStatus; label: string }[] = [
  { value: 'open', label: 'مفتوح' },
  { value: 'in_progress', label: 'قيد التنفيذ' },
  { value: 'ready_for_accountant', label: 'جاهز للمحاسبة' },
  { value: 'closed', label: 'مغلق' },
];

const getStatusMap = (): Record<string, ShipmentStatus> => {
  try {
    return JSON.parse(localStorage.getItem(STATUS_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const setStatusMap = (map: Record<string, ShipmentStatus>) => {
  localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(map));
};

// ------------------------------
// CSV Export (Excel-friendly)
// ------------------------------
const csvEscape = (v: any) => {
  const s = String(v ?? '');
  // Escape quotes by doubling them
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

const Dashboard: React.FC = () => {
  // ------------------------------
  // Data State
  // ------------------------------
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  // ------------------------------
  // UI State
  // ------------------------------
  const [search, setSearch] = useState('');
  const [filterMovement, setFilterMovement] = useState<'all' | 'استيراد' | 'تصدير'>('all');
  const [filterRef, setFilterRef] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [visibleCount, setVisibleCount] = useState(15);

  // Meatball menu
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Status map (frontend-only, demo-ready)
  const [statusMapState, setStatusMapState] = useState<Record<string, ShipmentStatus>>(() => getStatusMap());

  const location = useLocation();

  // ------------------------------
  // Fetch Shipments
  // ------------------------------
  const fetchShipments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/shipments`);
      if (!response.ok) throw new Error('Failed to fetch shipments');
      const data = await response.json();
      setShipments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching shipments:', error);
      alert('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchShipments();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Close menu on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (openMenuId !== null && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [openMenuId]);

  // ------------------------------
  // Actions
  // ------------------------------
  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الشحنة؟')) return;
    try {
      const response = await fetch(`${API_BASE}/api/shipments/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete shipment');
      alert('تم حذف الشحنة بنجاح!');
      setOpenMenuId(null);
      fetchShipments();
    } catch (error) {
      console.error('Error deleting shipment:', error);
      alert('حدث خطأ أثناء حذف الشحنة');
    }
  };

  const handleView = (shipment: Shipment) => {
    setOpenMenuId(null);
    alert(`عرض تفاصيل الشحنة:\n${JSON.stringify(shipment, null, 2)}`);
  };

  // ------------------------------
  // Status Helpers (frontend-only)
  // ------------------------------
  const getShipmentStatus = (shipmentId: number): ShipmentStatus => {
    return statusMapState[String(shipmentId)] || 'open';
  };

  const updateShipmentStatus = (shipmentId: number, status: ShipmentStatus) => {
    const next = { ...statusMapState, [String(shipmentId)]: status };
    setStatusMapState(next);
    setStatusMap(next);
  };

  // ------------------------------
  // Filtering + Search
  // ------------------------------
  const normalized = (v: any) => String(v ?? '').toLowerCase().trim();

  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      if (filterMovement !== 'all' && s.movement_type !== filterMovement) return false;

      if (filterRef.trim()) {
        const ref = normalized(s.reference_number || s.permit_number);
        if (!ref.includes(normalized(filterRef))) return false;
      }

      if (filterClient.trim()) {
        const client = normalized(s.client_name);
        if (!client.includes(normalized(filterClient))) return false;
      }

      if (search.trim()) {
        const haystack = [
          s.reference_number,
          s.permit_number,
          s.client_name,
          s.container_number,
          s.bill_of_lading_number,
          s.shipping_line,
        ]
          .map(normalized)
          .join(' ');
        if (!haystack.includes(normalized(search))) return false;
      }

      return true;
    });
  }, [shipments, filterMovement, filterRef, filterClient, search]);

  const visibleShipments = useMemo(() => filteredShipments.slice(0, visibleCount), [filteredShipments, visibleCount]);
  const canLoadMore = visibleCount < filteredShipments.length;

  // Stats (still show overall totals)
  const importCount = shipments.filter((s) => s.movement_type === 'استيراد').length;
  const exportCount = shipments.filter((s) => s.movement_type === 'تصدير').length;

  // ------------------------------
  // Export to Excel (CSV) - Dashboard
  // Exports CURRENT filtered set (not just visible)
  // ------------------------------
  const handleExportDashboardCSV = () => {
    if (!filteredShipments.length) {
      alert('لا توجد بيانات للتصدير بناءً على الفلاتر الحالية');
      return;
    }

    const rows = filteredShipments.map((s) => {
      const status = getShipmentStatus(s.id);
      const statusLabel = STATUS_OPTIONS.find((x) => x.value === status)?.label || 'مفتوح';

      const locationValue =
        s.movement_type === 'استيراد' ? s.delivery_location || '' : s.loading_location || '';

      const dateValue =
        s.movement_type === 'استيراد' ? s.delivery_date : s.movement_date;

      return {
        reference_number: s.reference_number || s.permit_number || '',
        movement_type: s.movement_type || '',
        status: statusLabel,
        client_name: s.client_name || '',
        container_number: s.container_number || '',
        container_weight: s.container_weight ?? '',
        location: locationValue,
        date: formatDate(dateValue),
        shipping_line: s.shipping_line || '',
        bill_of_lading_number: s.bill_of_lading_number || '',
        created_at: formatDate(s.created_at),
      };
    });

    const filename = `shipments_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCSV(filename, rows);
  };

  const resetFilters = () => {
    setSearch('');
    setFilterMovement('all');
    setFilterRef('');
    setFilterClient('');
    setVisibleCount(15);
  };

  // ------------------------------
  // Loading UI
  // ------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">جاري تحميل البيانات...</div>
      </div>
    );
  }

  // ==============================
  // Render
  // ==============================
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">لوحة التحكم</h1>
          <p className="text-gray-600">مرحباً بك في نظام إدارة الشحنات اللوجستية</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-700">إجمالي الشحنات</h3>
            <p className="text-3xl font-bold text-blue-600">{shipments.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-700">شحنات الاستيراد</h3>
            <p className="text-3xl font-bold text-green-600">{importCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-700">شحنات التصدير</h3>
            <p className="text-3xl font-bold text-orange-600">{exportCount}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6" dir="rtl">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="bg-gray-200 text-gray-800 px-4 py-3 rounded-md hover:bg-gray-300"
            >
              رجوع
            </button>

            <Link
              to="/shipments/daily"
              className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700"
            >
              نموذج الحاويات اليومية
            </Link>

            <button
              type="button"
              onClick={handleExportDashboardCSV}
              className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700"
            >
              تصدير إلى Excel
            </button>

            <Link
              to="/"
              className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700"
            >
              تسجيل الخروج
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6" dir="rtl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">بحث عام</label>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setVisibleCount(15);
                }}
                placeholder="ابحث برقم المرجع، اسم العميل..."
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">نوع العملية</label>
              <select
                value={filterMovement}
                onChange={(e) => {
                  setFilterMovement(e.target.value as any);
                  setVisibleCount(15);
                }}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="all">الكل</option>
                <option value="استيراد">استيراد</option>
                <option value="تصدير">تصدير</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">رقم المرجع</label>
              <input
                value={filterRef}
                onChange={(e) => {
                  setFilterRef(e.target.value);
                  setVisibleCount(15);
                }}
                placeholder="مثال: SEA-IMP-2026-0001"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">اسم العميل</label>
              <input
                value={filterClient}
                onChange={(e) => {
                  setFilterClient(e.target.value);
                  setVisibleCount(15);
                }}
                placeholder="اسم العميل"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              النتائج: {filteredShipments.length}
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
            >
              مسح الفلاتر
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden" dir="rtl">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              قائمة الشحنات ({filteredShipments.length})
            </h2>
            <div className="text-sm text-gray-500">
              المعروض الآن: {visibleShipments.length}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم المرجع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نوع العملية
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    اسم العميل
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    وزن الحاوية (طن)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الموقع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {visibleShipments.map((shipment) => {
                  const statusValue = getShipmentStatus(shipment.id);

                  return (
                    <tr
                      key={shipment.id}
                      className={`${
                        shipment.movement_type === 'استيراد' ? 'bg-green-50' : 'bg-orange-50'
                      } hover:bg-gray-100 transition-colors duration-200`}
                    >
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-700 whitespace-nowrap">
                        {shipment.reference_number || shipment.permit_number || '-'}
                      </td>

                      <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-white text-xs ${
                            shipment.movement_type === 'استيراد' ? 'bg-green-600' : 'bg-orange-600'
                          }`}
                        >
                          {shipment.movement_type}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                        <select
                          value={statusValue}
                          onChange={(e) =>
                            updateShipmentStatus(shipment.id, e.target.value as ShipmentStatus)
                          }
                          className="px-2 py-1 border rounded-md text-sm bg-white"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-6 py-4 text-right text-sm text-gray-900 whitespace-nowrap">
                        {shipment.client_name || '-'}
                      </td>

                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-700 whitespace-nowrap">
                        {shipment.container_weight ?? '-'}
                      </td>

                      <td className="px-6 py-4 text-right text-sm text-gray-500 whitespace-nowrap">
                        {shipment.movement_type === 'استيراد'
                          ? shipment.delivery_location || '-'
                          : shipment.loading_location || '-'}
                      </td>

                      <td className="px-6 py-4 text-right text-sm text-gray-500 font-medium whitespace-nowrap">
                        {shipment.movement_type === 'استيراد'
                          ? formatDate(shipment.delivery_date)
                          : formatDate(shipment.movement_date)}
                      </td>

                      {/* Meatball menu */}
                      <td className="px-6 py-4 text-sm font-medium relative" ref={openMenuId === shipment.id ? menuRef : null}>
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(openMenuId === shipment.id ? null : shipment.id)}
                          className="px-2 py-1 rounded hover:bg-gray-200"
                          title="المزيد"
                        >
                          ⋮
                        </button>

                        {openMenuId === shipment.id && (
                          <div className="absolute left-4 mt-2 w-44 bg-white border rounded-md shadow-lg z-20 overflow-hidden">
                            <button
                              type="button"
                              className="w-full text-right px-4 py-2 hover:bg-gray-50"
                              onClick={() => handleView(shipment)}
                            >
                              عرض
                            </button>

                            <Link
                              to={`/shipments/edit/${shipment.id}`}
                              className="block text-right px-4 py-2 hover:bg-gray-50"
                              onClick={() => setOpenMenuId(null)}
                            >
                              تعديل
                            </Link>

                            <button
                              type="button"
                              className="w-full text-right px-4 py-2 hover:bg-gray-50 text-red-600"
                              onClick={() => handleDelete(shipment.id)}
                            >
                              حذف
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {!visibleShipments.length && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                      لا توجد شحنات مطابقة للفلاتر الحالية
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Load More */}
          <div className="p-4 flex justify-center">
            {canLoadMore ? (
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + 15)}
                className="px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900"
              >
                اضغط للمزيد
              </button>
            ) : (
              filteredShipments.length > 0 && (
                <div className="text-sm text-gray-500">تم عرض جميع النتائج</div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;