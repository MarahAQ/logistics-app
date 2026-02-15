import { useState, useEffect, Fragment } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShipmentFormData } from '../types/shipment';
import AutoSuggestInput from '../components/AutoSuggestInput';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// ============================================
// INITIAL FORM DATA
// ============================================
const initialFormData: ShipmentFormData = {
  movement_date: '',
  freight_type: 'TRK',
  client_name: '',
  driver_name: '',
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
  process_type: 'import',
  notes: '',
  working_schedule: {
    days: ['', ''],
    start_time: '',
    end_time: '',
  },
};

// ============================================
// SECTION CONFIGURATION
// ============================================
const SECTIONS = [
  { id: 1, title: 'نوع العملية والتاريخ', icon: '📋', titleEn: 'Operation & Date' },
  { id: 2, title: 'معلومات العميل', icon: '👤', titleEn: 'Client Info' },
  { id: 3, title: 'معلومات الحاوية', icon: '📦', titleEn: 'Container Info' },
  { id: 4, title: 'معلومات السائق والمركبة', icon: '🚛', titleEn: 'Driver & Vehicle' },
  { id: 5, title: 'معلومات التسليم', icon: '📍', titleEn: 'Delivery Info' },
  { id: 6, title: 'ملاحظات إضافية', icon: '📝', titleEn: 'Notes' },
];

// ============================================
// HELPER: Format date for input (YYYY-MM-DD)
// ============================================
const formatDateForInput = (dateValue: string | null | undefined): string => {
  if (!dateValue) return '';
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

// ============================================
// PROGRESS INDICATOR COMPONENT
// ============================================
interface ProgressIndicatorProps {
  currentSection: number;
  completedSections: number[];
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentSection, completedSections }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {SECTIONS.map((section, index) => (
          <Fragment key={section.id}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                  completedSections.includes(section.id)
                    ? 'bg-green-500 text-white'
                    : currentSection === section.id
                      ? 'bg-blue-500 text-white ring-4 ring-blue-200'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {completedSections.includes(section.id) ? '✓' : section.id}
              </div>
              <span className="text-xs mt-1 text-gray-600 hidden sm:block">{section.icon}</span>
            </div>
            {index < SECTIONS.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 rounded transition-all duration-300 ${
                  completedSections.includes(section.id) ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </Fragment>
        ))}
      </div>
      <div className="text-center text-sm text-gray-600">
        <span className="font-medium">{completedSections.length}</span> من{' '}
        <span className="font-medium">{SECTIONS.length}</span> أقسام مكتملة
      </div>
    </div>
  );
};

// ============================================
// SECTION HEADER COMPONENT
// ============================================
interface SectionHeaderProps {
  section: (typeof SECTIONS)[0];
  isActive: boolean;
  isCompleted: boolean;
  isLocked: boolean;
  onClick: () => void;
  summary?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  section,
  isActive,
  isCompleted,
  isLocked,
  onClick,
  summary,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLocked}
      className={`w-full p-4 rounded-lg border-2 transition-all duration-300 text-right ${
        isActive
          ? 'border-blue-500 bg-blue-50'
          : isCompleted
            ? 'border-green-500 bg-green-50 hover:bg-green-100'
            : isLocked
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
              : 'border-gray-300 bg-white hover:border-gray-400'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isCompleted
                ? 'bg-green-500 text-white'
                : isActive
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-300 text-gray-600'
            }`}
          >
            {isCompleted ? '✓' : isLocked ? '🔒' : section.id}
          </div>
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'rotate-90' : ''} ${
              isLocked ? 'text-gray-400' : 'text-gray-600'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <div className="flex-1 mr-4">
          <h3 className={`font-semibold ${isLocked ? 'text-gray-400' : 'text-gray-800'}`}>
            {section.icon} {section.title}
          </h3>
          {isCompleted && summary && <p className="text-sm text-green-700 mt-1">{summary}</p>}
        </div>
      </div>
    </button>
  );
};

// ============================================
// MAIN FORM COMPONENT
// ============================================
const EnhancedShipmentForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // STATE
  const [formData, setFormData] = useState<ShipmentFormData>(initialFormData);
  const [activeSection, setActiveSection] = useState(1);
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================================
  // EFFECTS
  // ============================================
  
  // Date validation (allow same-day)
  useEffect(() => {
    if (formData.movement_date && formData.delivery_date) {
      const startDate = new Date(formData.movement_date);
      const endDate = new Date(formData.delivery_date);
      setDateError(startDate > endDate ? 'تاريخ البدء يجب أن يكون قبل أو في نفس تاريخ الانتهاء' : '');
    } else {
      setDateError('');
    }
  }, [formData.movement_date, formData.delivery_date]);

  // Warehouse time validation
  useEffect(() => {
    const start = formData.working_schedule?.start_time;
    const end = formData.working_schedule?.end_time;
    if (start && end && end <= start) {
      setTimeError('وقت الانتهاء يجب أن يكون بعد وقت البدء');
    } else {
      setTimeError('');
    }
  }, [formData.working_schedule?.start_time, formData.working_schedule?.end_time]);

  // Fetch shipment for edit mode
  useEffect(() => {
    if (!id) return;

    const fetchShipment = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/shipments/${id}`);
        if (!response.ok) throw new Error('Failed to load shipment');
        const data = await response.json();

        // Format dates properly for input fields
        setFormData({
          ...initialFormData,
          ...data,
          movement_date: formatDateForInput(data.movement_date),
          delivery_date: formatDateForInput(data.delivery_date),
          unloading_date: formatDateForInput(data.unloading_date),
          container_weight: Number(data.container_weight) || 2,
        });

        // If editing, mark all sections as accessible
        setCompletedSections([1, 2, 3, 4, 5]);
      } catch (err) {
        console.error(err);
        alert('فشل تحميل بيانات الشحنة');
      }
    };

    fetchShipment();
  }, [id]);

  // ============================================
  // VALIDATION HELPERS
  // ============================================

  const isSectionComplete = (sectionId: number): boolean => {
    switch (sectionId) {
      case 1:
        return !!(formData.process_type && formData.movement_date && formData.freight_type);
      case 2:
        return !!formData.client_name;
      case 3:
        return !!(
          formData.container_number &&
          formData.shipping_line &&
          Number(formData.container_weight) >= 2
        );
      case 4:
        return !!(formData.driver_name && formData.tractor_number);
      case 5:
        return !!(
          (formData.process_type === 'import' ? formData.delivery_location : formData.loading_location) &&
          formData.delivery_date &&
          formData.warehouse_manager
        );
      case 6:
        return true;
      default:
        return false;
    }
  };

  const getSectionSummary = (sectionId: number): string => {
    switch (sectionId) {
      case 1:
        return `${formData.process_type === 'import' ? 'استيراد' : 'تصدير'} | ${formData.movement_date} | ${formData.freight_type}`;
      case 2:
        return formData.client_name + (formData.clearance_company ? ` | ${formData.clearance_company}` : '');
      case 3:
        return `${formData.container_number} | ${formData.container_weight} طن | ${formData.shipping_line}`;
      case 4:
        return `${formData.driver_name} | ${formData.tractor_number}`;
      case 5:
        const location = formData.process_type === 'import' ? formData.delivery_location : formData.loading_location;
        return `${location} | ${formData.delivery_date}`;
      case 6:
        return formData.notes ? formData.notes.substring(0, 50) + '...' : 'لا توجد ملاحظات';
      default:
        return '';
    }
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let newValue: string | number = value;

    // Container number: uppercase
    if (name === 'container_number') {
      newValue = value.replace(/[a-zA-Z]/g, (letter) => letter.toUpperCase());
    }

    // Shipping line: uppercase + validation
    if (name === 'shipping_line') {
      newValue = value.toUpperCase();
      const isValid = /^[A-Z]{3}$/.test(newValue);
      setFormErrors((prev) => ({
        ...prev,
        shipping_line: newValue && !isValid ? 'الخط الملاحي يجب أن يكون 3 أحرف بالضبط' : '',
      }));
    }

    // Phone numbers: digits only, max 10
    if (name === 'driver_phone' || name === 'warehouse_manager_phone') {
      newValue = value.replace(/\D/g, '');
      if (newValue.length > 10) newValue = newValue.slice(0, 10);
    }

    // Container weight: convert to number
    if (name === 'container_weight') {
      newValue = Number(value) || 0;
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleAutoSuggestChange = (field: keyof ShipmentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validate container number
    if (field === 'container_number') {
      const isValid = /^[A-Z]{4}[0-9]{7}$/.test(value);
      setFormErrors((prev) => ({
        ...prev,
        container_number: value && !isValid ? 'رقم الحاوية يجب أن يكون 4 أحرف + 7 أرقام (مثال: MSCU1234567)' : '',
      }));
    }
  };

  const completeSection = (sectionId: number) => {
    if (isSectionComplete(sectionId)) {
      if (!completedSections.includes(sectionId)) {
        setCompletedSections((prev) => [...prev, sectionId]);
      }
      if (sectionId < 6) {
        setActiveSection(sectionId + 1);
      }
    }
  };

  const handleSectionClick = (sectionId: number) => {
    const maxAccessible = Math.max(...completedSections, 0) + 1;
    if (completedSections.includes(sectionId) || sectionId <= maxAccessible) {
      setActiveSection(sectionId);
    }
  };

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

    delete payload.working_schedule;

    // Don't send process_type when editing
    if (id) {
      delete payload.process_type;
    }

    return payload;
  };

  const handleSubmit = async () => {
    if (dateError || timeError) {
      alert('يرجى تصحيح الأخطاء في النموذج قبل الحفظ');
      return;
    }

    // Check required sections (including section 4 now)
    const requiredSections = [1, 2, 3, 4, 5];
    const incompleteSections = requiredSections.filter((s) => !isSectionComplete(s));

    if (incompleteSections.length > 0) {
      alert('يرجى إكمال جميع الأقسام المطلوبة');
      setActiveSection(incompleteSections[0]);
      return;
    }

    // Check form errors
    if (formErrors.container_number || formErrors.shipping_line) {
      alert('يرجى تصحيح أخطاء التحقق في النموذج');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    const payload = buildPayload();

    try {
      const response = await fetch(
        id ? `${API_BASE}/api/shipments/${id}` : `${API_BASE}/api/shipments`,
        {
          method: id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error('خطأ أثناء حفظ البيانات');

      const savedShipment = await response.json();

      alert(id ? 'تم تعديل الشحنة بنجاح!' : 'تم إنشاء الشحنة بنجاح!');
      navigate('/dashboard', { state: { refresh: true, editedId: savedShipment.id } });
    } catch (error: any) {
      alert('حدث خطأ: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // RENDER SECTION CONTENT
  // ============================================

  const renderSectionContent = (sectionId: number) => {
    switch (sectionId) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Process Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع العملية *</label>
                <select
                  name="process_type"
                  value={formData.process_type}
                  onChange={handleChange}
                  disabled={!!id}
                  className={`w-full px-4 py-3 border rounded-lg ${
                    id
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200'
                      : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                >
                  <option value="import">استيراد</option>
                  <option value="export">تصدير</option>
                </select>
                {id && (
                  <p className="text-xs text-gray-500 mt-1">🔒 لا يمكن تغيير نوع العملية بعد إنشاء الشحنة</p>
                )}
              </div>

              {/* Movement Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ اليوم *</label>
                <input
                  type="date"
                  name="movement_date"
                  value={formData.movement_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Freight Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع الشحن</label>
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-2xl">🚛</span>
                  <span className="font-medium text-gray-700">بري (شاحنة)</span>
                  <span className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded-full mr-auto">TRK</span>
                </div>
                <input type="hidden" name="freight_type" value="TRK" />
              </div>
            </div>

            <div className="flex justify-start mt-6">
              <button
                type="button"
                onClick={() => completeSection(1)}
                disabled={!isSectionComplete(1)}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  isSectionComplete(1)
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                متابعة ←
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم العميل *</label>
                <AutoSuggestInput
                  field="client_name"
                  value={formData.client_name}
                  onChange={(value) => handleAutoSuggestChange('client_name', value)}
                  placeholder="اسم العميل"
                />
              </div>

              {/* Clearance Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">شركة التخليص</label>
                <input
                  type="text"
                  name="clearance_company"
                  value={formData.clearance_company}
                  onChange={handleChange}
                  placeholder="اختياري"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Container Leak Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">مسرب الحاوية</label>
                <select
                  name="container_leak_status"
                  value={formData.container_leak_status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              {/* Customs Permit Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم التصريح الجمركي</label>
                <input
                  type="text"
                  name="customs_permit_number"
                  value={formData.customs_permit_number}
                  onChange={handleChange}
                  placeholder="اختياري"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Goods Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">وصف البضاعة</label>
                <textarea
                  name="goods_description"
                  value={formData.goods_description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="وصف مختصر للبضاعة..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-start mt-6">
              <button
                type="button"
                onClick={() => completeSection(2)}
                disabled={!isSectionComplete(2)}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  isSectionComplete(2)
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                متابعة ←
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Container Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">حجم الحاوية</label>
                <select
                  name="container_size"
                  value={formData.container_size}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="20dry">📦 Dry 20 ft</option>
                  <option value="40dry">📦 Dry 40 ft</option>
                  <option value="40hcdry">📦 High Cube Dry 40 ft</option>
                  <option value="20reefer">❄️ Reefer 20 ft</option>
                  <option value="40reefer">❄️ Reefer 40 ft</option>
                  <option value="opentop20">📭 Open Top 20 ft</option>
                  <option value="opentop40">📭 Open Top 40 ft</option>
                  <option value="flatrack20">🔲 Flat Rack 20 ft</option>
                  <option value="flatrack40">🔲 Flat Rack 40 ft</option>
                  <option value="tank20">🛢️ Tank Container 20 ft</option>
                </select>
              </div>

              {/* Container Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">وزن الحاوية (طن) *</label>
                <input
                  type="number"
                  name="container_weight"
                  value={formData.container_weight}
                  onChange={handleChange}
                  min="2"
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Container Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم الحاوية *</label>
                <AutoSuggestInput
                  field="container_number"
                  value={formData.container_number}
                  onChange={(value) => handleAutoSuggestChange('container_number', value.toUpperCase())}
                  placeholder="ABCD1234567"
                />
                <p className="text-xs text-gray-500 mt-1">4 أحرف + 7 أرقام</p>
                {formErrors.container_number && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.container_number}</p>
                )}
              </div>

              {/* Shipping Line */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الخط الملاحي *</label>
                <input
                  type="text"
                  name="shipping_line"
                  value={formData.shipping_line}
                  onChange={handleChange}
                  placeholder="MSC"
                  maxLength={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">3 أحرف كبيرة</p>
                {formErrors.shipping_line && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.shipping_line}</p>
                )}
              </div>

              {/* Bill of Lading */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم البوليصة</label>
                <input
                  type="text"
                  name="bill_of_lading_number"
                  value={formData.bill_of_lading_number}
                  onChange={handleChange}
                  placeholder="اختياري"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-start mt-6">
              <button
                type="button"
                onClick={() => completeSection(3)}
                disabled={!isSectionComplete(3)}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  isSectionComplete(3)
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                متابعة ←
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">يرجى إدخال بيانات السائق والمركبة</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Driver Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم السائق *</label>
                <AutoSuggestInput
                  field="driver_name"
                  value={formData.driver_name}
                  onChange={(value) => handleAutoSuggestChange('driver_name', value)}
                  placeholder="اسم السائق"
                />
              </div>

              {/* Driver Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم هاتف السائق</label>
                <input
                  type="tel"
                  name="driver_phone"
                  value={formData.driver_phone}
                  onChange={handleChange}
                  placeholder="0791234567"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Tractor Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم القاطرة *</label>
                <input
                  type="text"
                  name="tractor_number"
                  value={formData.tractor_number}
                  onChange={handleChange}
                  placeholder="60-12345"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Trailer Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم المقطورة</label>
                <input
                  type="text"
                  name="trailer_number"
                  value={formData.trailer_number}
                  onChange={handleChange}
                  placeholder="71-12345"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-start mt-6">
              <button
                type="button"
                onClick={() => completeSection(4)}
                disabled={!isSectionComplete(4)}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  isSectionComplete(4)
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                متابعة ←
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Delivery/Loading Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.process_type === 'import' ? 'موقع التسليم' : 'موقع التحميل'} *
                </label>
                <input
                  type="text"
                  name={formData.process_type === 'import' ? 'delivery_location' : 'loading_location'}
                  value={formData.process_type === 'import' ? formData.delivery_location : formData.loading_location}
                  onChange={(e) => {
                    const field = formData.process_type === 'import' ? 'delivery_location' : 'loading_location';
                    setFormData({ ...formData, [field]: e.target.value });
                  }}
                  placeholder="عمان، الزرقاء، العقبة..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Delivery/Loading Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.process_type === 'import' ? 'تاريخ التسليم' : 'تاريخ التحميل'} *
                </label>
                <input
                  type="date"
                  name="delivery_date"
                  value={formData.delivery_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {dateError && <p className="text-red-500 text-sm mt-1">{dateError}</p>}
              </div>

              {/* Warehouse Manager */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">مسؤول المستودع *</label>
                <input
                  type="text"
                  name="warehouse_manager"
                  value={formData.warehouse_manager}
                  onChange={handleChange}
                  placeholder="اسم المسؤول"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Warehouse Manager Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم هاتف المسؤول</label>
                <input
                  type="tel"
                  name="warehouse_manager_phone"
                  value={formData.warehouse_manager_phone}
                  onChange={handleChange}
                  placeholder="0791234567"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Working Schedule */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-3">جدول عمل المستودع</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Days */}
                <div className="flex items-center gap-2">
                  <span className="text-sm">من</span>
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">اليوم</option>
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
                      setFormData((prev) => ({
                        ...prev,
                        working_schedule: {
                          ...prev.working_schedule!,
                          days: [prev.working_schedule?.days?.[0] || '', e.target.value],
                        },
                      }))
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">اليوم</option>
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
                  <span className="text-sm">الساعة</span>
                  <input
                    type="time"
                    value={formData.working_schedule?.start_time || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        working_schedule: { ...prev.working_schedule!, start_time: e.target.value },
                      }))
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <span className="text-sm">إلى</span>
                  <input
                    type="time"
                    value={formData.working_schedule?.end_time || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        working_schedule: { ...prev.working_schedule!, end_time: e.target.value },
                      }))
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              {timeError && <p className="text-red-500 text-sm mt-2">{timeError}</p>}
            </div>

            <div className="flex justify-start mt-6">
              <button
                type="button"
                onClick={() => completeSection(5)}
                disabled={!isSectionComplete(5)}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  isSectionComplete(5)
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                متابعة ←
              </button>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات إضافية</label>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                rows={4}
                placeholder="أي ملاحظات إضافية حول الشحنة..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-8 py-3 rounded-lg font-medium transition-all ${
                  isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isSubmitting ? 'جاري الحفظ...' : '✓ حفظ الشحنة'}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {id ? 'تعديل الشحنة' : 'نموذج الحاويات اليومية'}
              </h1>
              <p className="text-gray-500 mt-1">
                {id ? 'Edit Shipment' : 'Daily Containers Form'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
            >
              ✕ إغلاق
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <ProgressIndicator currentSection={activeSection} completedSections={completedSections} />
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {SECTIONS.map((section) => {
            const isActive = activeSection === section.id;
            const isCompleted = completedSections.includes(section.id);
            const maxAccessible = Math.max(...completedSections, 0) + 1;
            const isLocked = section.id > maxAccessible && !isCompleted;

            return (
              <div key={section.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <SectionHeader
                  section={section}
                  isActive={isActive}
                  isCompleted={isCompleted}
                  isLocked={isLocked}
                  onClick={() => handleSectionClick(section.id)}
                  summary={isCompleted ? getSectionSummary(section.id) : undefined}
                />

                {/* Section Content - Only render for active section */}
                {isActive && (
                  <div className="p-6 border-t border-gray-100">
                    {renderSectionContent(section.id)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};o

export default EnhancedShipmentForm;