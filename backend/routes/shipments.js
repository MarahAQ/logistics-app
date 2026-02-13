const express = require('express');
const pool = require('../config/database');
const router = express.Router();

/* =========================================================
   AUTO-SUGGESTIONS
========================================================= */
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
      `SELECT DISTINCT ${field}
       FROM shipments
       WHERE ${field} ILIKE $1
         AND ${field} IS NOT NULL
         AND ${field} != ''
       ORDER BY ${field}
       LIMIT 10`,
      [`%${query}%`]
    );

    res.json(result.rows.map(r => r[field]));
  } catch (error) {
    console.error('Suggestion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* =========================================================
   GET ALL
========================================================= */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM shipments ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch shipments error:', error);
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
});

/* =========================================================
   GET BY ID
========================================================= */
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM shipments WHERE id = $1',
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fetch shipment error:', error);
    res.status(500).json({ error: 'Failed to fetch shipment' });
  }
});

/* =========================================================
   CREATE
========================================================= */
router.post('/', async (req, res) => {
  try {
    const {
      movement_date,
      movement_type,
      process_type,
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

    const normalizedProcessType =
      process_type === 'export' ? 'export' : 'import';

    const freightCode = freight_type?.toUpperCase() || 'TRK';
    const movementCode = normalizedProcessType === 'export' ? 'EXP' : 'IMP';
    const year = new Date().getFullYear();

    const maxResult = await pool.query(
      `
      SELECT MAX(
        CAST(SPLIT_PART(reference_number, '-', 4) AS INTEGER)
      ) AS max_seq
      FROM shipments
      WHERE freight_type = $1
        AND process_type = $2
        AND reference_number LIKE $3
      `,
      [
        freightCode,
        normalizedProcessType,
        `${freightCode}-${movementCode}-${year}-%`
      ]
    );

    const nextSequence = (Number(maxResult.rows[0].max_seq) || 0) + 1;
    const sequence = String(nextSequence).padStart(4, '0');
    const reference_number =
      `${freightCode}-${movementCode}-${year}-${sequence}`;

    const result = await pool.query(
      `INSERT INTO shipments (
        user_id,
        movement_date,
        movement_type,
        freight_type,
        reference_number,
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
        process_type,
        notes
      )
      VALUES (
        1,
        $1,$2,$3,$4,
        $5,$6,$7,$8,$9,
        $10,$11,
        $12,$13,$14,
        $15,$16,$17,
        $18,$19,$20,
        $21,$22,$23,
        $24,$25,$26,
        $27,$28,$29,
        $30
      )
      RETURNING *`,
      [
        movement_date || null,
        movement_type || null,
        freightCode,
        reference_number,
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
        normalizedProcessType,
        notes || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create shipment error:', error);
    res.status(500).json({ error: 'Failed to create shipment' });
  }
});

/* =========================================================
   UPDATE (process_type locked)
========================================================= */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 🔒 Prevent process_type modification
    const existing = await pool.query(
      'SELECT process_type FROM shipments WHERE id = $1',
      [id]
    );

    if (!existing.rows.length) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    if (
      req.body.process_type &&
      req.body.process_type !== existing.rows[0].process_type
    ) {
      return res.status(400).json({
        error: 'Changing process_type is not allowed'
      });
    }

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
        notes = $28,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $29
      RETURNING *`,
      [
        req.body.movement_date || null,
        req.body.movement_type || null,
        req.body.freight_type?.toUpperCase() || null,
        req.body.customs_agent,
        req.body.client_name,
        req.body.permit_number,
        req.body.driver_name,
        req.body.container_number,
        req.body.unloading_date || null,
        req.body.delivery_date || null,
        req.body.clearance_company,
        req.body.container_leak_status,
        req.body.container_leak_custom,
        req.body.customs_permit_number,
        req.body.goods_description,
        req.body.container_size,
        req.body.container_weight,
        req.body.shipping_line,
        req.body.bill_of_lading_number,
        req.body.tractor_number,
        req.body.trailer_number,
        req.body.driver_phone,
        req.body.delivery_location,
        req.body.loading_location,
        req.body.warehouse_manager,
        req.body.warehouse_manager_phone,
        req.body.warehouse_working_hours,
        req.body.notes || null,
        id
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update shipment error:', error);
    res.status(500).json({ error: 'Failed to update shipment' });
  }
});

/* =========================================================
   DELETE
========================================================= */
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM shipments WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    res.json({
      message: 'Shipment deleted successfully',
      deletedShipment: result.rows[0]
    });
  } catch (error) {
    console.error('Delete shipment error:', error);
    res.status(500).json({ error: 'Failed to delete shipment' });
  }
});

module.exports = router;