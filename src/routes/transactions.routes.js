'use strict';

const express = require('express');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const transactionsController = require('../controllers/transactions.controller');
const upload = multer({ dest: 'tmp/' });

router.route('/')
    // Controller should detect if "category" value of transaction is empty/updated. If so, apply learning algs
    // Controller should also detect if single transaction or array of transactions, and transform accordingly
    .post(transactionsController.parse, transactionsController.format, transactionsController.categorize, (req, res) => {
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) throw err;
                
                res.status(200);
                return res.json( res.locals.transactions );
            });
        } else {
            res.status(200);
            return res.json( res.locals.transactions );
        }
    })
    .put(transactionsController.update, (req, res) => {
        res.status(200);
        res.json( res.locals.transaction );
    });

module.exports = router;
