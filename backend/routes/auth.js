const express = require('express');
const router = express.Router();

// Temporary basic route - we'll implement authentication later
router.get('/', (req, res) => {
  res.json({ message: 'Auth route is working!' });
});

module.exports = router;
