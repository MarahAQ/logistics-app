import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shipment } from '../types/shipment';

const API_BASE = 'http://localhost:5001';

// ============================================
// HELPERS
// ============================================
const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('ar-EG');
};

// Status types and options
type ShipmentStatus = 'open' | 'in_progress' | 'ready_for_accountant' | 'closed';

const STATUS_STORAGE_KEY = 'shipment_status_by_id_v1';

const STATUS_OPTIONS: { value: ShipmentStatus; label: string; color: string }[] = [
  { value: 'open', label: 'مفتوح', color: 'bg-blue-100 text-blue-700' },
  { value: 'in_progress', label: 'قيد التنفيذ', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'ready_for_accountant', label: 'جاهز للمحاسبة', color: 'bg-purple-100 text-purple-700' },
  { value: 'closed', label: 'مغلق', color: 'bg-green-100 text-green-700' },
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

// ============================================
// DASHBOARD COMPONENT
// ============================================
const Dashboard: React.FC = () => {
  // Data State
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [search, setSearch] = useState('');
  const [filterProcess, setFilterProcess] = useState<'all' | 'import' | 'export'>('all');
  const [visibleCount, setVisibleCount] = useState(15);

  // Menu state
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Status map
  const [statusMapState, setStatusMapState] = useState<Record<string, ShipmentStatus>>(() => getStatusMap());

  // ============================================
  // FETCH DATA
  // ============================================
  const fetchShipments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/shipments`);
      if (!response.ok) throw new Error('Failed to fetch shipments');
      const data = await response.json();
      setShipments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (openMenuId !== null && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [openMenuId]);

  // ============================================
  // ACTIONS
  // ============================================
  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الشحنة؟')) return;
    try {
      const response = await fetch(`${API_BASE}/api/shipments/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      setOpenMenuId(null);
      fetchShipments();
    } catch (error) {
      console.error('Error:', error);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const getShipmentStatus = (shipmentId: number): ShipmentStatus => {
    return statusMapState[String(shipmentId)] || 'open';
  };

  const updateShipmentStatus = (shipmentId: number, status: ShipmentStatus) => {
    const next = { ...statusMapState, [String(shipmentId)]: status };
    setStatusMapState(next);
    setStatusMap(next);
  };

  // ============================================
  // FILTERING
  // ============================================
  const normalized = (v: any) => String(v ?? '').toLowerCase().trim();

  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      if (filterProcess !== 'all' && s.process_type !== filterProcess) return false;

      if (search.trim()) {
        const haystack = [
          s.reference_number,
          s.permit_number,
          s.client_name,
          s.container_number,
        ]
          .map(normalized)
          .join(' ');
        if (!haystack.includes(normalized(search))) return false;
      }

      return true;
    });
  }, [shipments, filterProcess, search]);

  const visibleShipments = useMemo(() => filteredShipments.slice(0, visibleCount), [filteredShipments, visibleCount]);

  // Stats
  const importCount = shipments.filter((s) => s.process_type === 'import').length;
  const exportCount = shipments.filter((s) => s.process_type === 'export').length;
  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-500">جاري تحميل البيانات...</span>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
        <p className="text-gray-500 mt-1">مرحباً بك في نظام إدارة الشحنات</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">إجمالي الشحنات</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{shipments.length}</p>
            </div>
            <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">شحنات الاستيراد</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{importCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">شحنات التصدير</p>
              <p className="text-3xl font-bold text-orange-500 mt-1">{exportCount}</p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <svg className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setVisibleCount(15);
                }}
                placeholder="ابحث برقم المرجع، اسم العميل، رقم الحاوية..."
                className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Filter by type */}
          <select
            value={filterProcess}
            onChange={(e) => {
              setFilterProcess(e.target.value as any);
              setVisibleCount(15);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 min-w-[150px]"
          >
            <option value="all">جميع العمليات</option>
            <option value="import">استيراد فقط</option>
            <option value="export">تصدير فقط</option>
          </select>

          {/* Results count */}
          <div className="flex items-center text-sm text-gray-500">
            النتائج: {filteredShipments.length}
          </div>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم المرجع</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">نوع العملية</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">العميل</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الوزن (طن)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الموقع</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {visibleShipments.map((shipment) => {
                const statusValue = getShipmentStatus(shipment.id);
                const statusOption = STATUS_OPTIONS.find((s) => s.value === statusValue) || STATUS_OPTIONS[0];

                return (
                  <tr key={shipment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">
                      {shipment.reference_number || shipment.permit_number || '-'}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${shipment.process_type === 'import'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                        }`}>
                        {shipment.process_type}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-sm">
                      <select
                        value={statusValue}
                        onChange={(e) => updateShipmentStatus(shipment.id, e.target.value as ShipmentStatus)}
                        className={`px-2 py-1 rounded-lg text-xs font-medium border-0 cursor-pointer ${statusOption.color}`}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700">
                      {shipment.client_name || '-'}
                    </td>

                    <td className="px-4 py-3 text-sm font-semibold text-gray-700">
                      {shipment.container_weight ?? '-'}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-500">
                      {shipment.process_type === 'import'
                        ? shipment.delivery_location || '-'
                        : shipment.loading_location || '-'}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-500">
                      {shipment.process_type === 'import'
                        ? formatDate(shipment.delivery_date)
                        : formatDate(shipment.movement_date)}
                    </td>

                    {/* Actions Menu */}
                    <td className="px-4 py-3 text-sm relative" ref={openMenuId === shipment.id ? menuRef : null}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === shipment.id ? null : shipment.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                      </button>

                      {openMenuId === shipment.id && (
                        <div className="absolute left-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
                          <Link
                            to={`/shipments/edit/${shipment.id}`}
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setOpenMenuId(null)}
                          >
                            ✏️ تعديل
                          </Link>
                          <button
                            onClick={() => handleDelete(shipment.id)}
                            className="w-full text-right px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            🗑️ حذف
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {visibleShipments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    لا توجد شحنات مطابقة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Load More */}
        {visibleCount < filteredShipments.length && (
          <div className="p-4 border-t border-gray-100 flex justify-center">
            <button
              onClick={() => setVisibleCount((c) => c + 15)}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors text-sm"
            >
              عرض المزيد ({filteredShipments.length - visibleCount} متبقي)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
