const express = require('express');
const pool = require('../config/database');
const router = express.Router();

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
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching shipment:', error);
    res.status(500).json({ error: 'Failed to fetch shipment' });
  }
});

// CREATE new shipment with all the Arabic fields
router.post('/', async (req, res) => {
  try {
    const {
      movement_date,
      movement_type,
      customs_agent,
      client_name,
      permit_number,
      driver_name,
      vehicle_number,
      invoice_number,
      container_number,
      unloading_date,
      delivery_date
    } = req.body;

    const result = await pool.query(
      `INSERT INTO shipments (
        user_id, movement_date, movement_type, customs_agent,
        client_name, permit_number, driver_name, vehicle_number,
        invoice_number, container_number, unloading_date, delivery_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [1, movement_date, movement_type, customs_agent, client_name,
       permit_number, driver_name, vehicle_number, invoice_number,
       container_number, unloading_date, delivery_date]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating shipment:', error);
    res.status(500).json({ error: 'Failed to create shipment' });
  }
});

module.exports = router;
