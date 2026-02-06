import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShipmentFormData, WorkingSchedule } from '../types/shipment';
import AutoSuggestInput from '../components/AutoSuggestInput';

// ==============================
// EditShipmentForm Component
// Now with FULL field parity to EnhancedShipmentForm
// ==============================

const EditShipmentForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // ===========================
  // STATE
  // ===========================
  const [formData, setFormData] = useState<ShipmentFormData>({
    movement_date: '',
    freight_type: '',
    process_type: 'import',
    client_name: '',
    clearance_company: '',
    customs_agent: '',
    permit_number: '',
    customs_permit_number: '',
    invoice_number: '',
    container_number: '',
    container_size: '20dry',
    container_weight: 2,
    container_leak_status: 'green',
    container_leak_custom: '',
    shipping_line: '',
    bill_of_lading_number: '',
    goods_description: '',
    driver_name: '',
    driver_phone: '',
    vehicle_number: '',
    tractor_number: '',
    trailer_number: '',
    delivery_location: '',
    loading_location: '',
    unloading_date: '',
    delivery_date: '',
    warehouse_manager: '',
    warehouse_manager_phone: '',
    working_schedule: {
      type: 'preset',
      preset: 'sun-thu',
      days: ['', ''],
      start_time: '',
      end_time: ''
    },
    notes: ''
  });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ===========================
  // DATE NORMALIZATION HELPER
  // ===========================
  const normalizeDateToYYYYMMDD = (dateValue: string | null | undefined): string => {
    if (!dateValue) return '';
    // If already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue;
    // If ISO format (with time), extract date part
    if (dateValue.includes('T')) return dateValue.split('T')[0];
    // Try to parse and format
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // ===========================
  // FETCH SHIPMENT DATA
  // ===========================
  useEffect(() => {
    fetchShipment();
  }, [id]);

  const fetchShipment = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/shipments/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch shipment');
      }
      const data = await response.json();

      // Parse working schedule from backend string if exists
      let parsedSchedule: WorkingSchedule = {
        type: 'preset',
        preset: 'sun-thu',
        days: ['', ''],
        start_time: '',
        end_time: ''
      };

      if (data.warehouse_working_hours) {
        try {
          const parsed = JSON.parse(data.warehouse_working_hours);
          // Ensure all fields are defined
          parsedSchedule = {
            type: parsed.type || 'preset',
            preset: parsed.preset || 'sun-thu',
            days: parsed.days || ['', ''],
            start_time: parsed.start_time || '',
            end_time: parsed.end_time || ''
          };
        } catch {
          // If not JSON, keep default
        }
      }

      setFormData({
        movement_date: normalizeDateToYYYYMMDD(data.movement_date),
        freight_type: data.freight_type || '',
        process_type: data.process_type || 'import',
        client_name: data.client_name || '',
        clearance_company: data.clearance_company || '',
        customs_agent: data.customs_agent || '',
        permit_number: data.permit_number || '',
        customs_permit_number: data.customs_permit_number || '',
        invoice_number: data.invoice_number || '',
        container_number: data.container_number || '',
        container_size: data.container_size || '20dry',
        container_weight: data.container_weight || 2,
        container_leak_status: data.container_leak_status || 'green',
        container_leak_custom: data.container_leak_custom || '',
        shipping_line: data.shipping_line || '',
        bill_of_lading_number: data.bill_of_lading_number || '',
        goods_description: data.goods_description || '',
        driver_name: data.driver_name || '',
        driver_phone: data.driver_phone || '',
        vehicle_number: data.vehicle_number || '',
        tractor_number: data.tractor_number || '',
        trailer_number: data.trailer_number || '',
        delivery_location: data.delivery_location || '',
        loading_location: data.loading_location || '',
        unloading_date: normalizeDateToYYYYMMDD(data.unloading_date),
        delivery_date: normalizeDateToYYYYMMDD(data.delivery_date),
        warehouse_manager: data.warehouse_manager || '',
        warehouse_manager_phone: data.warehouse_manager_phone || '',
        working_schedule: parsedSchedule,
        notes: data.notes || ''
      });
    } catch (error) {
      console.error('Error fetching shipment:', error);
      alert('حدث خطأ أثناء تحميل بيانات الشحنة');
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // VALIDATION HELPERS
  // ===========================
  const validateShippingLine = (value: string): boolean => {
    return /^[A-Z]{3}$/.test(value);
  };

  const validateContainerNumber = (value: string): boolean => {
    return /^[A-Z]{4}[0-9]{7}$/.test(value);
  };

  const validatePhoneNumber = (value: string): boolean => {
    return /^[0-9]{10}$/.test(value);
  };

  // ===========================
  // HANDLERS
  // ===========================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let newValue = value;

    // Auto-format container number
    if (name === 'container_number') {
      newValue = value.replace(/[a-zA-Z]/g, (letter) => letter.toUpperCase());
      setFormErrors(prev => ({
        ...prev,
        container_number: validateContainerNumber(newValue) ? '' : 'يجب أن يكون رقم الحاوية 4 أحرف متبوعة بـ 7 أرقام'
      }));
    }

    // Auto-format shipping line
    if (name === 'shipping_line') {
      newValue = value.toUpperCase();
      setFormErrors(prev => ({
        ...prev,
        shipping_line: validateShippingLine(newValue) ? '' : 'يجب أن يتكون الخط الملاحي من 3 أحرف كبيرة فقط'
      }));
    }

    // Phone number validation
    if (name === 'driver_phone' || name === 'warehouse_manager_phone') {
      newValue = value.replace(/\D/g, '');
      if (newValue.length > 10) {
        newValue = newValue.slice(0, 10);
      }
      setFormErrors(prev => ({
        ...prev,
        [name]: validatePhoneNumber(newValue) ? '' : 'رقم الهاتف يجب أن يكون 10 أرقام بالضبط'
      }));
    }

    setFormData(prev => ({
      ...prev,
      [name]: name === 'container_weight' ? Number(newValue) : newValue
    }));
  };

  const handleAutoSuggestChange = (field: keyof ShipmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field when value changes
    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  // ===========================
  // SUBMIT HANDLER
  // ===========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Serialize working_schedule for backend
      const payload = {
        ...formData,
        warehouse_working_hours: formData.working_schedule
          ? JSON.stringify(formData.working_schedule)
          : null
      };

      const response = await fetch(`http://localhost:5001/api/shipments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to update shipment');
      }

      alert('تم تحديث الشحنة بنجاح!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating shipment:', error);
      alert('حدث خطأ أثناء تحديث الشحنة');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===========================
  // LOADING STATE
  // ===========================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  // ===========================
  // RENDER FORM
  // ===========================
  return (
    <div className="min-h-screen bg-gray-100 py-8" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">تعديل الشحنة #{id}</h1>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* SECTION 1: BASIC INFO */}
            <div className="mb-8 pb-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">المعلومات الأساسية</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Movement Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    تاريخ الحركة *
                  </label>
                  <input
                    type="date"
                    name="movement_date"
                    value={formData.movement_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Movement Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    نوع الحركة *
                  </label>
                  <select name="process_type"
                    value={formData.process_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="import">استيراد</option>
                    <option value="export">تصدير</option>
                  </select>
                </div>

                {/* Freight Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    نوع الشحن *
                  </label>
                  <select
                    name="freight_type"
                    value={formData.freight_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">اختر نوع الشحن</option>
                    <option value="SEA">بحري (SEA)</option>
                    <option value="AIR">جوي (AIR)</option>
                    <option value="TRK">بري (TRK)</option>
                  </select>
                </div>

                {/* Client Name with AutoSuggest */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    اسم العميل *
                  </label>
                  <AutoSuggestInput
                    field="client_name"
                    value={formData.client_name}
                    onChange={(value) => handleAutoSuggestChange('client_name', value)}
                    placeholder="أدخل اسم العميل"
                  />
                </div>

                {/* Clearance Company */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    شركة التخليص *
                  </label>
                  <input
                    type="text"
                    name="clearance_company"
                    value={formData.clearance_company}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Customs Agent */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    وكيل الجمارك
                  </label>
                  <input
                    type="text"
                    name="customs_agent"
                    value={formData.customs_agent}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: CONTAINER & CARGO */}
            <div className="mb-8 pb-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">معلومات الحاوية والبضاعة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Container Number with AutoSuggest */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    رقم الحاوية *
                  </label>
                  <AutoSuggestInput
                    field="container_number"
                    value={formData.container_number}
                    onChange={(value) => handleAutoSuggestChange('container_number', value.toUpperCase())}
                    placeholder="ABCD1234567"
                  />
                  {formErrors.container_number && (
                    <p className="text-red-500 text-sm mt-1 text-right">{formErrors.container_number}</p>
                  )}
                </div>

                {/* Container Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    حجم الحاوية *
                  </label>
                  <select
                    name="container_size"
                    value={formData.container_size}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="20dry">20 قدم جافة (20DRY)</option>
                    <option value="40dry">40 قدم جافة (40DRY)</option>
                    <option value="40hc">40 قدم عالية (40HC)</option>
                    <option value="45hc">45 قدم عالية (45HC)</option>
                  </select>
                </div>

                {/* Container Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    وزن الحاوية (طن) *
                  </label>
                  <input
                    type="number"
                    name="container_weight"
                    value={formData.container_weight}
                    onChange={handleChange}
                    min="2"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Container Leak Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    حالة التسريب
                  </label>
                  <select
                    name="container_leak_status"
                    value={formData.container_leak_status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="green">جيدة (أخضر)</option>
                    <option value="yellow">متوسطة (أصفر)</option>
                    <option value="red">سيئة (أحمر)</option>
                  </select>
                </div>

                {/* Custom Leak Description */}
                {formData.container_leak_status !== 'green' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      وصف التسريب
                    </label>
                    <input
                      type="text"
                      name="container_leak_custom"
                      value={formData.container_leak_custom}
                      onChange={handleChange}
                      placeholder="اذكر تفاصيل التسريب..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Goods Description with AutoSuggest */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    وصف البضاعة *
                  </label>
                  <AutoSuggestInput
                    field="goods_description"
                    value={formData.goods_description}
                    onChange={(value) => handleAutoSuggestChange('goods_description', value)}
                    placeholder="أدخل وصف البضاعة"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: SHIPPING & DOCUMENTS */}
            <div className="mb-8 pb-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">معلومات الشحن والمستندات</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shipping Line */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    الخط الملاحي *
                  </label>
                  <input
                    type="text"
                    name="shipping_line"
                    value={formData.shipping_line}
                    onChange={handleChange}
                    placeholder="MSC"
                    maxLength={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {formErrors.shipping_line && (
                    <p className="text-red-500 text-sm mt-1 text-right">{formErrors.shipping_line}</p>
                  )}
                </div>

                {/* Bill of Lading with AutoSuggest */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    رقم بوليصة الشحن
                  </label>
                  <AutoSuggestInput
                    field="bill_of_lading_number"
                    value={formData.bill_of_lading_number}
                    onChange={(value) => handleAutoSuggestChange('bill_of_lading_number', value)}
                    placeholder="أدخل رقم البوليصة"
                  />
                </div>

                {/* Permit Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    رقم الإذن *
                  </label>
                  <input
                    type="text"
                    name="permit_number"
                    value={formData.permit_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Customs Permit Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    رقم البيان الجمركي
                  </label>
                  <input
                    type="text"
                    name="customs_permit_number"
                    value={formData.customs_permit_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Invoice Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    رقم الفاتورة
                  </label>
                  <input
                    type="text"
                    name="invoice_number"
                    value={formData.invoice_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: VEHICLE & DRIVER */}
            <div className="mb-8 pb-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">معلومات المركبة والسائق</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Driver Name with AutoSuggest */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    اسم السائق *
                  </label>
                  <AutoSuggestInput
                    field="driver_name"
                    value={formData.driver_name}
                    onChange={(value) => handleAutoSuggestChange('driver_name', value)}
                    placeholder="أدخل اسم السائق"
                  />
                </div>

                {/* Driver Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    رقم هاتف السائق
                  </label>
                  <input
                    type="tel"
                    name="driver_phone"
                    value={formData.driver_phone}
                    onChange={handleChange}
                    placeholder="07XXXXXXXX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formErrors.driver_phone && (
                    <p className="text-red-500 text-sm mt-1 text-right">{formErrors.driver_phone}</p>
                  )}
                </div>

                {/* Vehicle Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    رقم المركبة *
                  </label>
                  <input
                    type="text"
                    name="vehicle_number"
                    value={formData.vehicle_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Tractor Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    رقم الرأس (الجرار)
                  </label>
                  <input
                    type="text"
                    name="tractor_number"
                    value={formData.tractor_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Trailer Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    رقم المقطورة
                  </label>
                  <input
                    type="text"
                    name="trailer_number"
                    value={formData.trailer_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 5: LOCATION & DELIVERY */}
            <div className="mb-8 pb-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">معلومات الموقع والتسليم</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Delivery Location (Import) */}
                {formData.process_type === 'import' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      موقع التسليم *
                    </label>
                    <input
                      type="text"
                      name="delivery_location"
                      value={formData.delivery_location}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={formData.process_type === 'import'}
                    />
                  </div>
                )}

                {/* Loading Location (Export) */}
                {formData.process_type === 'export' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      موقع التحميل *
                    </label>
                    <input
                      type="text"
                      name="loading_location"
                      value={formData.loading_location}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={formData.process_type === 'export'}
                    />
                  </div>
                )}

                {/* Unloading Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    تاريخ التفريغ
                  </label>
                  <input
                    type="date"
                    name="unloading_date"
                    value={formData.unloading_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Delivery Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    تاريخ التسليم *
                  </label>
                  <input
                    type="date"
                    name="delivery_date"
                    value={formData.delivery_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Warehouse Manager */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    مسؤول المستودع *
                  </label>
                  <input
                    type="text"
                    name="warehouse_manager"
                    value={formData.warehouse_manager}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Warehouse Manager Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    رقم هاتف مسؤول المستودع
                  </label>
                  <input
                    type="tel"
                    name="warehouse_manager_phone"
                    value={formData.warehouse_manager_phone}
                    onChange={handleChange}
                    placeholder="07XXXXXXXX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formErrors.warehouse_manager_phone && (
                    <p className="text-red-500 text-sm mt-1 text-right">{formErrors.warehouse_manager_phone}</p>
                  )}
                </div>
              </div>

              {/* Working Schedule */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  جدول عمل مسؤول المستودع
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Days */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm">يعمل من</span>
                    <select
                      value={formData.working_schedule?.days?.[0] || ''}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          working_schedule: {
                            ...prev.working_schedule!,
                            days: [e.target.value, prev.working_schedule?.days?.[1] || '']
                          }
                        }))
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">اختر اليوم</option>
                      <option value="الأحد">الأحد</option>
                      <option value="الإثنين">الإثنين</option>
                      <option value="الثلاثاء">الثلاثاء</option>
                      <option value="الأربعاء">الأربعاء</option>
                      <option value="الخميس">الخميس</option>
                      <option value="الجمعة">الجمعة</option>
                      <option value="السبت">السبت</option>
                    </select>
                    <span className="text-sm">إلى</span>
                    <select
                      value={formData.working_schedule?.days?.[1] || ''}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          working_schedule: {
                            ...prev.working_schedule!,
                            days: [prev.working_schedule?.days?.[0] || '', e.target.value]
                          }
                        }))
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">اختر اليوم</option>
                      <option value="الأحد">الأحد</option>
                      <option value="الإثنين">الإثنين</option>
                      <option value="الثلاثاء">الثلاثاء</option>
                      <option value="الأربعاء">الأربعاء</option>
                      <option value="الخميس">الخميس</option>
                      <option value="الجمعة">الجمعة</option>
                      <option value="السبت">السبت</option>
                    </select>
                  </div>

                  {/* Times */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm">من الساعة</span>
                    <input
                      type="time"
                      value={formData.working_schedule?.start_time || ''}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          working_schedule: {
                            ...prev.working_schedule!,
                            start_time: e.target.value
                          }
                        }))
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm">إلى</span>
                    <input
                      type="time"
                      value={formData.working_schedule?.end_time || ''}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          working_schedule: {
                            ...prev.working_schedule!,
                            end_time: e.target.value
                          }
                        }))
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 6: NOTES */}
            <div className="mb-8 pb-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">ملاحظات إضافية</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  ملاحظات
                </label>
                <textarea
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleChange}
                  rows={4}
                  placeholder="أي ملاحظات إضافية حول الشحنة..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* BUTTONS */}
            <div className="mt-8 flex justify-end space-x-4 space-x-reverse">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                disabled={isSubmitting}
                className={`bg-gray-300 text-gray-700 px-6 py-2 rounded-md transition duration-200 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-400'
                  }`}
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 rounded-md transition duration-200 ${isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
              >
                {isSubmitting ? 'جاري التحديث...' : 'تحديث الشحنة'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditShipmentForm;
