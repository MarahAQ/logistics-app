import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShipmentFormData } from '../types/shipment';
import AutoSuggestInput from '../components/AutoSuggestInput';

// ✅ 1. DEFINE initialFormData WITH ALL FIELDS
const initialFormData: ShipmentFormData = {
  movement_date: '',
  movement_type: 'استيراد',
  freight_type: '',
  client_name: '',
  driver_name: '',
  invoice_number: '',
  container_number: '',
  delivery_date: '',
  clearance_company: '',
  container_leak_status: 'green',
  container_leak_custom: '',
  customs_permit_number: '',
  goods_description: '',
  container_size: '20dry',
  container_weight: 2,
  shipping_line: '',
  bill_of_lading_number: '',
  tractor_number: '',
  trailer_number: '',
  driver_phone: '',
  delivery_location: '',
  loading_location: '',
  warehouse_manager: '',
  warehouse_manager_phone: '',
  process_type: 'استيراد',
  notes: '',
  // ✅ Phase 1: keep UI-only schedule (we serialize it into warehouse_working_hours)
  working_schedule: {
    type: 'preset',
    preset: 'sun-thu',
    days: ['', ''],
    start_time: '',
    end_time: '',
  },
};

const EnhancedShipmentForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // ===========================
  // ✅ STATE
  // ===========================
  const [formData, setFormData] = useState<ShipmentFormData>(initialFormData);
  const [dateError, setDateError] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===========================
  // ✅ EFFECTS
  // ===========================
  useEffect(() => {
    if (formData.movement_date && formData.delivery_date) {
      const startDate = new Date(formData.movement_date);
      const endDate = new Date(formData.delivery_date);
      setDateError(startDate >= endDate ? 'تاريخ البدء يجب أن يكون قبل تاريخ الانتهاء' : '');
    } else {
      setDateError('');
    }
  }, [formData.movement_date, formData.delivery_date]);

  useEffect(() => {
    if (!id) return; // creating a new shipment

    const fetchShipment = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/shipments/${id}`);
        if (!response.ok) throw new Error('Failed to load shipment');

        const data = await response.json();

        // ✅ Always merge with initialFormData so missing fields don't break the UI
        setFormData({ ...initialFormData, ...data });
      } catch (err) {
        console.error(err);
        alert('فشل تحميل بيانات الشحنة');
      }
    };

    fetchShipment();
  }, [id]);

  // ===========================
  // ✅ HELPERS
  // ===========================
  const validateShippingLine = (value: string): boolean => /^[A-Z]{3}$/.test(value);
  const validateContainerNumber = (value: string): boolean => /^[A-Z]{4}[0-9]{7}$/.test(value);
  const validatePhoneNumber = (value: string): boolean => /^[0-9]{10}$/.test(value);

  const validateRequired = (value: any): boolean => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'number') return true;
    return true;
  };

  // ✅ Build payload in one place (used by submit + optional future actions)
  const buildPayload = (): any => {
    const schedule = formData.working_schedule;
    const warehouse_working_hours =
      schedule && (schedule.days?.[0] || schedule.days?.[1] || schedule.start_time || schedule.end_time)
        ? `${schedule.days?.[0] || ''} إلى ${schedule.days?.[1] || ''} | ${schedule.start_time || ''}-${schedule.end_time || ''}`
        : '';

    const payload: any = {
      ...formData,
      warehouse_working_hours,
    };

    // UI-only
    delete payload.working_schedule;

    // ✅ Phase 1: shipment status (frontend-only for now if backend doesn't support it yet)
    // If your ShipmentFormData doesn't have status yet, this is safe to omit.
    // payload.status = payload.status || 'open';

    return payload;
  };

  // ===========================
  // ✅ VALIDATION
  // ===========================
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    const requiredFields: (keyof ShipmentFormData)[] = [
      'movement_date',
      'movement_type',
      'freight_type',
      'client_name',
      'container_number',
      'delivery_date',
      'container_weight',
      'shipping_line',
      'warehouse_manager',
      formData.movement_type === 'استيراد' ? 'delivery_location' : 'loading_location',
    ];

    requiredFields.forEach((field) => {
      const value = formData[field];
      if (!validateRequired(value)) {
        errors[field] = 'هذا الحقل مطلوب';
      }
    });

    if (formData.shipping_line && !validateShippingLine(formData.shipping_line)) {
      errors.shipping_line = 'يجب أن يتكون الخط الملاحي من 3 أحرف كبيرة فقط';
    }

    if (formData.container_weight && formData.container_weight < 2) {
      errors.container_weight = 'يجب أن يكون وزن الحاوية 2 طن أو أكثر';
    }

    if (formData.container_number && !validateContainerNumber(formData.container_number)) {
      errors.container_number = 'يجب أن يكون رقم الحاوية 4 أحرف متبوعة بـ 7 أرقام';
    }

    if (formData.driver_phone && !validatePhoneNumber(formData.driver_phone)) {
      errors.driver_phone = 'رقم الهاتف يجب أن يكون 10 أرقام بالضبط';
    }

    if (formData.warehouse_manager_phone && !validatePhoneNumber(formData.warehouse_manager_phone)) {
      errors.warehouse_manager_phone = 'رقم الهاتف يجب أن يكون 10 أرقام بالضبط';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ===========================
  // ✅ HANDLERS
  // ===========================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === 'container_number') {
      newValue = value.replace(/[a-zA-Z]/g, (letter) => letter.toUpperCase());
      setFormErrors((prev) => ({
        ...prev,
        container_number: validateContainerNumber(newValue)
          ? ''
          : 'يجب أن يكون رقم الحاوية 4 أحرف متبوعة بـ 7 أرقام',
      }));
    }

    if (name === 'shipping_line') {
      newValue = value.toUpperCase();
    }

    if (name === 'driver_phone' || name === 'warehouse_manager_phone') {
      newValue = value.replace(/\D/g, '');
      if (newValue.length > 10) newValue = newValue.slice(0, 10);

      setFormErrors((prev) => ({
        ...prev,
        [name]: validatePhoneNumber(newValue) ? '' : 'رقم الهاتف يجب أن يكون 10 أرقام بالضبط',
      }));
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    if (
      name !== 'container_number' &&
      name !== 'driver_phone' &&
      name !== 'warehouse_manager_phone' &&
      formErrors[name]
    ) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleAutoSuggestChange = (field: keyof ShipmentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // ===========================
  // ✅ SUBMIT
  // ===========================
  const submitForm = async (showPrint: boolean = false) => {
    if (dateError) {
      alert('يرجى تصحيح تواريخ النموذج قبل الحفظ');
      return;
    }

    if (!validateForm()) {
      alert('يرجى ملء جميع الحقول المطلوبة وتصحيح الأخطاء');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    const payload = buildPayload();

    try {
      const response = await fetch(
        id ? `http://localhost:5001/api/shipments/${id}` : 'http://localhost:5001/api/shipments',
        {
          method: id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error('خطأ أثناء حفظ البيانات');

      alert(showPrint ? 'تم الحفظ! سيتم الطباعة...' : 'تم إضافة الشحنة بنجاح!');

      setFormData(initialFormData);
      navigate('/dashboard', { state: { refresh: true } });

      if (showPrint) window.print();
    } catch (error: any) {
      alert('حدث خطأ: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitForm(false);
  };

  const handleSaveAndPrint = (e: React.MouseEvent) => {
    e.preventDefault();
    submitForm(true);
  };

  // ✅ Back button behavior (requested)
  const handleBack = () => {
    navigate('/dashboard');
  };

  const deliverySectionTitle = useMemo(
    () => (formData.movement_type === 'استيراد' ? 'معلومات التسليم' : 'معلومات التحميل'),
    [formData.movement_type]
  );

  // ===========================
  // ✅ RETURN
  // ===========================
  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg print:shadow-none">
          {/* ===========================
              HEADER
          =========================== */}
          <div className="px-6 py-4 border-b border-gray-200 no-print flex items-center justify-between">
            <div className="text-right">
              <h1 className="text-2xl font-bold text-gray-800">نموذج الحاويات اليومية</h1>
              <p className="text-gray-600 mt-2">Daily Containers Form - النموذج التشغيلي اليومي</p>
            </div>

            {/* ✅ Back button (requested) */}
            <button
              type="button"
              onClick={handleBack}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition"
            >
              رجوع للوحة التحكم
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* SECTION 1 */}
            <div className="mb-8 pb-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">نوع العملية والتاريخ ونوع الشحن</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Process Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">نوع العملية *</label>
                  <select
                    name="movement_type"
                    value={formData.movement_type}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.movement_type ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="استيراد">استيراد</option>
                    <option value="تصدير">تصدير</option>
                  </select>
                  {formErrors.movement_type && (
                    <p className="text-red-500 text-sm mt-1 text-right">{formErrors.movement_type}</p>
                  )}
                </div>

                {/* Movement Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">تاريخ اليوم *</label>
                  <input
                    type="date"
                    name="movement_date"
                    value={formData.movement_date}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.movement_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.movement_date && (
                    <p className="text-red-500 text-sm mt-1 text-right">{formErrors.movement_date}</p>
                  )}
                </div>

                {/* Freight Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">نوع الشحن *</label>
                  <select
                    name="freight_type"
                    value={formData.freight_type}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.freight_type ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">اختر النوع</option>
                    <option value="AIR">AIR</option>
                    <option value="SEA">SEA</option>
                    <option value="TRK">TRK</option>
                  </select>
                  {formErrors.freight_type && (
                    <p className="text-red-500 text-sm mt-1 text-right">{formErrors.freight_type}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2 */}
            <div className="mb-8 pb-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">معلومات العميل</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">اسم العميل *</label>
                  <AutoSuggestInput
                    field="client_name"
                    value={formData.client_name}
                    onChange={(value) => handleAutoSuggestChange('client_name', value)}
                    placeholder="اسم العميل"
                    className={formErrors.client_name ? 'border-red-500' : ''}
                  />
                  {formErrors.client_name && (
                    <p className="text-red-500 text-sm mt-1 text-right">{formErrors.client_name}</p>
                  )}
                </div>

                {/* Clearance Company */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">شركة التخليص</label>
                  <input
                    type="text"
                    name="clearance_company"
                    value={formData.clearance_company}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Container Leak Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">مسرب الحاوية</label>
                  <select
                    name="container_leak_status"
                    value={formData.container_leak_status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="green">🟢 خروج</option>
                    <option value="yellow">🟡 معاينة غير فعلية</option>
                    <option value="red">🔴 معاينة فعلية</option>
                    <option value="other">أخرى</option>
                  </select>

                  {formData.container_leak_status === 'other' && (
                    <input
                      type="text"
                      name="container_leak_custom"
                      value={formData.container_leak_custom}
                      onChange={handleChange}
                      placeholder="أدخل حالة المسرب"
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                {/* Customs Permit Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">رقم التصريح الجمركي</label>
                  <input
                    type="text"
                    name="customs_permit_number"
                    value={formData.customs_permit_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Goods Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">وصف البضاعة</label>
                  <textarea
                    name="goods_description"
                    value={formData.goods_description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3 */}
            <div className="mb-8 pb-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">معلومات الحاوية</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Container Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">حجم الحاوية</label>
                  <select
                    name="container_size"
                    value={formData.container_size}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="20dry"> Dry 20 ft</option>
                    <option value="40dry"> Dry 40 ft</option>
                    <option value="40hcdry">High Cube Dry 40 ft </option>
                    <option value="20reefer">Reefer 20 ft</option>
                    <option value="40reefer">Reefer 40 ft </option>

                    <option value="opentop20">Open Top 20 ft</option>
                    <option value="opentop40">Open Top 40 ft</option>
                    <option value="flatrack20">Flat Rack 20 ft</option>
                    <option value="flatrack40">Flat Rack 40 ft</option>
                    <option value="tank20">Tank Container 20 ft</option>
                  </select>
                </div>

                {/* Container Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">وزن الحاوية (طن) *</label>
                  <input
                    type="number"
                    name="container_weight"
                    value={formData.container_weight}
                    onChange={handleChange}
                    min="2"
                    step="0.1"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.container_weight ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="2"
                  />
                  {formErrors.container_weight && (
                    <p className="text-red-500 text-sm mt-1 text-right">{formErrors.container_weight}</p>
                  )}
                </div>

                {/* Container Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">رقم الحاوية *</label>
                  <AutoSuggestInput
                    field="container_number"
                    value={formData.container_number}
                    onChange={(value) => handleAutoSuggestChange('container_number', value.toUpperCase())}
                    placeholder="أدخل رقم الحاوية"
                    className={formErrors.container_number ? 'border-red-500' : ''}
                  />
                  {formErrors.container_number && (
                    <p className="text-red-500 text-sm mt-1 text-right">{formErrors.container_number}</p>
                  )}
                </div>

                {/* Shipping Line */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">الخط الملاحي *</label>
                  <input
                    type="text"
                    name="shipping_line"
                    value={formData.shipping_line}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.shipping_line ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="MSC"
                  />
                  {formErrors.shipping_line && (
                    <p className="text-red-500 text-sm mt-1 text-right">{formErrors.shipping_line}</p>
                  )}
                </div>

                {/* Bill of Lading Number */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">رقم البوليصة</label>
                  <input
                    type="text"
                    name="bill_of_lading_number"
                    value={formData.bill_of_lading_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4 */}
            <div className="mb-8 pb-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">معلومات السائق والمركبة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Driver Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">اسم السائق</label>
                  <AutoSuggestInput
                    field="driver_name"
                    value={formData.driver_name}
                    onChange={(value) => handleAutoSuggestChange('driver_name', value)}
                    placeholder="اسم السائق"
                  />
                </div>

                {/* Driver Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">رقم هاتف السائق</label>
                  <input
                    type="tel"
                    name="driver_phone"
                    value={formData.driver_phone}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      formErrors.driver_phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.driver_phone && <p className="text-red-500 text-sm mt-1">{formErrors.driver_phone}</p>}
                </div>

                {/* Tractor Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">رقم القاطرة</label>
                  <input
                    type="text"
                    name="tractor_number"
                    value={formData.tractor_number}
                    onChange={handleChange}
                    placeholder="60-12345"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    pattern="60-?[0-9]{1,5}"
                    title="تبدأ بـ 60 متبوعة بـ 1-5 أرقام"
                  />
                </div>

                {/* Trailer Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">رقم المقطورة</label>
                  <input
                    type="text"
                    name="trailer_number"
                    value={formData.trailer_number}
                    onChange={handleChange}
                    placeholder="71-12345"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    pattern="71-?[0-9]{1,5}"
                    title="تبدأ بـ 71 متبوعة بـ 1-5 أرقام"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 5 */}
            <div className="mb-8 pb-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">{deliverySectionTitle}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Delivery/Loading Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    {formData.movement_type === 'استيراد' ? 'موقع التسليم' : 'موقع التحميل'} *
                  </label>
                  <input
                    type="text"
                    name={formData.movement_type === 'استيراد' ? 'delivery_location' : 'loading_location'}
                    value={formData.movement_type === 'استيراد' ? formData.delivery_location : formData.loading_location}
                    onChange={(e) => {
                      if (formData.movement_type === 'استيراد') {
                        setFormData({ ...formData, delivery_location: e.target.value });
                      } else {
                        setFormData({ ...formData, loading_location: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.movement_type === 'استيراد'
                    ? formErrors.delivery_location && (
                        <p className="text-red-500 text-sm mt-1 text-right">{formErrors.delivery_location}</p>
                      )
                    : formErrors.loading_location && (
                        <p className="text-red-500 text-sm mt-1 text-right">{formErrors.loading_location}</p>
                      )}
                </div>

                {/* Delivery/Loading Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    {formData.movement_type === 'استيراد' ? 'تاريخ التسليم' : 'تاريخ التحميل'} *
                  </label>
                  <input
                    type="date"
                    name="delivery_date"
                    value={formData.delivery_date}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.delivery_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.delivery_date && (
                    <p className="text-red-500 text-sm mt-1 text-right">{formErrors.delivery_date}</p>
                  )}
                </div>

                {/* Warehouse Manager */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">مسؤول المستودع</label>
                  <input
                    type="text"
                    name="warehouse_manager"
                    value={formData.warehouse_manager}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.warehouse_manager ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.warehouse_manager && (
                    <p className="text-red-500 text-sm mt-1 text-right">{formErrors.warehouse_manager}</p>
                  )}
                </div>

                {/* Warehouse Manager Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">رقم هاتف مسؤول المستودع</label>
                  <input
                    type="tel"
                    name="warehouse_manager_phone"
                    value={formData.warehouse_manager_phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formErrors.warehouse_manager_phone && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.warehouse_manager_phone}</p>
                  )}
                </div>
              </div>

              {/* WORKING SCHEDULE */}
              <div className="mb-6 mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">جدول عمل مسؤول المستودع</label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Days */}
                  <div className="flex items-center gap-2">
                    <span>يعمل من</span>
                    <select
                      value={formData.working_schedule?.days?.[0] || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          working_schedule: {
                            ...prev.working_schedule!,
                            days: [e.target.value, prev.working_schedule?.days?.[1] || ''],
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <span>إلى</span>
                    <select
                      value={formData.working_schedule?.days?.[1] || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          working_schedule: {
                            ...prev.working_schedule!,
                            days: [prev.working_schedule?.days?.[0] || '', e.target.value],
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <span>ومن الساعة</span>
                    <input
                      type="time"
                      value={formData.working_schedule?.start_time || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          working_schedule: {
                            ...prev.working_schedule!,
                            start_time: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span>إلى</span>
                    <input
                      type="time"
                      value={formData.working_schedule?.end_time || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          working_schedule: {
                            ...prev.working_schedule!,
                            end_time: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 6 */}
            <div className="mb-8 pb-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">ملاحظات إضافية</h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">ملاحظات</label>
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
            </div>

            {/* BUTTONS */}
            <div className="mt-8 flex justify-end space-x-4 space-x-reverse no-print">
              {/* Cancel */}
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                disabled={isSubmitting}
                className={`bg-gray-300 text-gray-700 px-6 py-2 rounded-md transition duration-200 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-400'
                }`}
              >
                إلغاء
              </button>

              {/* Save */}
              <button
                type="submit"
                disabled={!!dateError || isSubmitting}
                className={`px-6 py-2 rounded-md transition duration-200 ${
                  dateError || isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSubmitting ? 'جاري الحفظ...' : 'حفظ النموذج'}
              </button>

              {/* Save & Print */}
              <button
                type="button"
                disabled={!!dateError || isSubmitting}
                className={`px-6 py-2 rounded-md transition duration-200 ${
                  dateError || isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                onClick={handleSaveAndPrint}
              >
                {isSubmitting ? 'جاري الحفظ...' : 'حفظ وطباعة'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnhancedShipmentForm;