'use strict';

const autoCat = require('../categorize');
const categories = require('../../data/categories.json');
const csv = require('csvtojson');
const fs = require('fs');

function categorize(req, res, next) {
    res.locals.transactions = res.locals.transactions.map((transaction, index) => {
        transaction = autoCat(transaction);
        let cat = categories.find(cat => cat._id === transaction.category);
        transaction.category = cat.parentId ? [ categories.find(category => category._id === cat.parentId).name, cat.name ] : [ cat.name ];
        
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
