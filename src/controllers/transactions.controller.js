'use strict';

const autoCat = require('../categorize');
const categories = require('../../data/categories.json');
const csv = require('csvtojson');
const fs = require('fs');
const multer = require('multer');
const uuidv1 = require('uuid/v1');
const uuidv4 = require('uuid/v4');

function categorize(req, res, next) {
    res.locals.transactions = res.locals.transactions.map(autoCat);
    
    return next();
}

function formatCSV(req, res, next) {
    const csvData = fs.readFile(req.file.path, 'UTF-8', (err, csvParsed) => {
        if (err) return next(er);

        csv()
            .fromString(csvParsed)
            .then(jsonData => {
                // Map our CSV data to a more uniform format
                let transactions = jsonData.map(transaction => ({
                    amount: parseFloat((transaction.Deposits || '-' + transaction.Withdrawals).replace(/\$/, '')),
                    id: uuidv4(),
                    date: transaction.Date,
                    descriptor: transaction.Description.replace('\`', '\'').replace(/\s+/g, ' ')
                }));

                res.locals.transactions = transactions;
                return next();
            })
            .catch(next);
    });
}

function format(req, res, next) {
    if (!req.file) {
        return next();
    }

    switch(req.file.mimetype) {
        case 'text/csv':
            return formatCSV(req, res, next);
        case 'application/octet-stream':
            return formatQFX(req, res, next);
        default:
            return next();
    }
}

function parse(req, res, next) {
    const contentType = req.headers['content-type'];

    if (contentType.indexOf('multipart/form-data') > -1) {
        return multer({ dest: 'tmp/' }).single('transactions_csv')(req, res, next);
    } else if (contentType.indexOf('application/json') > -1) {
        res.locals.transactions = req.body;
        return next();
    }
}

function update(req, res, next) {
    return next();
}

module.exports = {
    categorize,
    format,
    parse,
    update
}
