const express = require('express');
const pool = require('../config/database');
const router = express.Router();

/**
 * AUTO-SUGGESTIONS ROUTE
 * Must be BEFORE "/:id" or Express will treat "suggestions" as an id.
 */
router.get('/suggestions/search', async (req, res) => {
  try {
    const { field, query } = req.query;

    if (!field || !query) {
      return res.status(400).json({ error: 'Field and query parameters are required' });
    }

    const searchableFields = [
      'client_name',
      'container_number',
      'bill_of_lading_number',
      'goods_description',
      'driver_name',
      'permit_number'
    ];

    if (!searchableFields.includes(field)) {
      return res.status(400).json({ error: 'Invalid field for suggestions' });
    }

    const result = await pool.query(
      `SELECT DISTINCT ${field} FROM shipments
       WHERE ${field} ILIKE $1
         AND ${field} IS NOT NULL
         AND ${field} != ''
       ORDER BY ${field}
       LIMIT 10`,
      [`%${query}%`]
    );

    const suggestions = result.rows.map(row => row[field]);
    res.json(suggestions);
  } catch (error) {
    console.error('Suggestion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET all shipments
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shipments ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
});

// GET single shipment by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shipments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Shipment not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching shipment:', error);
    res.status(500).json({ error: 'Failed to fetch shipment' });
  }
});

// CREATE new shipment
router.post('/', async (req, res) => {
  try {
    const {
      movement_date,
      movement_type,   // 'استيراد' or 'تصدير'
      freight_type,    // 'AIR', 'SEA', 'TRK'
      customs_agent,
      client_name,
      permit_number,
      driver_name,
      container_number,
      unloading_date,
      delivery_date,
      clearance_company,
      container_leak_status,
      container_leak_custom,
      customs_permit_number,
      goods_description,
      container_size,
      container_weight,
      shipping_line,
      bill_of_lading_number,
      tractor_number,
      trailer_number,
      driver_phone,
      delivery_location,
      loading_location,               // NEW
      warehouse_manager,
      warehouse_manager_phone,
      warehouse_working_hours,
      notes
    } = req.body;

    // Derive normalized process_type
    const process_type = movement_type === 'تصدير' ? 'export' : 'import';

    // Convert empty dates to null
    const processedMovementDate = movement_date || null;
    const processedUnloadingDate = unloading_date || null;
    const processedDeliveryDate = delivery_date || null;

    // ======= Generate reference number =======
    const freightCode = freight_type ? String(freight_type).toUpperCase() : 'TRK';
    const movementCode = movement_type === 'تصدير' ? 'EXP' : 'IMP';
    const year = new Date().getFullYear();

    const countResult = await pool.query(
      `SELECT COUNT(*) AS count
       FROM shipments
       WHERE freight_type = $1
         AND movement_type = $2
         AND EXTRACT(YEAR FROM created_at) = $3`,
      [freightCode, movement_type, year]
    );

    const sequenceNumber = parseInt(countResult.rows[0].count, 10) + 1;
    const paddedNumber = String(sequenceNumber).padStart(4, '0');
    const reference_number = `${freightCode}-${movementCode}-${year}-${paddedNumber}`;

    // ======= Insert shipment =======
    const result = await pool.query(
      `INSERT INTO shipments (
        user_id, movement_date, movement_type, freight_type, reference_number,
        customs_agent, client_name, permit_number, driver_name, container_number,
        unloading_date, delivery_date,
        clearance_company, container_leak_status, container_leak_custom,
        customs_permit_number, goods_description, container_size,
        container_weight, shipping_line, bill_of_lading_number,
        tractor_number, trailer_number, driver_phone,
        delivery_location, loading_location,
        warehouse_manager, warehouse_manager_phone, warehouse_working_hours,
        process_type, notes
      ) VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10,
        $11,$12,
        $13,$14,$15,
        $16,$17,$18,
        $19,$20,$21,
        $22,$23,$24,
        $25,$26,
        $27,$28,$29,
        $30,$31
      ) RETURNING *`,
      [
        1, processedMovementDate, movement_type, freightCode, reference_number,
        customs_agent, client_name, permit_number, driver_name, container_number,
        processedUnloadingDate, processedDeliveryDate,
        clearance_company, container_leak_status, container_leak_custom,
        customs_permit_number, goods_description, container_size,
        container_weight, shipping_line, bill_of_lading_number,
        tractor_number, trailer_number, driver_phone,
        delivery_location, loading_location,
        warehouse_manager, warehouse_manager_phone, warehouse_working_hours,
        process_type, notes || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating shipment:', error);
    res.status(500).json({ error: 'Failed to create shipment' });
  }
});

// UPDATE shipment by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      movement_date,
      movement_type,
      freight_type,
      customs_agent,
      client_name,
      permit_number,
      driver_name,
      container_number,
      unloading_date,
      delivery_date,
      clearance_company,
      container_leak_status,
      container_leak_custom,
      customs_permit_number,
      goods_description,
      container_size,
      container_weight,
      shipping_line,
      bill_of_lading_number,
      tractor_number,
      trailer_number,
      driver_phone,
      delivery_location,
      loading_location,
      warehouse_manager,
      warehouse_manager_phone,
      warehouse_working_hours,
      notes
    } = req.body;

    // Derive normalized process_type
    const process_type = movement_type === 'تصدير' ? 'export' : 'import';

    const result = await pool.query(
      `UPDATE shipments SET
        movement_date = $1,
        movement_type = $2,
        freight_type = $3,
        customs_agent = $4,
        client_name = $5,
        permit_number = $6,
        driver_name = $7,
        container_number = $8,
        unloading_date = $9,
        delivery_date = $10,
        clearance_company = $11,
        container_leak_status = $12,
        container_leak_custom = $13,
        customs_permit_number = $14,
        goods_description = $15,
        container_size = $16,
        container_weight = $17,
        shipping_line = $18,
        bill_of_lading_number = $19,
        tractor_number = $20,
        trailer_number = $21,
        driver_phone = $22,
        delivery_location = $23,
        loading_location = $24,
        warehouse_manager = $25,
        warehouse_manager_phone = $26,
        warehouse_working_hours = $27,
        process_type = $28,
        notes = $29,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $30
      RETURNING *`,
      [
        movement_date || null,
        movement_type,
        freight_type ? String(freight_type).toUpperCase() : null,
        customs_agent,
        client_name,
        permit_number,
        driver_name,
        container_number,
        unloading_date || null,
        delivery_date || null,
        clearance_company,
        container_leak_status,
        container_leak_custom,
        customs_permit_number,
        goods_description,
        container_size,
        container_weight,
        shipping_line,
        bill_of_lading_number,
        tractor_number,
        trailer_number,
        driver_phone,
        delivery_location,
        loading_location,
        warehouse_manager,
        warehouse_manager_phone,
        warehouse_working_hours,
        process_type,
        notes || null,
        id
      ]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Shipment not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating shipment:', error);
    res.status(500).json({ error: 'Failed to update shipment' });
  }
});

// DELETE shipment by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM shipments WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Shipment not found' });
    res.json({ message: 'Shipment deleted successfully', deletedShipment: result.rows[0] });
  } catch (error) {
    console.error('Error deleting shipment:', error);
    res.status(500).json({ error: 'Failed to delete shipment' });
  }
});

module.exports = router;