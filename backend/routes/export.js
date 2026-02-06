const express = require('express');
const ExcelJS = require('exceljs');
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ============================================
// XLSX EXPORT ENDPOINT
// GET /api/export/xlsx
// 
// IMPORTANT:
// - Filter by process_type (English: 'import', 'export')
// - Filter by movement_date (the date operator enters in form)
// ============================================
router.get('/xlsx', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, movementType, clientName, status } = req.query;

    console.log('=== EXPORT REQUEST ===');
    console.log('Filters:', { startDate, endDate, movementType, clientName, status });

    // Build query
    let query = 'SELECT * FROM shipments WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Date filter - use movement_date (the date from the form, NOT created_at)
    if (startDate) {
      query += ` AND movement_date >= $${paramIndex}::date`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND movement_date <= $${paramIndex}::date`;
      params.push(endDate);
      paramIndex++;
    }

    // Movement type filter - use process_type column (English values)
    if (movementType && movementType !== 'all') {
      query += ` AND process_type = $${paramIndex}`;
      params.push(movementType); // 'import' or 'export'
      paramIndex++;
    }

    if (clientName) {
      query += ` AND client_name ILIKE $${paramIndex}`;
      params.push(`%${clientName}%`);
      paramIndex++;
    }

    // Note: status filter can be added later if needed

    query += ' ORDER BY movement_date DESC, created_at DESC';

    console.log('Query:', query);
    console.log('Params:', params);

    const result = await pool.query(query, params);
    const shipments = result.rows;

    console.log(`Found ${shipments.length} shipments`);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Jericho Transport';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('الشحنات', {
      properties: { rtl: true },
      views: [{ rightToLeft: true }]
    });

    // ============================================
    // COLUMNS - movement_date (تاريخ اليوم) FIRST!
    // ============================================
    worksheet.columns = [
      { header: 'تاريخ اليوم', key: 'movement_date', width: 15 },
      { header: 'رقم المرجع', key: 'reference_number', width: 18 },
      { header: 'نوع العملية', key: 'process_type', width: 12 },
      { header: 'نوع الشحن', key: 'freight_type', width: 12 },
      { header: 'اسم العميل', key: 'client_name', width: 25 },
      { header: 'شركة التخليص', key: 'clearance_company', width: 20 },
      { header: 'مسرب الحاوية', key: 'container_leak_status', width: 15 },
      { header: 'رقم التصريح الجمركي', key: 'customs_permit_number', width: 20 },
      { header: 'وصف البضاعة', key: 'goods_description', width: 30 },
      { header: 'حجم الحاوية', key: 'container_size', width: 12 },
      { header: 'رقم الحاوية', key: 'container_number', width: 18 },
      { header: 'وزن الحاوية (طن)', key: 'container_weight', width: 15 },
      { header: 'الخط الملاحي', key: 'shipping_line', width: 20 },
      { header: 'رقم البوليصة', key: 'bill_of_lading_number', width: 20 },
      { header: 'اسم السائق', key: 'driver_name', width: 20 },
      { header: 'رقم هاتف السائق', key: 'driver_phone', width: 15 },
      { header: 'رقم القاطرة', key: 'tractor_number', width: 15 },
      { header: 'رقم المقطورة', key: 'trailer_number', width: 15 },
      { header: 'موقع التسليم', key: 'delivery_location', width: 25 },
      { header: 'موقع التحميل', key: 'loading_location', width: 25 },
      { header: 'تاريخ التسليم', key: 'delivery_date', width: 15 },
      { header: 'مسؤول المستودع', key: 'warehouse_manager', width: 20 },
      { header: 'هاتف مسؤول المستودع', key: 'warehouse_manager_phone', width: 18 },
      { header: 'ملاحظات', key: 'notes', width: 35 },
      { header: 'تاريخ الإنشاء', key: 'created_at', width: 18 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0EA5E9' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF0369A1' } },
        left: { style: 'thin', color: { argb: 'FF0369A1' } },
        bottom: { style: 'thin', color: { argb: 'FF0369A1' } },
        right: { style: 'thin', color: { argb: 'FF0369A1' } }
      };
    });

    // Add data rows
    shipments.forEach((shipment, index) => {
      const row = worksheet.addRow({
        movement_date: formatDate(shipment.movement_date),
        reference_number: shipment.reference_number || '',
        process_type: translateProcessType(shipment.process_type),
        freight_type: translateFreightType(shipment.freight_type),
        client_name: shipment.client_name || '',
        clearance_company: shipment.clearance_company || '',
        container_leak_status: shipment.container_leak_status || '',
        customs_permit_number: shipment.customs_permit_number || '',
        goods_description: shipment.goods_description || '',
        container_size: shipment.container_size || '',
        container_number: shipment.container_number || '',
        container_weight: shipment.container_weight || '',
        shipping_line: shipment.shipping_line || '',
        bill_of_lading_number: shipment.bill_of_lading_number || '',
        driver_name: shipment.driver_name || '',
        driver_phone: shipment.driver_phone || '',
        tractor_number: shipment.tractor_number || '',
        trailer_number: shipment.trailer_number || '',
        delivery_location: shipment.delivery_location || '',
        loading_location: shipment.loading_location || '',
        delivery_date: formatDate(shipment.delivery_date),
        warehouse_manager: shipment.warehouse_manager || '',
        warehouse_manager_phone: shipment.warehouse_manager_phone || '',
        notes: shipment.notes || '',
        created_at: formatDateTime(shipment.created_at),
      });

      // Alternate row colors
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F9FF' }
        };
      }

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
        cell.alignment = { vertical: 'middle' };
      });

      row.height = 20;
    });

    // Summary row
    worksheet.addRow([]);
    const summaryRow = worksheet.addRow({
      movement_date: `إجمالي الشحنات: ${shipments.length}`,
    });
    summaryRow.font = { bold: true, size: 12 };

    // Freeze header
    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1, rightToLeft: true }
    ];

    // Send file
    const today = new Date().toISOString().split('T')[0];
    const filename = `shipments_${today}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();

    console.log('=== EXPORT COMPLETE ===');

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'فشل في تصدير البيانات' });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function translateProcessType(type) {
  const translations = {
    'import': 'استيراد',
    'export': 'تصدير',
  };
  return translations[type] || type || '';
}

function translateFreightType(type) {
  const translations = {
    'land': 'بري',
    'TRK': 'بري (شاحنة)',
    'trk': 'بري (شاحنة)',
  };
  return translations[type] || type || 'بري';
}

function formatDate(date) {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
}

function formatDateTime(date) {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return '';
  }
}

module.exports = router;