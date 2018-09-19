'use strict';

const autoCat = require('../categorize');
const categories = require('../../data/categories.json');
const csv = require('csvtojson');
const fs = require('fs');
const uuidv1 = require('uuid/v1');

function categorize(req, res, next) {
    res.locals.transactions = res.locals.transactions.map((transaction, index) => {
        transaction = autoCat(transaction);
        transaction.id = uuidv1();
        return transaction;
    });
    
    return next();
}

function format(req, res, next) {
    const csvData = fs.readFile(req.file.path, 'UTF-8', (err, csvParsed) => {
        if (err) return next(er);

        csv()
            .fromString(csvParsed)
            .then(jsonData => {
                // Remove some special characters
                Object.keys(jsonData).forEach((transaction, i) => {
                    jsonData[i].Description = jsonData[i].Description.replace('\`', '\'');
                });

                res.locals.transactions = jsonData;
                return next();
            })
            .catch(next);
    });
}

function parse(req, res, next) {
    return next();
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
