'use strict';

const express = require('express');
const router = express.Router();
const catRoutes = require('./categories.routes');
const transactionsRoutes = require('./transactions.routes');

router.get('/status', (req, res) => {
    res.status(200);
    res.json({ status: 'ok' });
});

router.use('/categories', catRoutes);
router.use('/transactions', transactionsRoutes);

module.exports = router;
