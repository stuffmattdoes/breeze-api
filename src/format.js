const csv = require('csvtojson');
const parseQFXtoJSON = require('ofx-js').parse;
const fs = require('fs');

// Original data
const data_seed = __dirname + '/../data/input/transactions_debit_seed.csv';
const data_1 = __dirname + '/../data/input/transactions_debit_1.csv';
const data_2 = __dirname + '/../data/input/transactions_debit_2.csv';
const data_3 = __dirname + '/../data/input/transactions_debit.QFX';
const locationFile = __dirname + '/../data/input/2017_Gaz_place_national.txt';
const locationFile2 = __dirname +  '/../data/input/uscitiesv1.4.csv';
// const wordVecsData = __dirname + '/../data/input/glove.demo.txt';
const wordVecsData = __dirname + '/../data/input/glove.6B.50d.txt';
// const wordVecsData = __dirname + '/../data/input/glove.42B.300d.txt';
// const wordVecsData = __dirname + '/../data/input/glove.820B.300d.txt';

// Formatted data
const categories = require('../data/categories.json');
const locations = require('../data/uscitiesv1.4.json');
// const transactions = require('../data/transactions_1.json');
// const wordVecs = require('../data/glove.json');

function formatCategories() {
    let catVecs = categories.map(cat => ({ ...cat, vex: vectorizePhrase(cat.name) }));

    fs.writeFile(__dirname + '/../data/categories.json', JSON.stringify(catVecs, null, 4), null, err => {
        if (err) throw err;
        console.log('Categories have been vectorized!');
    });
}

function formatCSVData(fileLocation) {
    const csvData = fs.readFile(fileLocation, 'UTF-8', (err, csvParsed) => {
        csv()
            .fromString(csvParsed)
            .then(jsonData => {
                // dressData(jsonData);

                // Remove some special characters
                Object.keys(jsonData).forEach((transaction, i) => {
                    jsonData[i].Description = jsonData[i].Description.replace('\`', '\'');
                });

                fs.writeFile('./data/transactions_1.json', JSON.stringify(jsonData, null, 4), null, err => {
                    if (err) throw err;
                    console.log('CSV -> JSON data has been saved!');
                });
            });
    });
}

function formatQFXData(fileLocation) {
    const qfxData = fs.readFile(fileLocation, 'UTF-8', (err, qfxParsed) => {
        if (err) throw err;

        parseQFXtoJSON(qfxParsed)
            .then(jsonData => {

                fs.writeFile('./data/qfx_transactions.json', JSON.stringify(jsonData, null, 4), null, err => {
                    if (err) throw err;

                    console.log('QFX -> JSON data has been saved!');
                }); 
            })
            .catch(err => console.log('Error:', err));
    });
}

function formatCityData(locationFile) {
    fs.readFile(locationFile, 'UTF-8', (err, data) => {
        if (err) throw err;

        const legend = data.split(/[\r\n]/)[0].trim().split(/\t/);
        locationData = data.split(/[\r\n]/).map(location => { 
            const locMeta = location.split(/\t/).map(token => token.trim());
            const locObj = {};
            legend.forEach((key, i) => locObj[key] = locMeta[i]);
            return locObj;
        });

        locationData.shift();

        if (!locationData[locationData.length - 1].USPS) {
            locationData.pop();
        }

        fs.writeFile('./data/cities_us_2018.json', JSON.stringify(locationData, null, 4), null, err => {
            if (err) throw err;
            console.log('City data has been saved!');
        });
    });
}

function formatCityData2(locationFile) {
    fs.readFile(locationFile, 'UTF-8', (err, data) => {
        if (err) throw err;

        csv()
            // .fromFile(data_1)
            .fromString(data)
            .then(jsonData => {
                fs.writeFile('./data/uscitiesv1.4.json', JSON.stringify(jsonData, null, 4), null, err => {
                    if (err) throw err;
                    console.log('CSV -> JSON data has been saved!');
                });
            });
    });
}

function formatWordVecs(wordVecs) {
    // let wv = [];
    let wv = {};
    
    fs.readFile(wordVecs, 'UTF-8', (err, vecs) => {
        vecs.trim().split(/[\r\n]/).forEach(vec => {
            let vectors = vec.split(/\s+/);
            let word = vectors.shift();
            vectors = vectors.map(vector => parseFloat(vector));

            wv[word] = vectors;
            // wv.push({ [word]: vectors });
        });

        fs.writeFile('./data/glove.json', JSON.stringify(wv), null, err => {
            if (err) throw err;
            console.log('GloVe -> JSON data has been saved!');
        })
    });
}   

// formatCategories();
// formatQFXData(data_2);
// formatCSVData(data_1);
// formatCityData(locationFile);
// formatCityData2(locationFile2);
formatWordVecs(wordVecsData);
