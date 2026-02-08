import React, { useEffect } from 'react';

// ============================================
// TYPES
// ============================================
interface ShipmentPrintViewProps {
  shipment: any;
  onClose: () => void;
}

// ============================================
// HELPERS
// ============================================
const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateTime = () => {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const translateProcessType = (type: string) => {
  if (type === 'import') return 'استيراد';
  if (type === 'export') return 'تصدير';
  return type || '-';
};

// ============================================
// GENERATE PRINT HTML
// ============================================
const generatePrintHTML = (shipment: any): string => {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>شحنة - ${shipment.reference_number || shipment.id}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      direction: rtl;
      background: white;
      color: #1a1a1a;
      padding: 20px;
      line-height: 1.5;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #0ea5e9;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    
    .header-title {
      font-size: 24px;
      font-weight: bold;
      color: #0ea5e9;
    }
    
    .header-logo {
      height: 50px;
    }
    
    .ref-box {
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .ref-label {
      font-size: 12px;
      opacity: 0.8;
      margin-bottom: 4px;
    }
    
    .ref-number {
      font-size: 18px;
      font-weight: bold;
      font-family: monospace;
      letter-spacing: 1px;
    }
    
    .ref-badges {
      display: flex;
      gap: 10px;
    }
    
    .badge {
      background: rgba(255,255,255,0.2);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 13px;
    }
    
    .section {
      margin-bottom: 20px;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: bold;
      color: #0ea5e9;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    
    .fields-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 30px;
    }
    
    .field-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dotted #e5e7eb;
    }
    
    .field-label {
      color: #6b7280;
      font-size: 13px;
    }
    
    .field-value {
      font-weight: 500;
      font-size: 13px;
      text-align: left;
      direction: ltr;
    }
    
    .notes-box {
      background: #f9fafb;
      padding: 12px 15px;
      border-radius: 8px;
      border-right: 4px solid #0ea5e9;
      font-size: 13px;
      line-height: 1.6;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #9ca3af;
    }
    
    .footer-logo {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .footer-logo img {
      height: 25px;
      opacity: 0.6;
    }
    
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="header-title">تفاصيل الشحنة</div>
    <img src="/jericho-logo.png" alt="Jericho Transport" class="header-logo" onerror="this.style.display='none'">
  </div>

  <!-- Reference Box -->
  <div class="ref-box">
    <div>
      <div class="ref-label">رقم المرجع</div>
      <div class="ref-number">${shipment.reference_number || '-'}</div>
    </div>
    <div class="ref-badges">
      <span class="badge">${translateProcessType(shipment.process_type)}</span>
      <span class="badge">${formatDate(shipment.movement_date)}</span>
    </div>
  </div>

  <!-- Section: Client Info -->
  <div class="section">
    <div class="section-title">معلومات العميل</div>
    <div class="fields-grid">
      <div class="field-row">
        <span class="field-label">اسم العميل</span>
        <span class="field-value">${shipment.client_name || '-'}</span>
      </div>
      <div class="field-row">
        <span class="field-label">شركة التخليص</span>
        <span class="field-value">${shipment.clearance_company || '-'}</span>
      </div>
    </div>
  </div>

  <!-- Section: Container Info -->
  <div class="section">
    <div class="section-title">معلومات الحاوية</div>
    <div class="fields-grid">
      <div class="field-row">
        <span class="field-label">رقم الحاوية</span>
        <span class="field-value">${shipment.container_number || '-'}</span>
      </div>
      <div class="field-row">
        <span class="field-label">حجم الحاوية</span>
        <span class="field-value">${shipment.container_size || '-'}</span>
      </div>
      <div class="field-row">
        <span class="field-label">وزن الحاوية (طن)</span>
        <span class="field-value">${shipment.container_weight || '-'}</span>
      </div>
      <div class="field-row">
        <span class="field-label">وصف البضاعة</span>
        <span class="field-value">${shipment.goods_description || '-'}</span>
      </div>
    </div>
  </div>

  <!-- Section: Driver & Vehicle -->
  <div class="section">
    <div class="section-title">معلومات السائق والمركبة</div>
    <div class="fields-grid">
      <div class="field-row">
        <span class="field-label">اسم السائق</span>
        <span class="field-value">${shipment.driver_name || '-'}</span>
      </div>
      <div class="field-row">
        <span class="field-label">رقم الهاتف</span>
        <span class="field-value">${shipment.driver_phone || '-'}</span>
      </div>
      <div class="field-row">
        <span class="field-label">رقم القاطرة</span>
        <span class="field-value">${shipment.tractor_number || shipment.vehicle_number || '-'}</span>
      </div>
      <div class="field-row">
        <span class="field-label">رقم المقطورة</span>
        <span class="field-value">${shipment.trailer_number || '-'}</span>
      </div>
    </div>
  </div>

  <!-- Section: Delivery Info -->
  <div class="section">
    <div class="section-title">معلومات التسليم</div>
    <div class="fields-grid">
      <div class="field-row">
        <span class="field-label">موقع التسليم</span>
        <span class="field-value">${shipment.delivery_location || '-'}</span>
      </div>
      <div class="field-row">
        <span class="field-label">تاريخ التسليم</span>
        <span class="field-value">${formatDate(shipment.delivery_date)}</span>
      </div>
      <div class="field-row">
        <span class="field-label">مسؤول المستودع</span>
        <span class="field-value">${shipment.warehouse_manager || '-'}</span>
      </div>
      <div class="field-row">
        <span class="field-label">هاتف المسؤول</span>
        <span class="field-value">${shipment.warehouse_manager_phone || '-'}</span>
      </div>
    </div>
  </div>

  <!-- Section: Notes -->
  ${shipment.notes ? `
  <div class="section">
    <div class="section-title">ملاحظات</div>
    <div class="notes-box">${shipment.notes}</div>
  </div>
  ` : ''}

  <!-- Footer -->
  <div class="footer">
    <div class="footer-logo">
      <img src="/jericho-logo.png" alt="" onerror="this.style.display='none'">
      <span>Jericho Transport | شركة أريحا للنقل</span>
    </div>
    <div>تم الطباعة: ${formatDateTime()}</div>
  </div>

  <script>
    // Auto print when loaded
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;
};

// ============================================
// MAIN COMPONENT
// ============================================
const ShipmentPrintView: React.FC<ShipmentPrintViewProps> = ({ shipment, onClose }) => {
  
  useEffect(() => {
    // Open print in new window
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (printWindow) {
      printWindow.document.write(generatePrintHTML(shipment));
      printWindow.document.close();
      
      // Close our modal after opening print window
      setTimeout(() => {
        onClose();
      }, 100);
    } else {
      // If popup blocked, show alert
      alert('يرجى السماح بالنوافذ المنبثقة لطباعة الشحنة');
      onClose();
    }
  }, [shipment, onClose]);

  // Show loading state briefly
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600">جاري فتح نافذة الطباعة...</p>
      </div>
    </div>
  );
};

export default ShipmentPrintView;