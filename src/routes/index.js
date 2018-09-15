'use strict';

const express = require('express');
const router = express.Router();
const transactionsRoutes = require('./transactions.routes');

router.get('/status', (req, res) => {
    res.status(200);
    res.json({ status: 'ok' });
});

router.use('/transactions', transactionsRoutes);

module.exports = router;
