'use strict';

const express = require('express');
// const fs = require('fs');
const path = require('path');
const router = express.Router();
const catController = require('../controllers/categories.controller');

router.route('/')
    .get(catController.getAll, (req, res) => {
        res.status(200);
        res.json(res.locals.categories);
    }); 

module.exports = router;
