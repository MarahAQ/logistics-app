// frontend/src/types/shipment.ts

export type MovementType = 'استيراد' | 'تصدير';
export type FreightType = 'AIR' | 'SEA' | 'TRK' | '';
export type ContainerLeakStatus = 'green' | 'yellow' | 'red' | 'other';

export type ShipmentStatus = 'open' | 'in_progress' | 'ready_for_accountant' | 'closed';

// UI-only schedule type (used in EnhancedShipmentForm)
export type WorkingSchedule = {
  type: 'preset' | 'custom';
  preset?: 'sun-thu' | 'sat-wed' | 'custom';
  days?: [string, string];
  start_time?: string;
  end_time?: string;
};

// ✅ This is what the form uses
export interface ShipmentFormData {
  movement_date: string;
  movement_type: MovementType;

  freight_type: FreightType;

  client_name: string;
  driver_name: string;
  invoice_number: string;
  container_number: string;

  // Phase 1: still using delivery_date for both (until loading_date is added)
  delivery_date: string;

  clearance_company: string;

  container_leak_status: ContainerLeakStatus;
  container_leak_custom: string;

  customs_permit_number: string;
  goods_description: string;

  container_size: string;
  container_weight: number;

  shipping_line: string;
  bill_of_lading_number: string;

  tractor_number: string;
  trailer_number: string;

  driver_phone: string;

  delivery_location: string;
  loading_location: string;

  warehouse_manager: string;
  warehouse_manager_phone: string;

  process_type?: string;

  notes?: string;

  // UI-only
  working_schedule?: WorkingSchedule;

  // Optional for now (frontend-only if backend doesn't support yet)
  status?: ShipmentStatus;
}

// ✅ This represents rows coming from backend
export interface Shipment {
  id: number;
  user_id: number;

  reference_number?: string | null;

  movement_date: string | null;
  movement_type: string | null;
  freight_type: string | null;
  process_type?: string | null;

  client_name: string | null;
  clearance_company: string | null;
  customs_agent?: string | null;

  permit_number: string | null;
  customs_permit_number: string | null;
  invoice_number: string | null;

  container_number: string | null;
  container_size: string | null;
  container_weight: number | null;
  container_leak_status: string | null;
  container_leak_custom: string | null;

  shipping_line: string | null;
  bill_of_lading_number: string | null;
  goods_description: string | null;

  driver_name: string | null;
  driver_phone: string | null;
  vehicle_number?: string | null;
  tractor_number: string | null;
  trailer_number: string | null;

  delivery_location: string | null;
  loading_location?: string | null;

  unloading_date?: string | null;
  delivery_date: string | null;

  warehouse_manager: string | null;
  warehouse_manager_phone: string | null;
  warehouse_working_hours?: string | null;

  notes?: string | null;

  // Optional for now (if not in DB yet it will be undefined)
  status?: ShipmentStatus | null;

  created_at: string;
  updated_at: string;
}