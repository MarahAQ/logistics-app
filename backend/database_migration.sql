-- Add only NEW columns to shipments table (skip existing ones)
ALTER TABLE shipments 
ADD COLUMN IF NOT EXISTS clearance_company VARCHAR(255),
ADD COLUMN IF NOT EXISTS container_leak_status VARCHAR(20),
ADD COLUMN IF NOT EXISTS container_leak_custom VARCHAR(255),
ADD COLUMN IF NOT EXISTS customs_permit_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS goods_description TEXT,
ADD COLUMN IF NOT EXISTS container_size VARCHAR(20),
ADD COLUMN IF NOT EXISTS container_weight DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS shipping_line VARCHAR(10),
ADD COLUMN IF NOT EXISTS bill_of_lading_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS tractor_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS trailer_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS driver_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS delivery_location TEXT,
ADD COLUMN IF NOT EXISTS warehouse_manager VARCHAR(255),
ADD COLUMN IF NOT EXISTS warehouse_manager_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS warehouse_working_hours TEXT,
ADD COLUMN IF NOT EXISTS process_type VARCHAR(20) DEFAULT 'import',
ADD COLUMN IF NOT EXISTS waybill_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS print_count INTEGER DEFAULT 0;
-- Add columns for reference number and freight type
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS freight_type VARCHAR(10) DEFAULT 'TRK';
