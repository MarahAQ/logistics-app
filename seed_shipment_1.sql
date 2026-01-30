BEGIN;

DELETE FROM shipments
WHERE reference_number LIKE 'DUMMY-%';

INSERT INTO shipments (
  user_id,
  movement_date,
  movement_type,
  client_name,
  driver_name,
  container_number,
  delivery_date,
  container_weight,
  shipping_line,
  delivery_location,
  loading_location,
  warehouse_manager,
  warehouse_working_hours,
  notes,
  reference_number,
  freight_type
)
VALUES
-- 1
(1, CURRENT_DATE - 15, 'استيراد', 'شركة الأمل', 'خالد', 'MSCU1234567', CURRENT_DATE - 12, 22.5, 'MSC', 'ميناء العقبة', NULL, 'محمد', 'الأحد-الخميس 8-16', 'تجربة', 'DUMMY-REF-001', 'TRK'),

-- 2
(1, CURRENT_DATE - 14, 'تصدير', 'شركة النور', 'علي', 'MAEU7654321', CURRENT_DATE - 11, 18.2, 'CMA', NULL, 'مستودع سحاب', 'سليم', 'الأحد-الخميس 9-17', 'تجربة', 'DUMMY-REF-002', 'SEA'),

-- 3
(1, CURRENT_DATE - 13, 'استيراد', 'شركة الشرق', 'مروان', 'HLCU1111222', CURRENT_DATE - 10, 30.7, 'HLC', 'الزرقاء', NULL, 'رامي', '8-16', '', 'DUMMY-REF-003', 'TRK'),

-- 4
(1, CURRENT_DATE - 12, 'تصدير', 'شركة الهلال', 'يوسف', 'TGHU3333444', CURRENT_DATE - 9, 12.3, 'MSC', NULL, 'ميناء العقبة', 'فادي', '7-15', '', 'DUMMY-REF-004', 'AIR'),

-- 5
(1, CURRENT_DATE - 11, 'استيراد', 'شركة التقنية', 'حسن', 'OOLU5555666', CURRENT_DATE - 8, 25.1, 'ONE', 'المقابلين', NULL, 'نبيل', '9-17', '', 'DUMMY-REF-005', 'TRK'),

-- 6
(1, CURRENT_DATE - 10, 'تصدير', 'شركة العالمية', 'طارق', 'SEGU7777888', CURRENT_DATE - 7, 28.0, 'MSC', NULL, 'سحاب', 'وسام', '8-16', '', 'DUMMY-REF-006', 'SEA'),

-- 7
(1, CURRENT_DATE - 9, 'استيراد', 'شركة الروابي', 'زياد', 'CMAU9999000', CURRENT_DATE - 6, 20.0, 'CMA', 'ماركا', NULL, 'سيف', '9-17', '', 'DUMMY-REF-007', 'TRK'),

-- 8
(1, CURRENT_DATE - 8, 'تصدير', 'شركة الشروق', 'هيثم', 'MSCU0000111', CURRENT_DATE - 5, 10.0, 'MSC', NULL, 'المطار', 'عمر', '8-16', '', 'DUMMY-REF-008', 'AIR'),

-- 9
(1, CURRENT_DATE - 7, 'استيراد', 'شركة الاتحاد', 'سعد', 'HLCU2222333', CURRENT_DATE - 4, 19.3, 'HLC', 'الماضونة', NULL, 'مازن', '9-17', '', 'DUMMY-REF-009', 'TRK'),

-- 10
(1, CURRENT_DATE - 6, 'تصدير', 'شركة المها', 'فراس', 'MAEU4444555', CURRENT_DATE - 3, 14.7, 'ONE', NULL, 'سحاب', 'ليث', '8-16', '', 'DUMMY-REF-010', 'SEA'),

-- 11
(1, CURRENT_DATE - 5, 'استيراد', 'شركة البيان', 'سامر', 'MSCU8888777', CURRENT_DATE - 2, 21.4, 'MSC', 'العقبة', NULL, 'أدهم', '8-16', '', 'DUMMY-REF-011', 'TRK'),

-- 12
(1, CURRENT_DATE - 4, 'تصدير', 'شركة المستقبل', 'نادر', 'CMAU5555444', CURRENT_DATE - 1, 16.8, 'CMA', NULL, 'ميناء العقبة', 'أيمن', '9-17', '', 'DUMMY-REF-012', 'SEA'),

-- 13
(1, CURRENT_DATE - 3, 'استيراد', 'شركة السعد', 'ماهر', 'HLCU9999888', CURRENT_DATE + 1, 23.9, 'HLC', 'البيادر', NULL, 'طارق', '8-16', '', 'DUMMY-REF-013', 'TRK'),

-- 14
(1, CURRENT_DATE - 2, 'تصدير', 'شركة التقدم', 'رامز', 'SEGU1234432', CURRENT_DATE + 2, 11.5, 'MSC', NULL, 'سحاب', 'سامي', '8-16', '', 'DUMMY-REF-014', 'AIR'),

-- 15
(1, CURRENT_DATE - 1, 'استيراد', 'شركة الإبداع', 'علاء', 'OOLU7777666', CURRENT_DATE + 3, 27.0, 'ONE', 'المطار', NULL, 'خالد', '9-17', '', 'DUMMY-REF-015', 'TRK');

COMMIT;