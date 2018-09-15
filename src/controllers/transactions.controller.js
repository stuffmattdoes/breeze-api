'use strict';

const csv = require('csvtojson');
const fs = require('fs');

function categorize(req, res, next) {
    return next();
}

function format(req, res, next) {
    const csvData = fs.readFile(req.file.path, 'UTF-8', (err, csvParsed) => {
        if (err) return next(er);

        csv()
            .fromString(csvParsed)
            .then(jsonData => {
                // dressData(jsonData);

                // Remove some special characters
                Object.keys(jsonData).forEach((transaction, i) => {
                    jsonData[i].Description = jsonData[i].Description.replace('\`', '\'');
                });

                console.log('Parsed:', jsonData);
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
