import React from 'react';

// ============================================
// TYPES
// ============================================
interface ShipmentViewModalProps {
  shipment: any;
  onClose: () => void;
  onPrint?: () => void;  // 🆕 Print callback
}

// ============================================
// HELPER FUNCTIONS
// ============================================
const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('ar-EG');
};

const translateProcessType = (type: string) => {
  const translations: Record<string, string> = {
    'import': 'استيراد',
    'export': 'تصدير',
  };
  return translations[type] || type || '-';
};

const translateFreightType = (type: string) => {
  const translations: Record<string, string> = {
    'land': 'بري',
    'TRK': 'بري (شاحنة)',
    'trk': 'بري (شاحنة)',
  };
  return translations[type] || type || '-';
};

// ============================================
// FIELD DISPLAY COMPONENT
// ============================================
const Field: React.FC<{ label: string; value: any }> = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-xs text-gray-500 mb-1">{label}</span>
    <span className="text-sm text-gray-800 font-medium">{value || '-'}</span>
  </div>
);

// ============================================
// SECTION COMPONENT
// ============================================
const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ 
  title, 
  icon, 
  children 
}) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
      <span className="text-sky-500">{icon}</span>
      <h3 className="font-semibold text-gray-700">{title}</h3>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {children}
    </div>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const ShipmentViewModal: React.FC<ShipmentViewModalProps> = ({ shipment, onClose, onPrint }) => {
  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-l from-sky-50 to-white">
          <div>
            <h2 className="text-xl font-bold text-gray-800">تفاصيل الشحنة</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {shipment.reference_number || 'بدون رقم مرجع'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="إغلاق"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          
          {/* Section 1: معلومات العملية */}
          <Section 
            title="معلومات العملية" 
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          >
            <Field label="تاريخ اليوم" value={formatDate(shipment.movement_date)} />
            <Field label="رقم المرجع" value={shipment.reference_number} />
            <Field 
              label="نوع العملية" 
              value={
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  shipment.process_type === 'import' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {translateProcessType(shipment.process_type)}
                </span>
              } 
            />
            <Field label="نوع الشحن" value={translateFreightType(shipment.freight_type)} />
          </Section>

          {/* Section 2: معلومات العميل */}
          <Section 
            title="معلومات العميل" 
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          >
            <Field label="اسم العميل" value={shipment.client_name} />
            <Field label="شركة التخليص" value={shipment.clearance_company} />
            <Field label="مسرب الحاوية" value={shipment.container_leak_status} />
            <Field label="رقم التصريح الجمركي" value={shipment.customs_permit_number || shipment.permit_number} />
            <Field label="وصف البضاعة" value={shipment.goods_description} />
          </Section>

          {/* Section 3: معلومات الحاوية */}
          <Section 
            title="معلومات الحاوية" 
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          >
            <Field label="حجم الحاوية" value={shipment.container_size} />
            <Field label="رقم الحاوية" value={shipment.container_number} />
            <Field label="وزن الحاوية (طن)" value={shipment.container_weight} />
            <Field label="الخط الملاحي" value={shipment.shipping_line} />
            <Field label="رقم البوليصة" value={shipment.bill_of_lading_number} />
          </Section>

          {/* Section 4: معلومات السائق والمركبة */}
          <Section 
            title="معلومات السائق والمركبة" 
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 5h8m-4 5v-2a2 2 0 012-2h2a2 2 0 012 2v2M6 21h12a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            }
          >
            <Field label="اسم السائق" value={shipment.driver_name} />
            <Field label="رقم هاتف السائق" value={shipment.driver_phone} />
            <Field label="رقم القاطرة" value={shipment.tractor_number || shipment.vehicle_number} />
            <Field label="رقم المقطورة" value={shipment.trailer_number} />
          </Section>

          {/* Section 5: معلومات التسليم */}
          <Section 
            title="معلومات التسليم" 
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          >
            <Field label="موقع التسليم" value={shipment.delivery_location} />
            <Field label="موقع التحميل" value={shipment.loading_location} />
            <Field label="تاريخ التسليم" value={formatDate(shipment.delivery_date)} />
            <Field label="مسؤول المستودع" value={shipment.warehouse_manager} />
            <Field label="هاتف مسؤول المستودع" value={shipment.warehouse_manager_phone} />
            <Field label="ساعات عمل المستودع" value={shipment.warehouse_working_hours} />
          </Section>

          {/* Section 6: ملاحظات */}
          {shipment.notes && (
            <Section 
              title="ملاحظات" 
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              }
            >
              <div className="col-span-full">
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {shipment.notes}
                </p>
              </div>
            </Section>
          )}

          {/* Meta Info */}
          <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
            <span>تم الإنشاء: {formatDate(shipment.created_at)}</span>
            <span>آخر تحديث: {formatDate(shipment.updated_at)}</span>
          </div>
        </div>

        {/* Footer - 🆕 Added Print Button */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          {/* Print Button */}
          {onPrint && (
            <button
              onClick={onPrint}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              طباعة
            </button>
          )}
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors mr-auto"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShipmentViewModal;