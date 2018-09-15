'use strict';

const express = require('express');
const router = express.Router();
const routes = require('./routes');

// Set API version
router.use('/v1', routes);

module.exports = router;
